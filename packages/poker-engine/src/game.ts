/**
 * 노리밋 텍사스 홀덤 핸드 상태 머신.
 *
 * 순수 로직: 네트워크/타이머를 모른다. 서버가 이 엔진을 감싸서
 * 액션을 검증하고 상태를 브로드캐스트한다.
 *
 * 사용 흐름:
 *   let s = startHand(config);
 *   while (!isHandOver(s)) s = applyAction(s, action);
 *   // s.result 에 승자/분배 결과
 *
 * 알려진 단순화(v1): all-in 이 정규 레이즈 미만(short all-in)일 때도
 * 이후 플레이어의 재레이즈를 막지 않는다. 드문 케이스라 후속 개선 대상.
 */

import type { Card } from "./cards.js";
import { shuffledDeck } from "./cards.js";
import { compareHands, evaluateHand, type HandRank } from "./handEvaluator.js";

export type Street = "preflop" | "flop" | "turn" | "river" | "showdown" | "complete";

export type PlayerStatus = "active" | "folded" | "allin" | "out";

export interface PlayerState {
  id: string;
  seat: number;
  stack: number; // 남은 칩
  committed: number; // 이번 베팅 라운드에 낸 칩
  totalCommitted: number; // 이번 핸드 전체에 낸 칩 (사이드팟 계산용)
  holeCards: Card[];
  status: PlayerStatus;
  hasActed: boolean; // 현재 라운드에서 행동했는가
}

export interface Pot {
  amount: number;
  eligibleSeats: number[]; // 이 팟을 획득할 자격이 있는 좌석(폴드 제외)
}

export interface Award {
  seat: number;
  amount: number;
}

export interface ShowdownEntry {
  seat: number;
  hand: HandRank | null; // 쇼다운까지 안 간 경우 null
}

export interface HandResult {
  awards: Award[];
  showdown: ShowdownEntry[];
  wentToShowdown: boolean;
}

export interface HandState {
  players: PlayerState[]; // 좌석 순서
  buttonIndex: number; // players 배열 인덱스
  smallBlind: number;
  bigBlind: number;
  deck: Card[]; // 남은 덱 (서버 전용, 클라이언트로 보내지 않음)
  board: Card[];
  street: Street;
  currentBet: number; // 이번 라운드 최고 committed
  minRaise: number; // 다음 레이즈 최소 증가폭
  actingIndex: number; // 현재 행동할 players 인덱스 (-1 = 없음)
  pots: Pot[];
  log: string[];
  result?: HandResult;
}

export interface SeatConfig {
  id: string;
  stack: number;
}

export interface HandConfig {
  seats: SeatConfig[]; // 참가자 (좌석 순서)
  buttonIndex: number;
  smallBlind: number;
  bigBlind: number;
  seed?: number;
  deck?: Card[]; // 테스트용 프리셋 덱 (앞에서부터 소비)
}

export type Action =
  | { type: "fold" }
  | { type: "check" }
  | { type: "call" }
  | { type: "bet"; to: number } // to = 이번 라운드 목표 총 committed
  | { type: "raise"; to: number }
  | { type: "allin" };

// ─────────────────────────────────────────────────────────────────────────
// 좌석 순회 헬퍼
// ─────────────────────────────────────────────────────────────────────────

function nextIndex(players: PlayerState[], from: number): number {
  return (from + 1) % players.length;
}

/** from 다음(from 포함 안 함)부터 조건을 만족하는 첫 인덱스. 없으면 -1. */
function findFrom(
  players: PlayerState[],
  from: number,
  pred: (p: PlayerState) => boolean,
): number {
  for (let i = 1; i <= players.length; i++) {
    const idx = (from + i) % players.length;
    if (pred(players[idx]!)) return idx;
  }
  return -1;
}

function activeCount(players: PlayerState[]): number {
  return players.filter((p) => p.status === "active").length;
}

