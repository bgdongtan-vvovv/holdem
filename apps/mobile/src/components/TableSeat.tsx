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

      <View style={styles.avatarLayer}>
        {isWinner && <WinnerGlow />}
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

function WinnerGlow() {
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1050,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1050,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 5200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    pulseLoop.start();
    spinLoop.start();
    return () => {
      pulseLoop.stop();
      spinLoop.stop();
    };
  }, [pulse, spin]);

  return (
    <AnimatedAppear style={styles.avatarGlow} translateY={4} duration={620}>
      <Animated.View
        style={[
          styles.avatarGlowCore,
          {
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.95] }),
            transform: [
              { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.12] }) },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.avatarGlowRing,
          {
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.78] }),
            transform: [
              { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.2] }) },
              {
                rotate: spin.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "360deg"],
                }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.avatarGlowSpark,
          {
            opacity: pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.85, 0.25] }),
            transform: [
              {
                rotate: spin.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["360deg", "0deg"],
                }),
              },
              { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] }) },
            ],
          },
        ]}
      >
        <View style={[styles.avatarSpark, styles.avatarSparkTop]} />
        <View style={[styles.avatarSpark, styles.avatarSparkRight]} />
        <View style={[styles.avatarSpark, styles.avatarSparkBottom]} />
        <View style={[styles.avatarSpark, styles.avatarSparkLeft]} />
      </Animated.View>
    </AnimatedAppear>
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
  avatarLayer: {
    zIndex: 4,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  avatarGlow: {
    position: "absolute",
    left: -16,
    right: -16,
    top: -18,
    bottom: -8,
    alignItems: "center",
    justifyContent: "center",
    zIndex: -1,
  },
  avatarGlowCore: {
    position: "absolute",
    width: 112,
    height: 100,
    borderRadius: 56,
    backgroundColor: "rgba(255,202,74,0.2)",
    shadowColor: theme.gold,
    shadowOpacity: 0.95,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
  },
  avatarGlowRing: {
    position: "absolute",
    width: 92,
    height: 84,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: "rgba(255,219,112,0.5)",
    shadowColor: theme.gold,
    shadowOpacity: 0.85,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  avatarGlowSpark: {
    position: "absolute",
    width: 118,
    height: 106,
  },
  avatarSpark: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#fff4b8",
    shadowColor: theme.gold,
    shadowOpacity: 1,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
  },
  avatarSparkTop: { left: 56, top: 2 },
  avatarSparkRight: { right: 3, top: 48 },
  avatarSparkBottom: { left: 50, bottom: 0 },
  avatarSparkLeft: { left: 3, top: 42 },
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
  plateWin: {
    borderColor: "rgba(255,210,89,0.78)",
    backgroundColor: "rgba(18,16,12,0.82)",
  },
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
