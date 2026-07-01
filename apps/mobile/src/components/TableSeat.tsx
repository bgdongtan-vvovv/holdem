import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import type { PlayerState } from "@holdem/poker-engine";
import type { Card } from "@holdem/poker-engine";
import { theme } from "../theme";
import { Avatar } from "./Avatar";
import { PlayingCard } from "./PlayingCard";
import { AnimatedAppear } from "./AnimatedAppear";
import { formatGameMoney } from "../formatMoney";

export function TableSeat({
  player,
  isHuman,
  isActive,
  revealCards,
  isWinner,
  matchedCards,
  dealIndex,
  playerCount,
  dealOffset,
}: {
  player: PlayerState;
  isHuman: boolean;
  isActive: boolean;
  revealCards: boolean;
  isWinner: boolean;
  matchedCards?: Set<string>;
  dealIndex: number;
  playerCount: number;
  dealOffset: { x: number; y: number };
}) {
  const folded = player.status === "folded";
  const out = player.status === "out";
  const showCards = isHuman || revealCards;
  const hasCards = player.holeCards.length > 0 && !folded && !out;
  const avatarSize = isHuman ? 82 : 68;

  // 활성 좌석 펄스
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isActive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, pulse]);

  return (
    <View style={[styles.wrap, folded && styles.folded]}>
      {/* 활성 펄스 링 */}
      {isActive && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: avatarSize + 16,
              height: avatarSize + 16,
              borderRadius: (avatarSize + 16) / 2,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.85] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.12] }) }],
            },
          ]}
        />
      )}

      {/* 승자 배지 */}
      {isWinner && (
        <AnimatedAppear style={styles.winBadge} translateY={-10} duration={520}>
          <Text style={styles.winText}>WIN</Text>
        </AnimatedAppear>
      )}

      {/* 홀카드 */}
      {hasCards && (
        <View style={[styles.cards, isHuman ? styles.cardsHuman : styles.cardsOther]}>
          {player.holeCards.map((c, i) => (
            <DealtCard
              key={cardKey(c)}
              delay={(i * playerCount + dealIndex) * 270}
              from={dealOffset}
            >
              <PlayingCard
                card={c}
                hidden={!showCards}
                size={isHuman ? "md" : "sm"}
                highlighted={showCards && matchedCards?.has(cardKey(c))}
              />
            </DealtCard>
          ))}
        </View>
      )}

      <View style={[styles.avatarLayer, isWinner ? styles.avatarWin : undefined]}>
        <Avatar seat={player.seat} size={avatarSize} />
      </View>

      <View style={[styles.plate, isActive && styles.plateActive, isWinner && styles.plateWin]}>
        <Text style={styles.name} numberOfLines={1}>
          {player.id}
        </Text>
        <Text style={styles.stack}>{out ? "OUT" : formatGameMoney(player.stack)}</Text>
        {isActive && (
          <View style={styles.timerTrack}>
            <View style={styles.timerFill} />
          </View>
        )}
      </View>
    </View>
  );
}

function DealtCard({
  children,
  delay,
  from,
}: {
  children: React.ReactNode;
  delay: number;
  from: { x: number; y: number };
}) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      delay,
      duration: 980,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [delay, progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [from.x, 0] }) },
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [from.y, 0] }) },
          { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) },
          { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ["-18deg", "0deg"] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

function cardKey(card: Card): string {
  return `${card.rank}${card.suit}`;
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", width: 110 },
  folded: { opacity: 0.45 },
  pulseRing: {
    position: "absolute",
    top: -8,
    borderWidth: 3,
    borderColor: theme.gold,
  },
  winBadge: {
    position: "absolute",
    top: -18,
    zIndex: 5,
    backgroundColor: theme.gold,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fff7d6",
  },
  winText: { color: "#1a1a1a", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  avatarWin: {
    shadowColor: theme.gold,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  avatarLayer: { zIndex: 4 },
  cards: { position: "absolute", flexDirection: "row", zIndex: 3 },
  cardsOther: { top: 6, left: 82 },
  cardsHuman: { top: 3, left: 96 },
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
  plateWin: { borderColor: theme.gold, backgroundColor: "rgba(60,45,10,0.92)" },
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
