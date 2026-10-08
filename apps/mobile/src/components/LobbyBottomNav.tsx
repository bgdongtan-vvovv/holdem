import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { koCopy } from "../brand/copy.ko";
import { prime } from "./primeTheme";

type NavKey = "home" | "game" | "tournament" | "season" | "profile";

const ITEMS: { key: NavKey; glyph: string; label: string }[] = [
  { key: "home", glyph: "◉", label: koCopy.lobby.nav.home },
  { key: "tournament", glyph: "♛", label: koCopy.lobby.nav.tournament },
  { key: "game", glyph: "♠", label: koCopy.lobby.nav.game },
  { key: "season", glyph: "✦", label: koCopy.lobby.nav.season },
  { key: "profile", glyph: "●", label: koCopy.lobby.nav.profile },
];

/**
 * 하단 내비 — 샘플 로비의 5칸 바 + 가운데 골드 링 원형 버튼(빠른 참가).
 */
export function LobbyBottomNav({
  active,
  onCenterPress,
  centerBusy = false,
}: {
  active: NavKey;
  onCenterPress?: () => void;
  centerBusy?: boolean;
}) {
  return (
    <View style={styles.bar}>
      {ITEMS.map((item) => {
        if (item.key === "game") {
          return (
            <View key={item.key} style={styles.centerSlot}>
              <Pressable
                testID="quick-join"
                accessibilityRole="button"
                accessibilityLabel={koCopy.lobby.quickJoin}
                onPress={onCenterPress}
                style={styles.centerBtnHit}
              >
                <LinearGradient colors={["#f7dd92", "#b98a35", "#6e4c17"]} style={styles.centerRing}>
                  <View style={styles.centerCore}>
                    <Text style={styles.centerGlyph}>{centerBusy ? "…" : "♠"}</Text>
                    <Text style={styles.centerLabel}>PLAY</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          );
        }
        const on = item.key === active;
        return (
          <View key={item.key} style={styles.item}>
            <Text style={[styles.glyph, on && styles.on]}>{item.glyph}</Text>
            <Text style={[styles.label, on && styles.on]}>{item.label}</Text>
            {on ? <View style={styles.activeBar} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 62,
    backgroundColor: "#1c1c1e",
    borderTopWidth: 1,
    borderTopColor: "#2c2c2f",
    paddingBottom: 6,
  },
  item: { flex: 1, alignItems: "center", gap: 2 },
  glyph: { color: "#8b8b90", fontSize: 19 },
  label: { color: "#8b8b90", fontSize: 10, fontWeight: "600" },
  on: { color: "#f0f0f0" },
  activeBar: { position: "absolute", top: -12, width: 26, height: 2, borderRadius: 1, backgroundColor: prime.red },
  centerSlot: { flex: 1, alignItems: "center" },
  centerBtnHit: { marginTop: -30 },
  centerRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 3,
    shadowColor: "#000",
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  centerCore: {
    flex: 1,
    borderRadius: 32,
    backgroundColor: "#231b14",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.6)",
  },
  centerGlyph: { color: prime.gold, fontSize: 24, lineHeight: 26 },
  centerLabel: { color: "#f1d48a", fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
});