/** 아직 핸드에 살아있는(폴드/아웃 아님) 플레이어 수. all-in 포함. */
function inHandCount(players: PlayerState[]): number {
  return players.filter((p) => p.status === "active" || p.status === "allin").length;
}

// ─────────────────────────────────────────────────────────────────────────
// 핸드 시작
// ─────────────────────────────────────────────────────────────────────────

export function startHand(config: HandConfig): HandState {
  const { seats, buttonIndex, smallBlind, bigBlind } = config;
  if (seats.length < 2) throw new Error("최소 2명이 필요합니다");
  if (buttonIndex < 0 || buttonIndex >= seats.length) throw new Error("잘못된 buttonIndex");

  const deck = config.deck ? config.deck.slice() : shuffledDeck(config.seed);

  const players: PlayerState[] = seats.map((s, i) => ({
    id: s.id,
    seat: i,
    stack: s.stack,
    committed: 0,
    totalCommitted: 0,
    holeCards: [],
    status: s.stack > 0 ? "active" : "out",
    hasActed: false,
  }));

  const state: HandState = {
    players,
    buttonIndex,
    smallBlind,
    bigBlind,
    deck,
    board: [],
    street: "preflop",
    currentBet: 0,
    minRaise: bigBlind,
    actingIndex: -1,
    pots: [],
    log: [],
  };

  // 홀카드 2장씩 (한 장씩 두 바퀴)
  for (let round = 0; round < 2; round++) {
    for (let i = 0; i < players.length; i++) {
      const idx = (buttonIndex + 1 + i) % players.length;
      const p = players[idx]!;
      if (p.status !== "out") p.holeCards.push(state.deck.shift()!);
    }
  }

  const headsUp = activeCount(players) === 2;
  const sbIndex = headsUp
    ? buttonIndex
    : findFrom(players, buttonIndex, (p) => p.status === "active");
  const bbIndex = findFrom(players, sbIndex, (p) => p.status === "active");

  postBlind(state, sbIndex, smallBlind, "SB");
  postBlind(state, bbIndex, bigBlind, "BB");
  state.currentBet = bigBlind;
  state.minRaise = bigBlind;

  // 프리플랍 첫 행동: 헤즈업이면 버튼(SB), 아니면 BB 다음
  const firstToAct = headsUp
    ? findFrom(players, bbIndex, (p) => p.status === "active") // BB 다음 = SB(버튼)
    : findFrom(players, bbIndex, (p) => p.status === "active");
  state.actingIndex = firstToAct;

  state.log.push(`핸드 시작 (버튼 seat ${players[buttonIndex]!.seat})`);
  return state;
}

function postBlind(state: HandState, index: number, amount: number, label: string): void {
  const p = state.players[index]!;
  const pay = Math.min(p.stack, amount);
  p.stack -= pay;
  p.committed += pay;
  p.totalCommitted += pay;
  if (p.stack === 0) p.status = "allin";
  state.log.push(`${p.id} ${label} ${pay}`);
}

// ─────────────────────────────────────────────────────────────────────────
// 합법 액션 조회
// ─────────────────────────────────────────────────────────────────────────

export interface LegalActions {
  seat: number;
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canRaise: boolean;
  minRaiseTo: number; // bet/raise 시 목표 총 committed 하한
  maxRaiseTo: number; // all-in 상한
}

