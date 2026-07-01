/**
 * 족보 판정: 5~7장에서 최고 5장 조합을 평가한다.
 *
 * 결과는 { category, tiebreak } 로 표현하고, 두 핸드를 lexicographic 하게 비교한다.
 * tiebreak 는 항상 "높을수록 강함" 인 rank 배열이며, 같은 category 안에서 우열을 가린다.
 */

import type { Card, Rank } from "./cards.js";

export enum HandCategory {
  HighCard = 1,
  Pair = 2,
  TwoPair = 3,
  ThreeOfAKind = 4,
  Straight = 5,
  Flush = 6,
  FullHouse = 7,
  FourOfAKind = 8,
  StraightFlush = 9,
}

export const HAND_CATEGORY_NAMES: Record<HandCategory, string> = {
  [HandCategory.HighCard]: "High Card",
  [HandCategory.Pair]: "Pair",
  [HandCategory.TwoPair]: "Two Pair",
  [HandCategory.ThreeOfAKind]: "Three of a Kind",
  [HandCategory.Straight]: "Straight",
  [HandCategory.Flush]: "Flush",
  [HandCategory.FullHouse]: "Full House",
  [HandCategory.FourOfAKind]: "Four of a Kind",
  [HandCategory.StraightFlush]: "Straight Flush",
};

export interface HandRank {
  category: HandCategory;
  /** 같은 category 내 우열을 가리는 rank 배열 (높을수록 강함, lexicographic 비교). */
  tiebreak: number[];
}

/**
 * distinct rank 집합에서 최고 스트레이트의 top rank 를 찾는다. 없으면 0.
 * A-2-3-4-5(휠)는 5 를 top 으로 반환.
 */
function straightHigh(distinctRanks: Set<number>): number {
  // Ace low 처리를 위해 14가 있으면 1도 추가
  const present = new Set(distinctRanks);
  if (present.has(14)) present.add(1);
  for (let high = 14; high >= 5; high--) {
    let ok = true;
    for (let r = high; r > high - 5; r--) {
      if (!present.has(r)) {
        ok = false;
        break;
      }
    }
    if (ok) return high;
  }
  return 0;
}

/**
 * 5~7장 카드에서 최고 핸드를 평가한다.
 */
export function evaluateHand(allCards: Card[]): HandRank {
  if (allCards.length < 5) {
    throw new Error(`evaluateHand needs at least 5 cards, got ${allCards.length}`);
  }

  // rank 별 개수, suit 별 카드
  const rankCount = new Map<Rank, number>();
  const bySuit = new Map<string, Rank[]>();
  const allRanks = new Set<number>();

  for (const c of allCards) {
    rankCount.set(c.rank, (rankCount.get(c.rank) ?? 0) + 1);
    const arr = bySuit.get(c.suit) ?? [];
    arr.push(c.rank);
    bySuit.set(c.suit, arr);
    allRanks.add(c.rank);
  }

  // 1) 스트레이트 플러시 검사 (5장 이상인 suit 내부에서 스트레이트)
  let flushSuitRanks: Rank[] | null = null;
  for (const ranks of bySuit.values()) {
    if (ranks.length >= 5) {
      flushSuitRanks = ranks;
      break;
    }
  }
  if (flushSuitRanks) {
    const sfHigh = straightHigh(new Set(flushSuitRanks));
    if (sfHigh > 0) {
      return { category: HandCategory.StraightFlush, tiebreak: [sfHigh] };
    }
  }

  // rank 를 (개수 desc, rank desc) 로 정렬
  const grouped = [...rankCount.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  const counts = grouped.map((g) => g[1]);
  const ranksByGroup = grouped.map((g) => g[0]);

  // 2) 포카드
  if (counts[0] === 4) {
    const quad = ranksByGroup[0]!;
    const kicker = Math.max(...[...allRanks].filter((r) => r !== quad));
    return { category: HandCategory.FourOfAKind, tiebreak: [quad, kicker] };
  }

  // 3) 풀하우스 (트립 + 페어, 트립이 둘이면 높은 쪽 트립)
  if (counts[0] === 3) {
    const trips = ranksByGroup[0]!;
    // 남은 그룹 중 개수>=2 인 가장 높은 rank
    let pair = 0;
    for (let i = 1; i < grouped.length; i++) {
      if (grouped[i]![1] >= 2) {
        pair = ranksByGroup[i]!;
        break;
      }
    }
    if (pair > 0) {
      return { category: HandCategory.FullHouse, tiebreak: [trips, pair] };
    }
  }

  // 4) 플러시
  if (flushSuitRanks) {
    const top5 = flushSuitRanks.slice().sort((a, b) => b - a).slice(0, 5);
    return { category: HandCategory.Flush, tiebreak: top5 };
  }

  // 5) 스트레이트
  const stHigh = straightHigh(allRanks);
  if (stHigh > 0) {
    return { category: HandCategory.Straight, tiebreak: [stHigh] };
  }

  // 6) 트립
  if (counts[0] === 3) {
    const trips = ranksByGroup[0]!;
    const kickers = [...allRanks]
      .filter((r) => r !== trips)
      .sort((a, b) => b - a)
      .slice(0, 2);
    return { category: HandCategory.ThreeOfAKind, tiebreak: [trips, ...kickers] };
  }

  // 7) 투페어
  if (counts[0] === 2 && counts[1] === 2) {
    const highPair = ranksByGroup[0]!;
    const lowPair = ranksByGroup[1]!;
    const kicker = Math.max(...[...allRanks].filter((r) => r !== highPair && r !== lowPair));
    return { category: HandCategory.TwoPair, tiebreak: [highPair, lowPair, kicker] };
  }

  // 8) 원페어
  if (counts[0] === 2) {
    const pair = ranksByGroup[0]!;
    const kickers = [...allRanks]
      .filter((r) => r !== pair)
      .sort((a, b) => b - a)
      .slice(0, 3);
    return { category: HandCategory.Pair, tiebreak: [pair, ...kickers] };
  }

  // 9) 하이카드
  const top5 = [...allRanks].sort((a, b) => b - a).slice(0, 5);
  return { category: HandCategory.HighCard, tiebreak: top5 };
}

/** a > b 이면 양수, a < b 이면 음수, 동점이면 0. */
export function compareHands(a: HandRank, b: HandRank): number {
  if (a.category !== b.category) return a.category - b.category;
  const len = Math.max(a.tiebreak.length, b.tiebreak.length);
  for (let i = 0; i < len; i++) {
    const x = a.tiebreak[i] ?? 0;
    const y = b.tiebreak[i] ?? 0;
    if (x !== y) return x - y;
  }
  return 0;
}
