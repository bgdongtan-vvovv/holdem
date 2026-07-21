import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Card } from "@holdem/poker-engine";
import { theme } from "../theme";
import { CARD_BACK_IMAGE, CARD_FACE_IMAGES } from "./cardImages";

const RANK_LABEL: Record<number, string> = {
  2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9",
  10: "10", 11: "J", 12: "Q", 13: "K", 14: "A",
};
const SUIT_SYMBOL: Record<string, string> = { c: "♣", d: "♦", h: "♥", s: "♠" };
const SUIT_CODE: Record<string, string> = { c: "C", d: "D", h: "H", s: "S" };

const DIMS = {
  sm: { w: 36, h: 52, corner: 17, csuit: 12, pip: 25, radius: 6, pad: 3 },
  md: { w: 46, h: 66, corner: 22, csuit: 15, pip: 33, radius: 7, pad: 3 },
  lg: { w: 62, h: 88, corner: 30, csuit: 19, pip: 47, radius: 9, pad: 4 },
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

function CourtArt({
  rank,
  suit,
  color,
  size,
}: {
  rank: string;
  suit: string;
  color: string;
  size: "sm" | "md" | "lg";
}) {
  const d = DIMS[size];
  const isRed = color === theme.red;
  const coat = isRed ? "#d81f2a" : "#1f4f9a";
  const shadow = isRed ? "#82151c" : "#152c56";
  const crown = isRed ? "#b52228" : "#315f9f";
  const artW = d.w * 0.68;
  const artH = d.h * 0.62;
  const face = Math.max(9, d.w * 0.19);

  return (
    <View
      style={[
        styles.courtArt,
        {
          width: artW,
          height: artH,
          right: d.w * 0.08,
          bottom: d.h * 0.03,
        },
      ]}
    >
      <View style={[styles.courtShoulder, { width: artW * 0.84, height: artH * 0.42, backgroundColor: shadow }]} />
      <View style={[styles.courtRobe, { width: artW * 0.72, height: artH * 0.54, backgroundColor: coat }]}>
        <Text style={[styles.courtSuitPattern, { color: "#fff", fontSize: d.w * 0.16 }]}>{suit}</Text>
        <View style={[styles.courtSlash, { backgroundColor: "rgba(255,255,255,0.82)" }]} />
      </View>
      <View style={[styles.courtNeck, { width: face * 0.42, height: face * 0.28 }]} />
      <View style={[styles.courtFace, { width: face, height: face * 1.22, borderRadius: face * 0.34 }]}>
        <View style={[styles.courtEye, { left: face * 0.25 }]} />
        <View style={[styles.courtEye, { right: face * 0.25 }]} />
        <View style={styles.courtMouth} />
      </View>
      <View style={[styles.courtHair, { width: face * 1.16, height: face * 0.44, borderRadius: face * 0.24 }]} />
      <View style={[styles.courtCrownBase, { width: face * 1.28, height: face * 0.34, backgroundColor: crown }]}>
        <Text style={[styles.courtCrownMark, { fontSize: face * 0.34 }]}>● ● ●</Text>
      </View>
      <Text style={[styles.courtRankGhost, { color, fontSize: d.w * 0.28 }]}>{rank}</Text>
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
          source={CARD_BACK_IMAGE}
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
  const imageKey = `${rank}${SUIT_CODE[card.suit]}`;
  const faceImage = CARD_FACE_IMAGES[imageKey];
  const isCourt = card.rank >= 11 && card.rank <= 13;

  if (faceImage) {
    return (
      <View
        style={[
          styles.imageCardWrap,
          { width: d.w, height: d.h, borderRadius: d.radius },
          highlighted && styles.highlightedImage,
        ]}
      >
        <Image
          source={faceImage}
          resizeMode="contain"
          style={{ width: d.w, height: d.h }}
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#ffffff", "#fefefe", "#f4f5f0"]}
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
      {isCourt ? (
        <CourtArt rank={rank} suit={suit} color={color} size={size} />
      ) : (
        <Text style={[styles.heroSuit, { color, fontSize: d.pip }]}>{suit}</Text>
      )}
      <Text style={[styles.bottomSuit, { color, fontSize: d.csuit }]}>{suit}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 2,
    borderWidth: 1.2,
    borderColor: "rgba(22,32,52,0.22)",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    overflow: "hidden",
  },
  imageCardWrap: {
    margin: 2,
    overflow: "visible",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  highlightedImage: {
    transform: [{ translateY: -8 }, { scale: 1.03 }],
  },
  cardDepth: {
    transform: [{ perspective: 500 }, { rotateX: "2deg" }],
    borderBottomWidth: 3.2,
    borderBottomColor: "rgba(19,24,32,0.35)",
  },
  highlighted: {
    transform: [{ perspective: 500 }, { translateY: -8 }, { scale: 1.03 }, { rotateX: "2deg" }],
  },
  faceGloss: {
    position: "absolute", left: 1, right: 1, top: 1, height: "30%",
    borderTopLeftRadius: 7, borderTopRightRadius: 7,
    backgroundColor: "rgba(255,255,255,0.54)",
  },
  index: { position: "absolute", top: 1, left: 4, alignItems: "center", zIndex: 3 },
  cornerRank: {
    fontWeight: "900",
    lineHeight: undefined,
    letterSpacing: -1.5,
    textShadowColor: "rgba(0,0,0,0.08)",
    textShadowRadius: 0.5,
  },
  cornerSuit: { fontWeight: "900", marginTop: -6, letterSpacing: -1 },
  heroSuit: {
    position: "absolute", right: 5, bottom: 3,
    fontWeight: "900", textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowRadius: 0.5,
  },
  bottomSuit: {
    position: "absolute",
    right: 4,
    bottom: 2,
    fontWeight: "900",
    opacity: 0.9,
  },
  courtArt: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  courtShoulder: {
    position: "absolute",
    bottom: 0,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  courtRobe: {
    position: "absolute",
    bottom: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    overflow: "hidden",
  },
  courtSuitPattern: {
    position: "absolute",
    left: 2,
    bottom: 1,
    fontWeight: "900",
    opacity: 0.95,
  },
  courtSlash: {
    position: "absolute",
    width: "24%",
    height: "120%",
    left: "55%",
    top: "-12%",
    transform: [{ rotate: "-22deg" }],
  },
  courtNeck: {
    position: "absolute",
    bottom: "45%",
    borderRadius: 999,
    backgroundColor: "#dfb08c",
  },
  courtFace: {
    position: "absolute",
    bottom: "50%",
    backgroundColor: "#f0c39e",
    borderWidth: 0.8,
    borderColor: "#7d563b",
  },
  courtHair: {
    position: "absolute",
    bottom: "69%",
    backgroundColor: "#3b2a23",
  },
  courtEye: {
    position: "absolute",
    top: "38%",
    width: 1.6,
    height: 1.6,
    borderRadius: 1,
    backgroundColor: "#2a1a16",
  },
  courtMouth: {
    position: "absolute",
    bottom: "22%",
    left: "39%",
    width: "22%",
    height: 1,
    borderRadius: 2,
    backgroundColor: "#8a4238",
  },
  courtCrownBase: {
    position: "absolute",
    bottom: "75%",
    borderRadius: 2,
    borderWidth: 0.8,
    borderColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  courtCrownMark: {
    color: "#fff",
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: -1,
  },
  courtRankGhost: {
    position: "absolute",
    right: 0,
    top: "38%",
    fontWeight: "900",
    opacity: 0.18,
  },
});
