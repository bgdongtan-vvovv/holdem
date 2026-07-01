/**
 * 데모용 간단한 봇 AI. (서버 도입 전 로컬 플레이용)
 * 정교한 전략이 아니라 핸드가 자연스럽게 흘러가도록 하는 휴리스틱.
 */
import {
  evaluateHand,
  HandCategory,
  legalActions,
  totalPot,
  type Action,
  type HandState,
} from "@holdem/poker-engine";

/** 0(약함)~1(강함) 대략적인 핸드 강도. */
function strength(state: HandState): number {
  const p = state.players[state.actingIndex]!;
  if (state.board.length === 0) {
    // 프리플랍: 홀카드 랭크 기반
    const [a, b] = p.holeCards;
    if (!a || !b) return 0.3;
    const high = Math.max(a.rank, b.rank);
    const pair = a.rank === b.rank;
    const suited = a.suit === b.suit;
    let s = (high - 2) / 12; // 하이카드 기여
    if (pair) s += 0.35;
    if (suited) s += 0.05;
    if (Math.abs(a.rank - b.rank) === 1) s += 0.05; // 커넥터
    return Math.min(1, s);
  }
  const hand = evaluateHand([...p.holeCards, ...state.board]);
  // 카테고리를 0~1 로 매핑
  return Math.min(1, (hand.category - 1) / (HandCategory.StraightFlush - 1) + 0.1);
}

export function decideBotAction(state: HandState): Action {
  const legal = legalActions(state);
  if (!legal) return { type: "check" };
  const s = strength(state);
  const r = Math.random();

  if (legal.canCheck) {
    // 베팅이 없는 상황: 강하면 가끔 밸류 벳
    if (s > 0.6 && r < 0.5) {
      const pot = Math.max(state.bigBlind, totalPot(state));
      const to = Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, Math.round(pot * 0.6)));
      return { type: "bet", to };
    }
    return { type: "check" };
  }

  // 콜/폴드 상황
  const callCost = legal.callAmount;
  const pot = totalPot(state);
  const potOdds = callCost / (pot + callCost || 1);

  // 강한 핸드면 가끔 레이즈
  if (legal.canRaise && s > 0.72 && r < 0.35) {
    const to = Math.min(legal.maxRaiseTo, Math.max(legal.minRaiseTo, Math.round((pot + callCost) * 0.75)));
    return { type: "raise", to };
  }

  // 콜 여부: 강도가 팟오즈를 웃돌면 콜
  if (s >= potOdds * 0.9 || callCost <= state.bigBlind) {
    return { type: "call" };
  }
  return { type: "fold" };
}
