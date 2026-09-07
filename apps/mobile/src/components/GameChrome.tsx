import React from "react";
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
    backgroundColor: "rgba(10, 10, 10, 0.75)",
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
});
