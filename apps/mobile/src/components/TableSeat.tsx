import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { PlayerState } from "@holdem/poker-engine";
import { theme } from "../theme";
import { Avatar } from "./Avatar";
import { PlayingCard } from "./PlayingCard";

export function TableSeat({
  player,
  isHuman,
  isActive,
  revealCards,
}: {
  player: PlayerState;
  isHuman: boolean;
  isActive: boolean;
  revealCards: boolean;
}) {
  const folded = player.status === "folded";
  const out = player.status === "out";
  const showCards = isHuman || revealCards;
  const hasCards = player.holeCards.length > 0 && !folded && !out;
  const avatarSize = isHuman ? 72 : 58;

  return (
    <View style={[styles.wrap, folded && styles.folded]}>
      {/* 홀카드: 아바타 뒤로 살짝 겹쳐 표시 */}
      {hasCards && (
        <View style={[styles.cards, isHuman ? styles.cardsHuman : styles.cardsOther]}>
          {player.holeCards.map((c, i) => (
            <PlayingCard key={i} card={c} hidden={!showCards} size={isHuman ? "md" : "sm"} />
          ))}
        </View>
      )}

      <Avatar seat={player.seat} size={avatarSize} />

      <View style={[styles.plate, isActive && styles.plateActive]}>
        <Text style={styles.name} numberOfLines={1}>
          {player.id}
        </Text>
        <Text style={styles.stack}>{out ? "OUT" : (player.stack / 100).toFixed(2)}</Text>
        {/* 타임뱅크 바 (활성 좌석) */}
        {isActive && (
          <View style={styles.timerTrack}>
            <View style={styles.timerFill} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", width: 96 },
  folded: { opacity: 0.45 },
  cards: { position: "absolute", flexDirection: "row" },
  cardsOther: { top: -6, right: -14, zIndex: -1 },
  // 히어로는 두 장 모두 아바타 앞·오른쪽에 노출
  cardsHuman: { top: 10, right: -58, zIndex: 3 },
  plate: {
    marginTop: -10,
    minWidth: 84,
    backgroundColor: theme.namePlate,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  plateActive: { borderColor: theme.namePlateActive, shadowColor: theme.gold, shadowOpacity: 0.9, shadowRadius: 8 },
  name: { color: theme.text, fontWeight: "700", fontSize: 12, maxWidth: 88 },
  stack: { color: theme.gold, fontWeight: "800", fontSize: 13 },
  timerTrack: {
    marginTop: 3,
    width: "100%",
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  timerFill: { width: "70%", height: "100%", backgroundColor: theme.success },
});
