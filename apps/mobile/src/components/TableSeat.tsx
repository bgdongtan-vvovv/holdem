import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, PanResponder, StyleSheet, Text, View } from "react-native";
import type { PlayerState } from "@holdem/poker-engine";
import type { Card } from "@holdem/poker-engine";
import { prime } from "./primeTheme";
import { LinearGradient } from "expo-linear-gradient";
import { Avatar } from "./Avatar";
import { PlayingCard } from "./PlayingCard";
import { AnimatedAppear } from "./AnimatedAppear";
import { formatGameMoney } from "../formatMoney";
import { playSfx } from "../sound/sfx";

/** 서버 타임뱅크(apps/server/src/table.ts TIMEBANK_MS)와 맞춘 시각적 카운트다운 길이. */
const TURN_TIMER_MS = 20_000;

export const SEAT_WIDTH = 112;
const TAG_HEIGHT = 20;
const AVATAR_SIZE = 58;
const HERO_AVATAR_SIZE = 66;

/** 좌석 컴포넌트 상단에서 아바타 중심까지의 거리 — PokerTable 이 앵커를 아바타 중심에 맞출 때 쓴다. */
export function seatAvatarCenterY(isHuman: boolean): number {
  return TAG_HEIGHT + (isHuman ? HERO_AVATAR_SIZE : AVATAR_SIZE) / 2;
}

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
  countryFlag,
  rank,
  cardsOpened,
  onOpenCards,
  reaction,
  inHand = false,
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
  countryFlag?: string;
  rank?: number;
  /** 사람 좌석 전용: 내 홀카드를 아직 직접 열어보지 않았으면 false. */
  cardsOpened?: boolean;
  onOpenCards?: () => void;
  /** key 가 바뀔 때마다 새로 떠오르는 이모지 반응 말풍선. */
  reaction?: { emoji: string; key: number };
  /** 핸드 진행 중 여부 — 카드 정보가 없는 상대에게 뒷면 카드를 그릴 때 쓴다. */
  inHand?: boolean;
}) {
  const folded = player.status === "folded";
  const out = player.status === "out";
  const allIn = player.status === "allin";
  const showCards = isHuman || revealCards;
  const live = !folded && !out;
  const hasCards = player.holeCards.length > 0 && live;
  const showBacks = !isHuman && !hasCards && live && inHand;
  const needsOpen = isHuman && hasCards && cardsOpened === false;
  const avatarSize = isHuman ? HERO_AVATAR_SIZE : AVATAR_SIZE;
  const timerProgress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    timerProgress.stopAnimation();
    if (!isActive) {
      timerProgress.setValue(1);
      return;
    }
    timerProgress.setValue(1);
    Animated.timing(timerProgress, {
      toValue: 0,
      duration: TURN_TIMER_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [isActive, timerProgress]);

  const cardSize = isHuman ? "lg" : "sm";
  // 핸드가 배정된 좌석(내 카드든, 서버가 아직 안 가린 상대 카드든, 뒷면만 아는 상대든)은
  // 쇼다운에서 실제 카드가 드러나도 같은 카드 슬롯(key)을 유지해 재배치 애니메이션이
  // 다시 재생되지 않도록 한다 — hasCards/showBacks 두 분기를 하나로 합침.
  const dealt = hasCards || showBacks;

  return (
    <View style={[styles.wrap, (folded || out) && styles.folded]}>
      <View style={styles.tagSlot}>
        {player.committed > 0 && (
          <LinearGradient colors={[prime.goldTagTop, prime.goldTagBottom]} style={styles.tag}>
            <Text style={styles.tagText}>{formatGameMoney(player.committed)}</Text>
          </LinearGradient>
        )}
      </View>

      <View style={[styles.avatarBox, { width: avatarSize, height: avatarSize }]}>
        {isWinner && <WinnerGlow />}
        <Avatar seat={player.seat} avatarIndex={avatarIndex} size={avatarSize} countryFlag={countryFlag} rank={rank} />

        {dealt && (
          <View
            style={[
              styles.cards,
              isHuman ? styles.cardsHuman : styles.cardsOther,
            ]}
          >
            {[0, 1].map((i) => {
              const c = player.holeCards[i];
              return (
                <DealtCard
                  key={`slot-${i}`}
                  delay={(i * playerCount + dealIndex) * 270}
                  from={dealOffset}
                  overlap={i === 0 ? 0 : isHuman ? -6 : -14}
                  settleY={!isHuman && i === 1 ? 1 : 0}
                  rotateTo={isHuman ? "0deg" : i === 0 ? "-7deg" : "7deg"}
                >
                  <PlayingCard
                    card={c}
                    hidden={!showCards}
                    size={cardSize}
                    highlighted={!!c && showCards && matchedCards?.has(cardKey(c))}
                  />
                </DealtCard>
              );
            })}
            {isHuman && cardsOpened !== undefined && (
              <CardPeekOverlay visible={needsOpen} onOpened={onOpenCards} />
            )}
          </View>
        )}

        {folded && (
          <View style={styles.foldLabel}>
            <Text style={styles.foldLabelText}>Fold</Text>
          </View>
        )}

        {isWinner && (
          <AnimatedAppear style={styles.winBadge} translateY={-8} duration={520}>
            <Text style={styles.winText}>WIN</Text>
          </AnimatedAppear>
        )}

        {reaction && <ReactionBubble key={reaction.key} emoji={reaction.emoji} />}
      </View>

      <View style={[styles.plate, isActive && styles.plateActive, isWinner && styles.plateWin]}>
        <Text style={[styles.name, isHuman && styles.nameHero]} numberOfLines={1}>
          {player.id}
        </Text>
        <View style={styles.stackBand}>
          <Text style={[styles.stack, allIn && styles.stackAllIn]} numberOfLines={1}>
            {out ? "OUT" : allIn ? "All-In" : formatGameMoney(player.stack)}
          </Text>
        </View>
      </View>
      {isActive && (
        <View style={styles.timerTrack}>
          <Animated.View
            style={[
              styles.timerFill,
              {
                width: timerProgress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                backgroundColor: timerProgress.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: ["#e5482f", "#f0d23a", "#78d23c"],
                }),
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const REACTION_LIFETIME_MS = 2400;

/** 아바타 위로 떠오르는 이모지 반응 말풍선. 팝업 → 살짝 위로 떠오름 → 페이드아웃. */
function ReactionBubble({ emoji }: { emoji: string }) {
  const pop = useRef(new Animated.Value(0)).current;
  const life = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pop.setValue(0);
    life.setValue(0);
    // 통통 튀는 등장(강한 오버슈트 스프링) → 잠깐 머문 뒤 위로 떠오르며 사라짐.
    const anim = Animated.parallel([
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 3.2, tension: 160 }),
      Animated.timing(life, {
        toValue: 1,
        duration: REACTION_LIFETIME_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [pop, life]);

  return (
    <Animated.View
      style={[
        styles.reactionBubble,
        {
          opacity: life.interpolate({ inputRange: [0, 0.05, 0.8, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateY: life.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, -6, -34] }) },
            { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
            { rotate: pop.interpolate({ inputRange: [0, 0.6, 1], outputRange: ["-24deg", "10deg", "0deg"] }) },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.reactionBubbleText}>{emoji}</Text>
      <View style={styles.reactionTail} />
    </Animated.View>
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

const PEEK_DRAG_RANGE = 64; // 이 거리(px)만큼 드래그하면 완전히 열림
const PEEK_OPEN_THRESHOLD = 0.55; // 손을 뗐을 때 이 비율 이상이면 열림 확정

/**
 * 내 홀카드 위에 겹쳐지는 뒷면 카드. 손가락으로 끌면(방향 무관, 거리 기준)
 * 서서히 젖혀지며 아래의 실제 카드가 드러난다. 임계값 전에 손을 떼면 다시 덮인다.
 */
function CardPeekOverlay({ visible, onOpened }: { visible: boolean; onOpened?: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
      onPanResponderMove: (_, g) => {
        const dist = Math.max(Math.abs(g.dx), Math.abs(g.dy));
        progress.setValue(Math.min(1, dist / PEEK_DRAG_RANGE));
      },
      onPanResponderRelease: (_, g) => {
        const dist = Math.max(Math.abs(g.dx), Math.abs(g.dy));
        const ratio = Math.min(1, dist / PEEK_DRAG_RANGE);
        if (ratio >= PEEK_OPEN_THRESHOLD) {
          playSfx("card_flip");
          Animated.timing(progress, {
            toValue: 1,
            duration: 140,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (finished) onOpened?.();
          });
        } else {
          Animated.spring(progress, { toValue: 0, useNativeDriver: true, friction: 6 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(progress, { toValue: 0, useNativeDriver: true, friction: 6 }).start();
      },
    }),
  ).current;

  if (!visible) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.peekOverlay,
        {
          opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -36] }) },
            { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-12deg"] }) },
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] }) },
          ],
        },
      ]}
    >
      <View style={styles.peekCards}>
        <PlayingCard hidden size="md" />
        <View style={{ marginLeft: -6 }}>
          <PlayingCard hidden size="md" />
        </View>
      </View>
      <View style={styles.peekHint}>
        <Text style={styles.peekHintText}>밀어서 확인</Text>
      </View>
    </Animated.View>
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
  wrap: { alignItems: "center", width: SEAT_WIDTH },
  folded: { opacity: 0.55 },
  tagSlot: { height: TAG_HEIGHT, justifyContent: "flex-start", alignItems: "center" },
  tag: {
    minWidth: 54,
    height: 17,
    paddingHorizontal: 7,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f7eccb",
  },
  tagText: { color: prime.goldTagText, fontWeight: "800", fontSize: 11.5 },
  avatarBox: { zIndex: 6, alignItems: "center", justifyContent: "center", overflow: "visible" },
  winBadge: {
    position: "absolute",
    top: "28%",
    alignSelf: "center",
    zIndex: 16,
  },
  winText: {
    color: "#ffd56a",
    fontWeight: "900",
    fontSize: 24,
    fontFamily: "Georgia",
    letterSpacing: 1,
    textShadowColor: "#5a2c00",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  foldLabel: {
    position: "absolute",
    top: "36%",
    alignSelf: "center",
    paddingHorizontal: 9,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#e3343d",
    backgroundColor: "rgba(20,4,6,0.85)",
    zIndex: 15,
  },
  foldLabelText: { color: "#ff5a62", fontWeight: "800", fontSize: 12 },
  reactionBubble: {
    position: "absolute",
    top: -46,
    right: -42,
    zIndex: 30,
    backgroundColor: "rgba(250,250,250,0.96)",
    borderRadius: 34,
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  reactionBubbleText: { fontSize: 42, lineHeight: 50 },
  reactionTail: {
    position: "absolute",
    left: 6,
    bottom: 2,
    width: 14,
    height: 14,
    backgroundColor: "rgba(250,250,250,0.96)",
    transform: [{ rotate: "45deg" }],
    zIndex: -1,
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
    width: 96,
    height: 90,
    borderRadius: 48,
    backgroundColor: "rgba(255,202,74,0.18)",
    shadowColor: prime.gold,
    shadowOpacity: 0.95,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  avatarGlowRing: {
    position: "absolute",
    width: 80,
    height: 76,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "rgba(255,219,112,0.5)",
  },
  avatarGlowSpark: { position: "absolute", width: 100, height: 94 },
  avatarSpark: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#fff4b8",
  },
  avatarSparkTop: { left: 48, top: 2 },
  avatarSparkRight: { right: 3, top: 42 },
  avatarSparkBottom: { left: 44, bottom: 0 },
  avatarSparkLeft: { left: 3, top: 37 },
  cards: { position: "absolute", flexDirection: "row", zIndex: 6, alignSelf: "center" },
  cardsOther: { top: "6%" },
  cardsHuman: { top: -5 },
  plate: {
    marginTop: -4,
    width: 92,
    backgroundColor: "rgba(22,22,24,0.94)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#3b3b3e",
    alignItems: "center",
    overflow: "hidden",
    zIndex: 5,
  },
  plateActive: {
    borderColor: "#f3f3f3",
    borderWidth: 1.5,
    shadowColor: "#fff",
    shadowOpacity: 0.55,
    shadowRadius: 6,
  },
  plateWin: { borderColor: prime.gold },
  name: { color: "#f1f1f1", fontWeight: "600", fontSize: 12, paddingTop: 2, paddingHorizontal: 4, maxWidth: 90 },
  nameHero: { color: prime.heroName, fontWeight: "700" },
  stackBand: {
    alignSelf: "stretch",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingBottom: 1,
  },
  stack: { color: prime.stackBlue, fontWeight: "700", fontSize: 13.5 },
  stackAllIn: { color: "#ff4c4c" },
  timerTrack: {
    marginTop: 2,
    width: 88,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.6)",
    overflow: "hidden",
  },
  timerFill: { height: "100%" },
  peekOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    alignItems: "center",
    zIndex: 13,
  },
  peekCards: { flexDirection: "row" },
  peekHint: {
    position: "absolute",
    top: 28,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  peekHintText: { color: prime.gold, fontWeight: "800", fontSize: 10 },
});
