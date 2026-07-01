import { describe, expect, it } from "vitest";
import { cards } from "./cards.js";
import { HandCategory, compareHands, evaluateHand } from "./handEvaluator.js";

function cat(s: string): HandCategory {
  return evaluateHand(cards(s)).category;
}

describe("evaluateHand — categories", () => {
  it("royal / straight flush", () => {
    expect(cat("As Ks Qs Js Ts 2c 3d")).toBe(HandCategory.StraightFlush);
    expect(cat("9s 8s 7s 6s 5s Ah Kd")).toBe(HandCategory.StraightFlush);
  });

  it("wheel straight flush (A-2-3-4-5)", () => {
    expect(cat("As 2s 3s 4s 5s Kh Qd")).toBe(HandCategory.StraightFlush);
  });

  it("four of a kind", () => {
    expect(cat("As Ah Ad Ac Ks Qd 2c")).toBe(HandCategory.FourOfAKind);
  });

  it("full house", () => {
    expect(cat("As Ah Ad Ks Kd 2c 7h")).toBe(HandCategory.FullHouse);
  });

  it("full house prefers higher trips when two trips present", () => {
    const h = evaluateHand(cards("As Ah Ad Ks Kh Kd 2c"));
    expect(h.category).toBe(HandCategory.FullHouse);
    expect(h.tiebreak).toEqual([14, 13]); // trips A over pair K
  });

  it("flush", () => {
    expect(cat("As Js 9s 6s 3s Kd Qh")).toBe(HandCategory.Flush);
  });

  it("straight (mixed suits)", () => {
    expect(cat("As Kd Qc Jh Ts 2c 3d")).toBe(HandCategory.Straight);
  });

  it("wheel straight A-2-3-4-5", () => {
    const h = evaluateHand(cards("As 2d 3c 4h 5s 9c Kd"));
    expect(h.category).toBe(HandCategory.Straight);
    expect(h.tiebreak).toEqual([5]);
  });

  it("three of a kind", () => {
    expect(cat("As Ah Ad Ks Qd 7c 2h")).toBe(HandCategory.ThreeOfAKind);
  });

  it("two pair", () => {
    expect(cat("As Ah Ks Kd Qc 7h 2d")).toBe(HandCategory.TwoPair);
  });

  it("one pair", () => {
    expect(cat("As Ah Ks Qd Jc 7h 2d")).toBe(HandCategory.Pair);
  });

  it("high card", () => {
    expect(cat("As Kd Qc Jh 9s 7c 2d")).toBe(HandCategory.HighCard);
  });
});

describe("compareHands — tiebreaks", () => {
  it("higher straight beats lower", () => {
    const a = evaluateHand(cards("As Kd Qc Jh Ts 2c 3d"));
    const b = evaluateHand(cards("9s 8d 7c 6h 5s 2c 3d"));
    expect(compareHands(a, b)).toBeGreaterThan(0);
  });

  it("flush kicker decides", () => {
    const a = evaluateHand(cards("As Js 9s 6s 3s 2h 4d"));
    const b = evaluateHand(cards("Ks Js 9s 6s 3s 2h 4d"));
    expect(compareHands(a, b)).toBeGreaterThan(0);
  });

  it("two pair kicker decides", () => {
    const a = evaluateHand(cards("As Ah Ks Kd Qc 2h 3d"));
    const b = evaluateHand(cards("As Ah Ks Kd Jc 2h 3d"));
    expect(compareHands(a, b)).toBeGreaterThan(0);
  });

  it("full house beats flush", () => {
    const fh = evaluateHand(cards("As Ah Ad Ks Kd 2c 7h"));
    const fl = evaluateHand(cards("As Js 9s 6s 3s Kd Qh"));
    expect(compareHands(fh, fl)).toBeGreaterThan(0);
  });

  it("split pot returns 0", () => {
    const a = evaluateHand(cards("As Ah Ks Qd Jc 7h 2d"));
    const b = evaluateHand(cards("Ac Ad Kc Qh Js 7c 2s"));
    expect(compareHands(a, b)).toBe(0);
  });

  it("quad kicker decides", () => {
    const a = evaluateHand(cards("As Ah Ad Ac Ks 2c 3d"));
    const b = evaluateHand(cards("As Ah Ad Ac Qs 2c 3d"));
    expect(compareHands(a, b)).toBeGreaterThan(0);
  });
});
