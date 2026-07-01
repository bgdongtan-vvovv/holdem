/**
 * 단일 테이블 참조 구현 (형섭 시작점).
 *
 * 엔진(@holdem/poker-engine)을 감싸서:
 *  - 착석/이탈 관리
 *  - 2명 이상이면 핸드 시작
 *  - 액션 검증 후 다음 상태로 진행
 *  - 뷰어별로 홀카드를 가린 PublicTableState 생성
 *
 * TODO(형섭):
 *  - 액션 타임뱅크(자동 폴드/체크) 타이머
 *  - 핸드 종료 후 다음 핸드 자동 시작 + 버튼 이동
 *  - 재접속/이탈 처리, 앉은 채로 대기(sit-out)
 *  - 사이드팟 표시(엔진 state.pots) 반영
 *  - 다중 테이블/로비, 영속화(DB), 레이크
 */
import {
  applyAction,
  HAND_CATEGORY_NAMES,
  isHandOver,
  legalActions,
  startHand,
  type Action,
  type HandState,
} from "@holdem/poker-engine";
import type { PublicPlayer, PublicTableState } from "@holdem/shared";

const SEAT_COUNT = 6;

interface Occupant {
  seat: number; // 테이블 좌석 0..5
  id: string;
  stack: number;
  socketId: string;
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

  leaveBySocket(socketId: string): void {
    for (const [seat, o] of this.occupants) {
      if (o.socketId === socketId) this.occupants.delete(seat);
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
    return true;
  }

  /** socketId 의 플레이어가 액션. 성공 시 true. */
  act(socketId: string, action: Action): void {
    if (!this.hand || isHandOver(this.hand)) throw new Error("진행 중인 핸드 없음");
    const occ = [...this.occupants.values()].find((o) => o.socketId === socketId);
    if (!occ) throw new Error("착석하지 않음");
    const engineIdx = this.engineToSeat.indexOf(occ.seat);
    if (this.hand.actingIndex !== engineIdx) throw new Error("당신 차례가 아닙니다");
    this.hand = applyAction(this.hand, action);
    // TODO(형섭): 핸드 종료면 스택 반영 후 buttonSeat 이동 & maybeStartHand 예약
    if (isHandOver(this.hand)) this.settle();
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
            // TODO(형섭): deadline 은 타임뱅크 타이머 도입 시 채우기
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
}
