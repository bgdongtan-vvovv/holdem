import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { brandTokens } from "../brand/tokens";
import { koCopy } from "../brand/copy.ko";

export type LobbyGameId = "ring" | "sit-and-go" | "mtt";

export type LobbyGame = {
  id: LobbyGameId;
  title: string;
  subtitle: string;
  enabled: boolean;
};

const GLYPH: Record<LobbyGameId, string> = { ring: "♠", "sit-and-go": "♦", mtt: "♛" };

export function LobbyGameCard({ game, onPress }: { game: LobbyGame; onPress?: (game: LobbyGame) => void }) {
  const disabled = !game.enabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={disabled ? `${game.title} ${koCopy.lobby.comingSoon}` : game.title}
      disabled={disabled}
      onPress={onPress ? () => onPress(game) : undefined}
      style={({ pressed }) => [styles.card, disabled && styles.cardDisabled, pressed && !disabled && styles.cardPressed]}
    >
      <View style={[styles.glyphBox, disabled && styles.glyphBoxDisabled]}>
        <Text style={[styles.glyph, disabled && styles.glyphDisabled]}>{GLYPH[game.id]}</Text>
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, disabled && styles.titleDisabled]} numberOfLines={1}>
          {game.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {disabled ? koCopy.lobby.comingSoonHint : game.subtitle}
        </Text>
      </View>
      <View style={[styles.cta, disabled && styles.ctaDisabled]}>
        <Text style={[styles.ctaTxt, disabled && styles.ctaTxtDisabled]}>
          {disabled ? koCopy.lobby.comingSoon : koCopy.lobby.enter}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: brandTokens.radius.sheet - 4,
    backgroundColor: brandTokens.color.surfaceOverlay,
    borderWidth: 1,
    borderColor: brandTokens.depth.panelBorder,
    shadowColor: brandTokens.depth.panelShadow,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardPressed: { backgroundColor: brandTokens.color.surfaceRaised },
  cardDisabled: { opacity: 0.72, borderColor: "rgba(170,164,155,0.28)" },
  glyphBox: {
    width: 52,
    height: 52,
    borderRadius: brandTokens.radius.action,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brandTokens.color.felt,
    borderWidth: 1,
    borderColor: brandTokens.color.gold,
  },
  glyphBoxDisabled: { borderColor: brandTokens.color.textMuted },
  glyph: { color: brandTokens.color.goldBright, fontSize: 26, fontWeight: "900" },
  glyphDisabled: { color: brandTokens.color.textMuted },
  body: { flex: 1, minWidth: 0 },
  title: { color: brandTokens.color.text, fontSize: 17, fontWeight: "900" },
  titleDisabled: { color: brandTokens.color.textMuted },
  subtitle: { color: brandTokens.color.textMuted, fontSize: 12, marginTop: 3, fontWeight: "600" },
  cta: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: brandTokens.radius.action,
    backgroundColor: brandTokens.color.red,
    borderWidth: 1,
    borderColor: brandTokens.color.gold,
  },
  ctaDisabled: { backgroundColor: "transparent", borderColor: brandTokens.color.textMuted },
  ctaTxt: { color: brandTokens.color.text, fontSize: 13, fontWeight: "900" },
  ctaTxtDisabled: { color: brandTokens.color.textMuted },
});
