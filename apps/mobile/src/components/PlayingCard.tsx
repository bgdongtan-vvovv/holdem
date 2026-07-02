import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Card } from "@holdem/poker-engine";
import { theme } from "../theme";

const RANK_LABEL: Record<number, string> = {
  2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9",
  10: "10", 11: "J", 12: "Q", 13: "K", 14: "A",
};
const SUIT_SYMBOL: Record<string, string> = { c: "♣", d: "♦", h: "♥", s: "♠" };

const DIMS = {
  sm: { w: 36, h: 52, corner: 16, csuit: 10, pip: 24, radius: 6, pad: 2 },
  md: { w: 46, h: 66, corner: 20, csuit: 13, pip: 30, radius: 7, pad: 2 },
  lg: { w: 62, h: 88, corner: 27, csuit: 17, pip: 42, radius: 9, pad: 3 },
} as const;

function CardIndex({
  rank, suit, color, fontSize, suitSize,
}: {
  rank: string;
  suit: string;
  color: string;
  fontSize: number;
  suitSize: number;
}) {
  return (
    <View style={styles.index}>
      <Text style={[styles.cornerRank, { color, fontSize }]}>{rank}</Text>
      <Text style={[styles.cornerSuit, { color, fontSize: suitSize }]}>{suit}</Text>
    </View>
  );
}

export function PlayingCard({
  card,
  hidden,
  size = "md",
  highlighted = false,
}: {
  card?: Card;
  hidden?: boolean;
  size?: "sm" | "md" | "lg";
  highlighted?: boolean;
}) {
  const d = DIMS[size];

  if (hidden || !card) {
    return (
      <View
        style={{ width: d.w, height: d.h, margin: 2 }}
      >
        <Image
          source={require("../../assets/images/card-back-luxury.png")}
          resizeMode="contain"
          style={{ width: d.w, height: d.h }}
        />
      </View>
    );
  }

  const red = card.suit === "h" || card.suit === "d";
  const color = red ? theme.red : theme.black;
  const rank = RANK_LABEL[card.rank]!;
  const suit = SUIT_SYMBOL[card.suit]!;
  const isCourt = card.rank >= 11 && card.rank <= 13;

  return (
    <LinearGradient
      colors={["#ffffff", "#f3f4ee"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[
        styles.card,
        styles.cardDepth,
        { width: d.w, height: d.h, borderRadius: d.radius, padding: d.pad },
        highlighted && styles.highlighted,
      ]}
    >
      <View style={styles.faceGloss} />
      <CardIndex rank={rank} suit={suit} color={color} fontSize={d.corner} suitSize={d.csuit} />
      {isCourt && (
        <View style={styles.courtMedallion}>
          <Text style={[styles.courtCrown, { color }]}>♛</Text>
        </View>
      )}
      <Text style={[styles.heroSuit, { color, fontSize: d.pip }]}>{suit}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.22)",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    overflow: "hidden",
  },
  cardDepth: {
    transform: [{ perspective: 500 }, { rotateX: "2deg" }],
    borderBottomWidth: 3,
    borderBottomColor: "rgba(20,20,24,0.38)",
  },
  highlighted: {
    transform: [{ perspective: 500 }, { translateY: -8 }, { scale: 1.03 }, { rotateX: "2deg" }],
  },
  faceGloss: {
    position: "absolute", left: 1, right: 1, top: 1, height: "34%",
    borderTopLeftRadius: 7, borderTopRightRadius: 7,
    backgroundColor: "rgba(255,255,255,0.36)",
  },
  index: { position: "absolute", top: 1, left: 3, alignItems: "center", zIndex: 2 },
  cornerRank: {
    fontFamily: "serif", fontWeight: "900", lineHeight: undefined,
    letterSpacing: -1,
  },
  cornerSuit: { fontFamily: "serif", fontWeight: "900", marginTop: -5 },
  heroSuit: {
    position: "absolute", right: 3, bottom: -1,
    fontFamily: "serif", fontWeight: "900", textAlign: "center",
  },
  courtMedallion: {
    position: "absolute", left: "34%", top: "31%",
    width: "50%", height: "50%", borderRadius: 4,
    backgroundColor: "#f1d58b", borderWidth: 1, borderColor: "#b98a35",
    alignItems: "center", justifyContent: "center",
    transform: [{ rotate: "8deg" }],
  },
  courtCrown: { fontFamily: "serif", fontSize: 21, fontWeight: "900" },
});