export function legalActions(state: HandState): LegalActions | null {
  if (state.actingIndex < 0) return null;
  const p = state.players[state.actingIndex]!;
  const callAmount = Math.min(p.stack, state.currentBet - p.committed);
  const canCheck = state.currentBet - p.committed <= 0;
  const maxRaiseTo = p.committed + p.stack; // all-in
  const rawMinRaiseTo = state.currentBet > 0 ? state.currentBet + state.minRaise : state.bigBlind;
  const minRaiseTo = Math.min(rawMinRaiseTo, maxRaiseTo);
  // 콜 이상으로 낼 칩이 남아야 레이즈 가능
  const canRaise = p.stack > callAmount;

  return {
    seat: p.seat,
    canFold: true,
    canCheck,
    canCall: !canCheck && callAmount > 0,
    callAmount,
    canRaise,
    minRaiseTo,
    maxRaiseTo,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 액션 적용
// ─────────────────────────────────────────────────────────────────────────

export function applyAction(state: HandState, action: Action): HandState {
  const s = cloneState(state);
  if (s.actingIndex < 0) throw new Error("지금은 행동할 차례가 아닙니다");
  const p = s.players[s.actingIndex]!;
  const legal = legalActions(s)!;

  switch (action.type) {
    case "fold": {
      p.status = "folded";
      p.hasActed = true;
      s.log.push(`${p.id} fold`);
      break;
    }
    case "check": {
      if (!legal.canCheck) throw new Error("체크할 수 없습니다 (콜 필요)");
      p.hasActed = true;
      s.log.push(`${p.id} check`);
      break;
    }
    case "call": {
      if (legal.canCheck) throw new Error("콜할 게 없습니다 (체크하세요)");
      commit(s, p, legal.callAmount);
      p.hasActed = true;
      s.log.push(`${p.id} call ${legal.callAmount}`);
      break;
    }
    case "bet":
    case "raise": {
      applyRaise(s, p, action.to, legal);
      break;
    }
    case "allin": {
      const to = legal.maxRaiseTo;
      if (to <= s.currentBet) {
        // 콜 all-in (콜 금액보다 스택이 적거나 같음)
        commit(s, p, p.stack);
        p.hasActed = true;
        s.log.push(`${p.id} all-in (call) ${p.committed}`);
      } else {
        applyRaise(s, p, to, legal);
      }
      break;
    }
  }

  advance(s);
  return s;
}

function applyRaise(s: HandState, p: PlayerState, to: number, legal: LegalActions): void {
  const isAllIn = to === legal.maxRaiseTo;
  if (to > legal.maxRaiseTo) throw new Error("스택보다 많이 베팅할 수 없습니다");
  if (!legal.canRaise) throw new Error("레이즈할 칩이 없습니다");
  if (to < legal.minRaiseTo && !isAllIn) {
    throw new Error(`최소 ${legal.minRaiseTo} 까지 올려야 합니다`);
  }

  const increment = to - s.currentBet;
  commit(s, p, to - p.committed);

  if (to > s.currentBet) {
    // 정규 레이즈면 minRaise 갱신
    if (increment >= s.minRaise) s.minRaise = increment;
    s.currentBet = to;
    // 다른 살아있는 플레이어에게 다시 행동 기회
    for (const other of s.players) {
      if (other !== p && other.status === "active") other.hasActed = false;
    }
  }
  p.hasActed = true;
  s.log.push(`${p.id} ${isAllIn ? "all-in " : ""}raise to ${to}`);
}

/** 플레이어가 amount 칩을 팟에 낸다 (스택에서 차감). */
function commit(s: HandState, p: PlayerState, amount: number): void {
  const pay = Math.min(p.stack, amount);
  p.stack -= pay;
  p.committed += pay;
  p.totalCommitted += pay;
  if (p.stack === 0) p.status = "allin";
}

// ─────────────────────────────────────────────────────────────────────────
// 진행 (라운드 종료 판정 / 스트리트 전환 / 쇼다운)
// ─────────────────────────────────────────────────────────────────────────

function roundComplete(s: HandState): boolean {
  const actives = s.players.filter((p) => p.status === "active");
  if (actives.length === 0) return true;
  // 살아있는(행동 가능) 플레이어가 1명뿐이고 벨류를 콜해야 할 상대가 없으면 종료
  for (const p of actives) {
    if (!p.hasActed) return false;
    if (p.committed !== s.currentBet) return false;
  }
  return true;
}

function nextToAct(s: HandState): number {
  return findFrom(
    s.players,
    s.actingIndex,
    (p) => p.status === "active" && (!p.hasActed || p.committed !== s.currentBet),
  );
}

function advance(s: HandState): void {
  // 폴드로 1명만 남으면 즉시 종료
  if (inHandCount(s.players) === 1) {
    s.actingIndex = -1;
    finishHand(s);
    return;
  }

  if (!roundComplete(s)) {
    const next = nextToAct(s);
    if (next >= 0) {
      s.actingIndex = next;
      return;
    }
  }

  // 라운드 종료 → 다음 스트리트
  // 행동 가능한(active) 플레이어가 1명 이하이면 더 이상 베팅 없음 → 끝까지 딜
  const canStillBet = activeCount(s.players) > 1;

  do {
    if (!nextStreet(s)) {
      // 리버까지 끝 → 쇼다운
      finishHand(s);
      return;
    }
  } while (!canStillBet && s.street !== "showdown");

  if (!canStillBet) {
    finishHand(s);
    return;
  }

  // 새 스트리트 베팅 시작
  startBettingRound(s);
}

/** 다음 커뮤니티 카드를 깐다. 리버 이후면 false. */
function nextStreet(s: HandState): boolean {
  switch (s.street) {
    case "preflop":
      s.board.push(s.deck.shift()!, s.deck.shift()!, s.deck.shift()!);
      s.street = "flop";
      s.log.push(`FLOP ${s.board.map((c) => c.rank + c.suit).join(" ")}`);
      return true;
    case "flop":
      s.board.push(s.deck.shift()!);
      s.street = "turn";
      s.log.push(`TURN`);
      return true;
    case "turn":
      s.board.push(s.deck.shift()!);
      s.street = "river";
      s.log.push(`RIVER`);
      return true;
    default:
      s.street = "showdown";
      return false;
  }
}

function startBettingRound(s: HandState): void {
  for (const p of s.players) {
    p.committed = 0;
    if (p.status === "active") p.hasActed = false;
  }
  s.currentBet = 0;
  s.minRaise = s.bigBlind;
  // 포스트플랍 첫 행동: 버튼 다음 첫 active
  s.actingIndex = findFrom(s.players, s.buttonIndex, (p) => p.status === "active");
}

// ─────────────────────────────────────────────────────────────────────────
// 쇼다운 / 팟 분배
// ─────────────────────────────────────────────────────────────────────────

/** totalCommitted 기여도로 메인팟 + 사이드팟들을 만든다. */
export function buildPots(players: PlayerState[]): Pot[] {
  const contribs = players
    .map((p) => ({ seat: p.seat, amount: p.totalCommitted, folded: p.status === "folded" }))
    .filter((c) => c.amount > 0);

  const pots: Pot[] = [];
  let remaining = contribs;
  while (remaining.length > 0) {
    const min = Math.min(...remaining.map((c) => c.amount));
    let potAmount = 0;
    const eligible: number[] = [];
    for (const c of remaining) {
      c.amount -= min;
      potAmount += min;
      if (!c.folded) eligible.push(c.seat);
    }
    // 같은 eligible 집합이면 이전 팟과 합친다
    const prev = pots[pots.length - 1];
    if (prev && sameSet(prev.eligibleSeats, eligible)) {
      prev.amount += potAmount;
    } else {
      pots.push({ amount: potAmount, eligibleSeats: eligible });
    }
    remaining = remaining.filter((c) => c.amount > 0);
  }
  return pots;
}

function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((x) => set.has(x));
}

function finishHand(s: HandState): void {
  s.pots = buildPots(s.players);
  const awards: Award[] = [];
  const bySeat = new Map<number, PlayerState>(s.players.map((p) => [p.seat, p]));

  const contenders = s.players.filter((p) => p.status === "active" || p.status === "allin");
  const wentToShowdown = contenders.length > 1;

  // 각 contender 핸드 평가 (보드가 5장일 때만 의미 있음; 폴드 승리는 아래에서 처리)
  const handBySeat = new Map<number, HandRank>();
  if (s.board.length === 5) {
    for (const p of contenders) {
      handBySeat.set(p.seat, evaluateHand([...p.holeCards, ...s.board]));
    }
  }

  for (const pot of s.pots) {
    const eligible = pot.eligibleSeats.filter((seat) => {
      const p = bySeat.get(seat)!;
      return p.status === "active" || p.status === "allin";
    });
    if (eligible.length === 0) continue;

    let winners: number[];
    if (eligible.length === 1 || s.board.length < 5) {
      // 폴드로 인한 단독 승리
      winners = [eligible[0]!];
    } else {
      winners = bestOf(eligible, handBySeat);
    }

    distribute(pot.amount, winners, s.buttonIndex, s.players, awards, bySeat);
  }

  // 스택에 실제 반영
  for (const a of awards) bySeat.get(a.seat)!.stack += a.amount;

  const showdown: ShowdownEntry[] = contenders.map((p) => ({
    seat: p.seat,
    hand: handBySeat.get(p.seat) ?? null,
  }));

  s.street = "complete";
  s.actingIndex = -1;
  s.result = { awards: mergeAwards(awards), showdown, wentToShowdown };
  s.log.push(`핸드 종료`);
}

function bestOf(seats: number[], handBySeat: Map<number, HandRank>): number[] {
  let best: HandRank | null = null;
  let winners: number[] = [];
  for (const seat of seats) {
    const h = handBySeat.get(seat)!;
    if (best === null) {
      best = h;
      winners = [seat];
    } else {
      const cmp = compareHands(h, best);
      if (cmp > 0) {
        best = h;
        winners = [seat];
      } else if (cmp === 0) {
        winners.push(seat);
      }
    }
  }
  return winners;
}

/** 팟을 승자들에게 분배. 나머지 홀수 칩은 버튼 왼쪽부터 1칩씩. */
function distribute(
  amount: number,
  winners: number[],
  buttonIndex: number,
  players: PlayerState[],
  awards: Award[],
  bySeat: Map<number, PlayerState>,
): void {
  const share = Math.floor(amount / winners.length);
  let remainder = amount - share * winners.length;
  for (const seat of winners) awards.push({ seat, amount: share });

  // 홀수 칩: 버튼 다음 좌석부터 순서대로
  const order = [...winners].sort((a, b) => {
    const pa = bySeat.get(a)!.seat;
    const pb = bySeat.get(b)!.seat;
    const ra = (pa - buttonIndex + players.length) % players.length;
    const rb = (pb - buttonIndex + players.length) % players.length;
    return ra - rb;
  });
  let i = 0;
  while (remainder > 0) {
    awards.push({ seat: order[i % order.length]!, amount: 1 });
    remainder--;
    i++;
  }
}

function mergeAwards(awards: Award[]): Award[] {
  const map = new Map<number, number>();
  for (const a of awards) map.set(a.seat, (map.get(a.seat) ?? 0) + a.amount);
  return [...map.entries()].map(([seat, amount]) => ({ seat, amount }));
}

// ─────────────────────────────────────────────────────────────────────────

export function isHandOver(state: HandState): boolean {
  return state.street === "complete";
}

/** 현재 모든 팟 합계 (표시용). */
export function totalPot(state: HandState): number {
  return state.players.reduce((sum, p) => sum + p.totalCommitted, 0);
}

function cloneState(state: HandState): HandState {
  return {
    ...state,
    players: state.players.map((p) => ({ ...p, holeCards: [...p.holeCards] })),
    deck: [...state.deck],
    board: [...state.board],
    pots: state.pots.map((pot) => ({ ...pot, eligibleSeats: [...pot.eligibleSeats] })),
    log: [...state.log],
    result: state.result
      ? {
          ...state.result,
          awards: [...state.result.awards],
          showdown: [...state.result.showdown],
        }
      : undefined,
  };
}
