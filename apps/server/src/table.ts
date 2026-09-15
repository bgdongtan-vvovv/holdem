/**
 * 단일 테이블 참조 구현 (형섭 시작점).
 *
 * 엔진(@holdem/poker-engine)을 감싸서:
 *  - 착석/이탈 관리 (핸드 도중 이탈은 핸드 종료 후 정리)
 *  - 2명 이상이면 핸드 시작, 핸드 종료 후 버튼 이동
 *  - 액션 검증 후 다음 상태로 진행, 액션 타임뱅크 마감시각 제공
 *  - 뷰어별로 홀카드를 가린 PublicTableState 생성
 *
 * TODO(형섭):
 *  - 진짜 재접속(같은 유저로 복귀) — 인증(유저 id) 도입 후 가능
 *  - 앉은 채로 대기(sit-out) — 핸드 강제 스킵을 유저가 직접 선택하는 기능
 *  - 사이드팟 표시(엔진 state.pots) 반영
 *  - 다중 테이블/로비, 영속화(DB), 레이크
 */
import {
  applyAction,
  HAND_CATEGORY_NAMES,
  isHandOver,
  legalActions,
  resolveShowdown,
  startHand,
  type Action,
  type HandState,
} from "@holdem/poker-engine";
import type { PublicPlayer, PublicTableState } from "@holdem/shared";

const SEAT_COUNT = 6;
/** 액션 타임뱅크 길이 (ms). 마감 전 액션 없으면 자동 체크/폴드. */
const TIMEBANK_MS = 20_000;

interface Occupant {
  seat: number; // 테이블 좌석 0..5
  id: string;
  stack: number;
  socketId: string;
  /** 핸드 도중 leave/disconnect 됨 — 핸드 종료 후 실제로 제거된다. */
  leaving?: boolean;
}

export class Table {
  readonly id: string;
  readonly smallBlind: number;
  readonly bigBlind: number;

  private occupants = new Map<number, Occupant>(); // seat -> occupant
  private hand: HandState | null = null;
  private buttonSeat = 0;
  /** 엔진 player 인덱스 → 테이블 좌석 */
  private engineToSeat: number[] = [];
  /** 현재 액션 차례가 시작된 시각 (epoch ms). 타임뱅크 계산용. */
  private actionStartedAt: number | null = null;

  constructor(id: string, smallBlind: number, bigBlind: number) {
    this.id = id;
    this.smallBlind = smallBlind;
    this.bigBlind = bigBlind;
  }

  sit(seat: number, occ: Occupant): void {
    if (seat < 0 || seat >= SEAT_COUNT) throw new Error("잘못된 좌석");
    if (this.occupants.has(seat)) throw new Error("이미 착석한 좌석");
    this.occupants.set(seat, { ...occ, seat });
  }

  /**
   * socketId 의 플레이어를 테이블에서 내보낸다.
   * 진행 중인 핸드에 참여 중이면 즉시 제거하지 않고 표시만 해 둔다 —
   * 엔진 상태(engineToSeat, 카드/팟)와 어긋나지 않도록 핸드 종료 후 settle() 에서 정리한다.
   * 핸드 중이 아니면 바로 제거한다.
   */
  leaveBySocket(socketId: string): void {
    for (const [seat, o] of this.occupants) {
      if (o.socketId !== socketId) continue;
      const inActiveHand =
        this.hand !== null && !isHandOver(this.hand) && this.engineToSeat.includes(seat);
      if (inActiveHand) {
        o.leaving = true;
      } else {
        this.occupants.delete(seat);
      }
    }
  }

  /** 조건이 되면 새 핸드를 시작한다. */
  maybeStartHand(): boolean {
    if (this.hand && !isHandOver(this.hand)) return false;
    const seated = [...this.occupants.values()].sort((a, b) => a.seat - b.seat);
    if (seated.length < 2) return false;

    this.engineToSeat = seated.map((o) => o.seat);
    // 버튼: 착석자 중 다음 좌석 (간단화)
    const buttonEngineIdx = Math.max(
      0,
      this.engineToSeat.findIndex((s) => s >= this.buttonSeat),
    );
    this.hand = startHand({
      seats: seated.map((o) => ({ id: o.id, stack: o.stack })),
      buttonIndex: buttonEngineIdx,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
    });
    this.actionStartedAt = this.hand.actingIndex >= 0 ? Date.now() : null;
    return true;
  }

  /** socketId 의 플레이어가 액션. 성공 시 true. */
  act(socketId: string, action: Action): void {
    if (!this.hand || isHandOver(this.hand)) throw new Error("진행 중인 핸드 없음");
    const occ = [...this.occupants.values()].find((o) => o.socketId === socketId);
    if (!occ) throw new Error("착석하지 않음");
    const engineIdx = this.engineToSeat.indexOf(occ.seat);
    if (this.hand.actingIndex !== engineIdx) throw new Error("당신 차례가 아닙니다");
    this.applyEngineAction(action);
  }

