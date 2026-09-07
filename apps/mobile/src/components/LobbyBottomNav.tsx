import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { brandTokens } from "../brand/tokens";
import { koCopy } from "../brand/copy.ko";

export type LobbyNavId = "home" | "game" | "tournament" | "season" | "profile";

export const LOBBY_NAV_ITEMS: ReadonlyArray<{ id: LobbyNavId; label: string; glyph: string }> = [
  { id: "home", label: koCopy.lobby.nav.home, glyph: "⌂" },
  { id: "game", label: koCopy.lobby.nav.game, glyph: "♠" },
  { id: "tournament", label: koCopy.lobby.nav.tournament, glyph: "♛" },
  { id: "season", label: koCopy.lobby.nav.season, glyph: "★" },
  { id: "profile", label: koCopy.lobby.nav.profile, glyph: "●" },
];

export function LobbyBottomNav({
  active,
  onSelect,
  bottomInset = 0,
}: {
  active: LobbyNavId;
  onSelect?: (id: LobbyNavId) => void;
  bottomInset?: number;
}) {
  return (
    <View style={[styles.bar, { paddingBottom: 8 + bottomInset }]}>
      {LOBBY_NAV_ITEMS.map((item) => {
        const isActive = item.id === active;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item.label}
            onPress={onSelect ? () => onSelect(item.id) : undefined}
            style={styles.item}
          >
            <Text style={[styles.glyph, isActive && styles.glyphActive]}>{item.glyph}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
              {item.label}
            </Text>
            {isActive ? <View style={styles.indicator} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export const LOBBY_NAV_HEIGHT = 64;

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    paddingTop: 8,
    minHeight: LOBBY_NAV_HEIGHT,
    backgroundColor: "rgba(13,13,13,0.98)",
    borderTopWidth: 1,
    borderTopColor: brandTokens.depth.panelBorder,
  },
  item: { flex: 1, alignItems: "center", gap: 2, paddingVertical: 2 },
  glyph: { color: brandTokens.color.textMuted, fontSize: 20, lineHeight: 24, fontWeight: "700" },
  glyphActive: { color: brandTokens.color.goldBright },
  label: { color: brandTokens.color.textMuted, fontSize: 11, fontWeight: "700" },
  labelActive: { color: brandTokens.color.gold },
  indicator: {
    marginTop: 2,
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: brandTokens.color.gold,
  },
});
