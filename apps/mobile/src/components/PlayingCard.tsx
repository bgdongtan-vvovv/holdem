import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Card } from "@holdem/poker-engine";
import { theme } from "../theme";

const RANK_LABEL: Record<number, string> = {
  2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9",
  10: "10", 11: "J", 12: "Q", 13: "K", 14: "A",
};
const SUIT_SYMBOL: Record<string, string> = { c: "♣", d: "♦", h: "♥", s: "♠" };

const DIMS = {
  sm: { w: 30, h: 42, corner: 11, pip: 18, radius: 5 },
  md: { w: 44, h: 62, corner: 15, pip: 28, radius: 7 },
  lg: { w: 56, h: 80, corner: 19, pip: 36, radius: 8 },
} as const;

export function PlayingCard({
  card,
  hidden,
  size = "md",
}: {
  card?: Card;
  hidden?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const d = DIMS[size];

  if (hidden || !card) {
    return (
      <LinearGradient
        colors={[theme.cardBack, "#16244a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { width: d.w, height: d.h, borderRadius: d.radius }, styles.back]}
      >
        <View style={styles.backPattern}>
          <Text style={{ color: theme.cardBackLine, fontSize: d.pip * 0.7, fontWeight: "900" }}>♠</Text>
        </View>
      </LinearGradient>
    );
  }

  const red = card.suit === "h" || card.suit === "d";
  const color = red ? theme.red : theme.black;

  return (
    <View style={[styles.card, styles.face, { width: d.w, height: d.h, borderRadius: d.radius }]}>
      <View style={styles.corner}>
        <Text style={[styles.cornerRank, { color, fontSize: d.corner }]}>{RANK_LABEL[card.rank]}</Text>
        <Text style={[styles.cornerSuit, { color, fontSize: d.corner * 0.8 }]}>{SUIT_SYMBOL[card.suit]}</Text>
      </View>
      <Text style={[styles.pip, { color, fontSize: d.pip }]}>{SUIT_SYMBOL[card.suit]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.18)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    overflow: "hidden",
  },
  face: { backgroundColor: theme.cardFace },
  back: { alignItems: "center", justifyContent: "center", borderColor: theme.cardBackLine },
  backPattern: {
    width: "82%", height: "82%", borderRadius: 4,
    borderWidth: 1.5, borderColor: "rgba(120,150,220,0.4)",
    alignItems: "center", justifyContent: "center",
  },
  corner: { position: "absolute", top: 2, left: 3, alignItems: "center" },
  cornerRank: { fontWeight: "900", lineHeight: undefined },
  cornerSuit: { fontWeight: "700", marginTop: -2 },
  pip: {
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
    textAlignVertical: "center",
    lineHeight: undefined,
    alignSelf: "center",
    marginTop: "18%",
  },
});
