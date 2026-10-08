import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { prime } from "./primeTheme";

export type LobbyGame = {
  id: "ring" | "sit-and-go" | "mtt";
  title: string;
  subtitle: string;
  enabled: boolean;
};

const ART: Record<LobbyGame["id"], { colors: [string, string, string]; glyph: string; kicker: string }> = {
  ring: { colors: ["#8e2129", "#4e0f15", "#1a0a0b"], glyph: "♠", kicker: "RING GAME" },
  "sit-and-go": { colors: ["#1d4f3a", "#123326", "#0b1511"], glyph: "♣", kicker: "SIT & GO" },
  mtt: { colors: ["#6b5220", "#3b2c10", "#140f07"], glyph: "♛", kicker: "TOURNAMENT" },
};

/**
 * 로비 "추천" 카드 — 샘플 로비(KakaoTalk_20260902_160401081.jpg)의 For You 세로 카드 형식.
 */
export function LobbyGameCard({
  game,
  onPress,
  footnote,
}: {
  game: LobbyGame;
  onPress: (game: LobbyGame) => void;
  footnote?: string;
}) {
  const art = ART[game.id];
  return (
    <Pressable
      testID={`game-card-${game.id}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: !game.enabled }}
      onPress={() => onPress(game)}
      style={[styles.card, !game.enabled && styles.cardDisabled]}
    >
      <LinearGradient colors={art.colors} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={styles.fill}>
        <Text style={styles.watermark}>{art.glyph}</Text>
        <Text style={styles.kicker}>{art.kicker}</Text>
        <Text style={styles.title} numberOfLines={1}>{game.title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>{game.subtitle}</Text>
        <View style={styles.bottom}>
          {game.enabled ? (
            <View style={styles.playPill}>
              <Text style={styles.playPillText}>바로 참가 ›</Text>
            </View>
          ) : (
            <View style={styles.soonPill}>
              <Text style={styles.soonPillText}>준비 중</Text>
            </View>
          )}
          {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 128,
    height: 166,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(217,178,106,0.35)",
  },
  cardDisabled: { opacity: 0.6 },
  fill: { flex: 1, padding: 10 },
  watermark: {
    position: "absolute",
    right: -8,
    bottom: 18,
    fontSize: 92,
    color: "rgba(255,255,255,0.08)",
  },
  kicker: { color: prime.goldSoft, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: "#fff", fontSize: 17, fontWeight: "800", marginTop: 3 },
  subtitle: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 3, lineHeight: 14 },
  bottom: { position: "absolute", left: 10, right: 10, bottom: 10, gap: 4 },
  playPill: {
    alignSelf: "flex-start",
    backgroundColor: prime.gold,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  playPillText: { color: "#2a1d00", fontSize: 11, fontWeight: "800" },
  soonPill: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  soonPillText: { color: "#d5d5d5", fontSize: 11, fontWeight: "700" },
  footnote: { color: "rgba(255,255,255,0.6)", fontSize: 10 },
});
