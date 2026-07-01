import { describe, expect, it } from "vitest";
import { cards } from "./cards.js";
import type { Card } from "./cards.js";
import {
  applyAction,
  buildPots,
  isHandOver,
  startHand,
  totalPot,
  type HandState,
  type PlayerState,
} from "./game.js";

/** 헤즈업(버튼=0) 딜 순서에 맞춰 덱을 구성한다. */
function headsUpDeck(p0: string, p1: string, board: string): Card[] {
  const [a0, b0] = cards(p0);
  const [a1, b1] = cards(p1);
  const bd = cards(board);
  // 소비 순서: P1c1, P0c1, P1c2, P0c2, flop(3), turn, river
  return [a1!, a0!, b1!, b0!, ...bd];
}

function totalChips(s: HandState): number {
  // 핸드 종료 후엔 팟이 스택으로 분배됨 → 스택 합이 곧 전체.
  // 진행 중엔 스택 + 팟에 들어간 칩.
  const stacks = s.players.reduce((sum, p) => sum + p.stack, 0);
  return isHandOver(s) ? stacks : stacks + totalPot(s);
}

describe("startHand — 블라인드 & 초기 상태", () => {
  it("헤즈업 블라인드 게시", () => {
    const s = startHand({
      seats: [
        { id: "A", stack: 100 },
        { id: "B", stack: 100 },
      ],
      buttonIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      deck: headsUpDeck("As Ah", "Kd Kc", "2c 7d 9s Th 3h"),
    });
    // 헤즈업: 버튼(A)=SB, B=BB
    expect(s.players[0]!.committed).toBe(5);
    expect(s.players[1]!.committed).toBe(10);
    expect(s.currentBet).toBe(10);
    // 프리플랍 첫 행동은 SB(버튼) = A
    expect(s.actingIndex).toBe(0);
    expect(s.players[0]!.holeCards.map((c) => c.rank)).toEqual([14, 14]);
  });
});

describe("폴드 승리", () => {
  it("SB 폴드하면 BB가 팟 획득", () => {
    let s = startHand({
      seats: [
        { id: "A", stack: 100 },
        { id: "B", stack: 100 },
      ],
      buttonIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      deck: headsUpDeck("As Ah", "Kd Kc", "2c 7d 9s Th 3h"),
    });
    s = applyAction(s, { type: "fold" });
    expect(isHandOver(s)).toBe(true);
    expect(s.result!.wentToShowdown).toBe(false);
    // B 순이익: SB가 낸 5칩
    expect(s.players[1]!.stack).toBe(105);
    expect(s.players[0]!.stack).toBe(95);
    expect(totalChips(s)).toBe(200);
  });
});

describe("쇼다운", () => {
  it("체크다운 후 높은 핸드가 승리", () => {
    let s = startHand({
      seats: [
        { id: "A", stack: 100 },
        { id: "B", stack: 100 },
      ],
      buttonIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      deck: headsUpDeck("As Ah", "Kd Kc", "2c 7d 9s Th 3h"),
    });
    s = applyAction(s, { type: "call" }); // A(SB) 콜
    s = applyAction(s, { type: "check" }); // B(BB) 옵션 체크
    // 플랍/턴/리버 모두 체크다운
    for (let i = 0; i < 3; i++) {
      s = applyAction(s, { type: "check" }); // 포스트플랍 첫 행동 = B
      s = applyAction(s, { type: "check" }); // A
    }
    expect(isHandOver(s)).toBe(true);
    expect(s.result!.wentToShowdown).toBe(true);
    // A 가 AA 로 승리, 팟 20
    expect(s.players[0]!.stack).toBe(110);
    expect(s.players[1]!.stack).toBe(90);
    expect(totalChips(s)).toBe(200);
  });

  it("보드가 최고 핸드면 스플릿", () => {
    let s = startHand({
      seats: [
        { id: "A", stack: 100 },
        { id: "B", stack: 100 },
      ],
      buttonIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      deck: headsUpDeck("2c 3d", "2h 3s", "As Ks Qs Js Ts"),
    });
    s = applyAction(s, { type: "call" });
    s = applyAction(s, { type: "check" });
    for (let i = 0; i < 3; i++) {
      s = applyAction(s, { type: "check" });
      s = applyAction(s, { type: "check" });
    }
    expect(s.result!.awards.find((a) => a.seat === 0)!.amount).toBe(10);
    expect(s.result!.awards.find((a) => a.seat === 1)!.amount).toBe(10);
    expect(s.players[0]!.stack).toBe(100);
    expect(s.players[1]!.stack).toBe(100);
  });
});

describe("buildPots — 사이드팟", () => {
  function ps(rows: [number, number, boolean][]): PlayerState[] {
    // [seat, totalCommitted, folded]
    return rows.map(([seat, tc, folded]) => ({
      id: `P${seat}`,
      seat,
      stack: 0,
      committed: 0,
      totalCommitted: tc,
      holeCards: [],
      status: folded ? "folded" : "allin",
      hasActed: true,
    }));
  }

  it("숏스택 올인 → 메인팟 + 사이드팟 분리", () => {
    const pots = buildPots(ps([
      [0, 50, false],
      [1, 200, false],
      [2, 200, false],
    ]));
    expect(pots).toHaveLength(2);
    expect(pots[0]).toEqual({ amount: 150, eligibleSeats: [0, 1, 2] });
    expect(pots[1]).toEqual({ amount: 300, eligibleSeats: [1, 2] });
  });

  it("폴드한 숏스택의 칩도 팟에 포함되되 승리 자격은 없음", () => {
    const pots = buildPots(ps([
      [0, 50, true], // 폴드
      [1, 200, false],
      [2, 200, false],
    ]));
    // 두 레이어의 eligible 이 {1,2} 로 동일 → 병합
    expect(pots).toHaveLength(1);
    expect(pots[0]).toEqual({ amount: 450, eligibleSeats: [1, 2] });
  });
});

describe("칩 보존", () => {
  it("올인 대결 후에도 총 칩 불변", () => {
    let s = startHand({
      seats: [
        { id: "A", stack: 100 },
        { id: "B", stack: 100 },
      ],
      buttonIndex: 0,
      smallBlind: 5,
      bigBlind: 10,
      deck: headsUpDeck("As Ah", "Kd Kc", "2c 7d 9s Th 3h"),
    });
    s = applyAction(s, { type: "allin" }); // A 올인 100
    s = applyAction(s, { type: "call" }); // B 콜 올인
    expect(isHandOver(s)).toBe(true);
    expect(totalChips(s)).toBe(200);
    expect(s.players[0]!.stack).toBe(200); // A 가 AA 로 전부 획득
  });
});
