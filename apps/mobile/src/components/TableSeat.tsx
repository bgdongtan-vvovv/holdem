import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import type { PlayerState } from "@holdem/poker-engine";
import type { Card } from "@holdem/poker-engine";
import { theme } from "../theme";
import { Avatar } from "./Avatar";
import { PlayingCard } from "./PlayingCard";
import { AnimatedAppear } from "./AnimatedAppear";
import { formatGameMoney } from "../formatMoney";
import { playSfx } from "../sound/sfx";

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
  avatarIndex,
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
  avatarIndex?: number;
}) {
  const folded = player.status === "folded";
  const out = player.status === "out";
  const showCards = isHuman || revealCards;
  const hasCards = player.holeCards.length > 0 && !folded && !out;
  const avatarSize = isHuman ? 96 : 82;
  const cardsOnLeft = dealIndex === 3 || dealIndex === 4 || dealIndex === 5;

  return (
    <View style={[styles.wrap, folded && styles.folded]}>
      {/* 승자 배지 */}
      {isWinner && (
        <AnimatedAppear style={styles.winBadge} translateY={-10} duration={520}>
          <Text style={styles.winText}>WIN</Text>
        </AnimatedAppear>
      )}

      {/* 홀카드 */}
      {hasCards && (
        <View
          style={[
            styles.cards,
            isHuman ? styles.cardsHuman : styles.cardsOther,
            cardsOnLeft ? styles.cardsLeft : styles.cardsRight,
          ]}
        >
          {player.holeCards.map((c, i) => (
            <DealtCard
              key={cardKey(c)}
              delay={(i * playerCount + dealIndex) * 270}
              from={dealOffset}
              overlap={i === 0 ? 0 : isHuman ? -12 : -29}
              settleY={!isHuman && i === 1 ? 3 : 0}
              rotateTo={!isHuman ? (i === 0 ? "-5deg" : "4deg") : "0deg"}
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
        <Avatar seat={player.seat} avatarIndex={avatarIndex} size={avatarSize} />
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
  overlap,
  settleY,
  rotateTo,
}: {
  children: React.ReactNode;
  delay: number;
  from: { x: number; y: number };
  overlap: number;
  settleY: number;
  rotateTo: string;
}) {
  const [visible, setVisible] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const revealTimer = setTimeout(() => {
      playSfx("card_flip");
      setVisible(true);
    }, delay);
    return () => clearTimeout(revealTimer);
  }, [delay]);

  useEffect(() => {
    if (!visible) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: 760,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        marginLeft: overlap,
        opacity: progress,
        transform: [
          { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [from.x, 0] }) },
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [from.y, settleY] }) },
          { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) },
          { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ["-18deg", rotateTo] }) },
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
  wrap: { alignItems: "center", width: 118 },
  folded: { opacity: 0.45 },
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
  cards: { position: "absolute", flexDirection: "row", zIndex: 3, top: 0 },
  cardsOther: { width: 47 },
  cardsHuman: { top: 2, width: 84 },
  cardsRight: { left: 91 },
  cardsLeft: { right: 91 },
  plate: {
    marginTop: -15,
    minWidth: 104,
    backgroundColor: theme.namePlate,
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingTop: 9,
    paddingBottom: 5,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  plateActive: { borderColor: theme.namePlateActive, shadowColor: theme.gold, shadowOpacity: 0.9, shadowRadius: 8 },
  plateWin: { borderColor: theme.gold, backgroundColor: "rgba(60,45,10,0.92)" },
  name: { color: theme.text, fontWeight: "800", fontSize: 12, minWidth: 100, textAlign: "center" },
  stack: { color: theme.gold, fontWeight: "900", fontSize: 15 },
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
