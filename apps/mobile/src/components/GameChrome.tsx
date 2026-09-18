import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { brandTokens } from "../brand/tokens";
import { koCopy } from "../brand/copy.ko";
import { formatGameMoney } from "../formatMoney";
import { playSfx } from "../sound/sfx";

export type TournamentSummary = {
  level: number;
  levelEndsAt: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  rank: number;
  remainingPlayers: number;
};

export type GameChromeProps = {
  mode: "ring" | "tournament";
  smallBlind: number;
  bigBlind: number;
  tournament?: TournamentSummary;
  onExit: () => void;
  onOpenMenu?: () => void;
};

export function GameChrome({
  mode,
  smallBlind,
  bigBlind,
  tournament,
  onExit,
  onOpenMenu,
}: GameChromeProps) {
  return (
    <View style={styles.topBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="퇴장"
        style={styles.iconBtn}
        onPress={() => {
          playSfx("ui_back");
          onExit();
        }}
      >
        <Text style={styles.iconTxt}>‹</Text>
      </Pressable>

      <View style={styles.centerInfo}>
        {mode === "ring" || !tournament ? (
          <Text style={styles.blindsTxt}>
            {koCopy.lobby.ring} · {formatGameMoney(smallBlind)} / {formatGameMoney(bigBlind)}
          </Text>
        ) : (
          <View style={styles.tourneyInfo}>
            <Text style={styles.tourneyLevel}>
              LEVEL {tournament.level} ({formatGameMoney(tournament.smallBlind)}/
              {formatGameMoney(tournament.bigBlind)}
              {tournament.ante > 0 ? ` A:${formatGameMoney(tournament.ante)}` : ""})
            </Text>
            <Text style={styles.tourneyRank}>
              순위: {tournament.rank}위 / {tournament.remainingPlayers}명 남음
            </Text>
          </View>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="메뉴"
        style={styles.iconBtn}
        onPress={() => {
          playSfx("ui_click");
          onOpenMenu?.();
        }}
      >
        <Text style={styles.iconTxt}>≡</Text>
      </Pressable>
    </View>
  );
}

/**
 * 측면 컨트롤 버튼(설정, 테이블 이동 등). 포커 테이블 좌우에 배치할 수 있다.
 */
export function SideChromeButton({
  glyph,
  onPress,
  label,
}: {
  glyph: string;
  onPress: () => void;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? glyph}
      style={styles.sideButton}
      onPress={onPress}
    >
      <Text style={styles.sideButtonText}>{glyph}</Text>
      {label ? <Text style={styles.sideButtonLabel}>{label}</Text> : null}
    </Pressable>
  );
}

/**
 * 딜러 버튼 뱃지 — 테이블 위 D 뱃지(금색 원 + D 텍스트).
 * 포커 테이블의 딜러 위치에 배치한다.
 */
export function DealerBadge() {
  return (
    <LinearGradient colors={["#fff3ae", "#e3ba50", "#a66b1d"]} style={styles.dealerBadge}>
      <Text style={styles.dealerBadgeText}>D</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    backgroundColor: "rgba(24, 15, 10, 0.85)",
    borderBottomWidth: 1,
    borderBottomColor: brandTokens.depth.panelBorder,
    zIndex: 20,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brandTokens.color.surfaceOverlay,
    borderWidth: 1,
    borderColor: brandTokens.depth.panelBorder,
  },
  iconTxt: {
    color: brandTokens.color.goldBright,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 24,
  },
  centerInfo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  blindsTxt: {
    color: brandTokens.color.goldBright,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tourneyInfo: {
    alignItems: "center",
  },
  tourneyLevel: {
    color: brandTokens.color.goldBright,
    fontSize: 13,
    fontWeight: "800",
  },
  tourneyRank: {
    color: brandTokens.color.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  sideButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(42,38,29,0.92)",
    borderWidth: 2,
    borderColor: "rgba(219,184,101,0.72)",
    shadowColor: "#000",
    shadowOpacity: 0.7,
    shadowRadius: 5,
  },
  sideButtonText: { color: "#e8ddb9", fontSize: 23, fontWeight: "900" },
  sideButtonLabel: {
    position: "absolute",
    bottom: -14,
    color: "rgba(255,255,255,0.55)",
    fontSize: 9,
    fontWeight: "700",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    overflow: "hidden",
  },
  dealerBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#ddb253",
    shadowColor: "#000", shadowOpacity: 0.75, shadowRadius: 4, shadowOffset: { width: 0, height: 3 },
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#f8df85",
  },
  dealerBadgeText: { color: "#67400e", fontWeight: "900", fontSize: 15 },
});
