import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Card } from "@holdem/poker-engine";
import { prime } from "./primeTheme";

const RANK_LABEL: Record<number, string> = {
  2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9",
  10: "10", 11: "J", 12: "Q", 13: "K", 14: "A",
};
const SUIT_SYMBOL: Record<string, string> = { c: "♣", d: "♦", h: "♥", s: "♠" };

export type CardSize = "xs" | "sm" | "md" | "lg";

// Prime Poker 카드: 큰 랭크(좌상단) + 작은 수트 + 우하단 큰 수트. 그림 카드도 문자만 쓴다.
const DIMS = {
  xs: { w: 30, h: 42, rank: 17, suit: 10, pip: 22, radius: 4 },
  sm: { w: 36, h: 50, rank: 20, suit: 12, pip: 26, radius: 5 },
  md: { w: 50, h: 70, rank: 28, suit: 15, pip: 36, radius: 6 },
  lg: { w: 62, h: 86, rank: 36, suit: 18, pip: 46, radius: 6 },
} as const;

export function cardDims(size: CardSize) {
  return DIMS[size];
}

export function PlayingCard({
  card,
  hidden,
  size = "md",
  highlighted = false,
}: {
  card?: Card;
  hidden?: boolean;
  size?: CardSize;
  highlighted?: boolean;
}) {
  const d = DIMS[size];

  if (hidden || !card) {
    return <CardBack width={d.w} height={d.h} radius={d.radius} />;
  }

  const red = card.suit === "h" || card.suit === "d";
  const color = red ? "#e0202b" : "#111111";
  const rank = RANK_LABEL[card.rank]!;
  const suit = SUIT_SYMBOL[card.suit]!;
  const ten = rank === "10";

  return (
    <View
      style={[
        styles.face,
        { width: d.w, height: d.h, borderRadius: d.radius },
        highlighted && styles.highlighted,
      ]}
    >
      <Text
        style={[
          styles.rank,
          { color, fontSize: ten ? d.rank * 0.82 : d.rank, lineHeight: d.rank * 1.02, letterSpacing: ten ? -2 : 0 },
        ]}
      >
        {rank}
      </Text>
      <Text style={[styles.smallSuit, { color, fontSize: d.suit, lineHeight: d.suit * 1.05, left: d.w * 0.1 }]}>
        {suit}
      </Text>
      <Text style={[styles.pip, { color, fontSize: d.pip, lineHeight: d.pip * 1.05 }]}>{suit}</Text>
    </View>
  );
}

/** 버건디 카드 뒷면 — 샘플의 상대 홀카드(짙은 와인색 + 잔무늬). */
export function CardBack({ width, height, radius }: { width: number; height: number; radius: number }) {
  return (
    <LinearGradient
      colors={["#93303a", prime.cardBack, prime.cardBackDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.back, { width, height, borderRadius: radius }]}
    >
      <View style={[styles.backInner, { borderRadius: Math.max(2, radius - 2) }]}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={[styles.backStripe, { top: `${12 + i * 24}%` }]} />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  face: {
    margin: 2,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.18)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  highlighted: {
    borderColor: prime.gold,
    borderWidth: 2,
    transform: [{ translateY: -6 }],
  },
  rank: {
    position: "absolute",
    top: 1,
    left: 3,
    fontWeight: "800",
    fontFamily: "Arial",
  },
  smallSuit: {
    position: "absolute",
    top: "40%",
  },
  pip: {
    position: "absolute",
    right: 2,
    bottom: 0,
  },
  back: {
    margin: 2,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  backInner: {
    flex: 1,
    borderWidth: 1,
    borderColor: prime.cardBackLine,
    overflow: "hidden",
  },
  backStripe: {
    position: "absolute",
    left: -4,
    right: -4,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});
