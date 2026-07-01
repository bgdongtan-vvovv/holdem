/**
 * 카드, 덱, 셔플.
 *
 * 카드는 0..51 정수로도, {rank, suit} 객체로도 다룰 수 있게 한다.
 * 서버 재현성(리플레이/감사)을 위해 셔플은 시드 기반 PRNG를 쓴다.
 */

export const SUITS = ["c", "d", "h", "s"] as const; // clubs, diamonds, hearts, spades
export type Suit = (typeof SUITS)[number];

/** 2..14 (14 = Ace). 문자열 라벨은 rankLabel 참고. */
export const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  rank: Rank;
  suit: Suit;
}

const RANK_LABELS: Record<Rank, string> = {
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "T",
  11: "J",
  12: "Q",
  13: "K",
  14: "A",
};

/** "As", "Th", "2c" 같은 짧은 표기로 변환. */
export function cardToString(card: Card): string {
  return `${RANK_LABELS[card.rank]}${card.suit}`;
}

const LABEL_TO_RANK: Record<string, Rank> = Object.fromEntries(
  (Object.entries(RANK_LABELS) as [string, string][]).map(([r, l]) => [l, Number(r) as Rank]),
) as Record<string, Rank>;

/** "As" / "Th" / "2c" 문자열을 Card 로 파싱. 테스트/디버깅용. */
export function cardFromString(s: string): Card {
  const label = s.slice(0, -1).toUpperCase();
  const suit = s.slice(-1).toLowerCase() as Suit;
  const rank = LABEL_TO_RANK[label];
  if (rank === undefined || !SUITS.includes(suit)) {
    throw new Error(`Invalid card string: ${s}`);
  }
  return { rank, suit };
}

/** 편의: "As Kd 2c" 처럼 공백 구분 문자열 → Card[] */
export function cards(s: string): Card[] {
  return s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(cardFromString);
}

/** 정렬되지 않은 표준 52장 덱. */
export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

/**
 * 시드 기반 PRNG (mulberry32). 결정론적이라 같은 시드 → 같은 셔플.
 * 서버가 시드를 저장하면 핸드 전체를 재현/감사할 수 있다.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates. rng 미지정 시 Math.random (비결정론적). 원본을 변형하지 않는다. */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

/** 시드로 셔플된 덱을 만든다. */
export function shuffledDeck(seed?: number): Card[] {
  const rng = seed === undefined ? Math.random : mulberry32(seed);
  return shuffle(makeDeck(), rng);
}