  /**
   * 타임뱅크 마감 시 현재 차례 플레이어 대신 기본 액션(체크 가능하면 체크, 아니면 폴드)을 적용한다.
   * 접속이 끊긴 플레이어도 occupant 조회 없이 처리되므로 재접속/이탈 상황에서도 핸드가 막히지 않는다.
   */
  autoActTimedOutPlayer(): boolean {
    if (!this.hand || isHandOver(this.hand) || this.hand.actingIndex < 0) return false;
    const la = legalActions(this.hand);
    if (!la) return false;
    this.applyEngineAction(la.canCheck ? { type: "check" } : { type: "fold" });
    return true;
  }

  private applyEngineAction(action: Action): void {
    if (!this.hand) return;
    this.hand = applyAction(this.hand, action);
    if (isHandOver(this.hand)) {
      this.settle();
    } else {
      this.actionStartedAt = this.hand.actingIndex >= 0 ? Date.now() : null;
    }
  }

  /** 현재 액션 차례의 타임뱅크 마감 시각(epoch ms). 없으면 null. */
  actionDeadline(): number | null {
    if (!this.hand || isHandOver(this.hand) || this.hand.actingIndex < 0) return null;
    if (this.actionStartedAt === null) return null;
    return this.actionStartedAt + TIMEBANK_MS;
  }

  private settle(): void {
    if (!this.hand) return;
    // 엔진이 이미 stack 에 상금을 반영함 → occupant 스택 동기화
    this.hand.players.forEach((p, engineIdx) => {
      const seat = this.engineToSeat[engineIdx]!;
      const occ = this.occupants.get(seat);
      if (occ) occ.stack = p.stack;
    });
    this.buttonSeat = (this.buttonSeat + 1) % SEAT_COUNT;
    this.actionStartedAt = null;
    // 핸드 도중 leave/disconnect 된 플레이어를 이제 실제로 내보낸다.
    for (const [seat, occ] of [...this.occupants]) {
      if (occ.leaving) this.occupants.delete(seat);
    }
  }

  resolveShowdown(): boolean {
    if (!this.hand || this.hand.street !== "showdown") return false;
    this.hand = resolveShowdown(this.hand);
    this.settle();
    return true;
  }

  /** viewerSocketId 관점의 정제된 상태. */
  publicState(viewerSocketId: string): PublicTableState {
    const viewer = [...this.occupants.values()].find((o) => o.socketId === viewerSocketId);
    const viewerSeat = viewer?.seat ?? -1;
    const h = this.hand;

    const players: PublicPlayer[] = [];
    for (let seat = 0; seat < SEAT_COUNT; seat++) {
      const occ = this.occupants.get(seat);
      if (!occ) {
        players.push({ seat, id: "", stack: 0, committed: 0, status: "empty", holeCards: null, holeCardCount: 0 });
        continue;
      }
      const engineIdx = h ? this.engineToSeat.indexOf(seat) : -1;
      const ep = engineIdx >= 0 ? h!.players[engineIdx] : undefined;
      const isSelf = seat === viewerSeat;
      const showdown = h?.street === "complete" && h.result?.wentToShowdown;
      const reveal = isSelf || showdown;
      players.push({
        seat,
        id: occ.id,
        stack: ep ? ep.stack : occ.stack,
        committed: ep?.committed ?? 0,
        status: ep ? (ep.status as PublicPlayer["status"]) : "active",
        holeCards: ep && reveal && ep.holeCards.length ? ep.holeCards : null,
        holeCardCount: ep ? ep.holeCards.length : 0,
      });
    }

    let legal: PublicTableState["legal"] = null;
    if (h && !isHandOver(h) && viewerSeat >= 0) {
      const engineIdx = this.engineToSeat.indexOf(viewerSeat);
      if (h.actingIndex === engineIdx) {
        const la = legalActions(h);
        if (la) {
          legal = {
            canFold: la.canFold,
            canCheck: la.canCheck,
            canCall: la.canCall,
            callAmount: la.callAmount,
            canRaise: la.canRaise,
            minRaiseTo: la.minRaiseTo,
            maxRaiseTo: la.maxRaiseTo,
            deadline: this.actionDeadline() ?? undefined,
          };
        }
      }
    }

    return {
      tableId: this.id,
      stakes: { smallBlind: this.smallBlind, bigBlind: this.bigBlind },
      players,
      board: h?.board ?? [],
      street: h?.street ?? "preflop",
      pot: h ? h.players.reduce((s, p) => s + p.totalCommitted, 0) : 0,
      currentBet: h?.currentBet ?? 0,
      dealerSeat: h ? this.engineToSeat[h.buttonIndex]! : this.buttonSeat,
      actingSeat: h && h.actingIndex >= 0 ? this.engineToSeat[h.actingIndex]! : -1,
      legal,
      result:
        h?.result && isHandOver(h)
          ? {
              awards: h.result.awards.map((a) => ({
                seat: this.engineToSeat[a.seat] ?? a.seat,
                amount: a.amount,
              })),
              wentToShowdown: h.result.wentToShowdown,
              shownHands: h.result.showdown
                .filter((s) => s.hand)
                .map((s) => ({
                  seat: this.engineToSeat[s.seat] ?? s.seat,
                  category: HAND_CATEGORY_NAMES[s.hand!.category],
                  cards: h.players[s.seat]!.holeCards,
                })),
            }
          : undefined,
    };
  }

  isActive(): boolean {
    return this.hand !== null && !isHandOver(this.hand);
  }

  isAwaitingShowdown(): boolean {
    return this.hand?.street === "showdown";
  }
}
