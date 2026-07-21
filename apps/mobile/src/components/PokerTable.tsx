import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, type LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import type { Card, HandRank, HandState } from "@holdem/poker-engine";
import {
  compareHands,
  evaluateHand,
  HAND_CATEGORY_NAMES,
  HandCategory,
  totalPot,
} from "@holdem/poker-engine";
import { theme } from "../theme";
import { PlayingCard } from "./PlayingCard";
import { TableSeat } from "./TableSeat";
import {
  appendChipDelta,
  buildChipStacks,
  ChipPile,
  chipPileMetrics,
  chipStackLayout,
  type ChipStackVisual,
} from "./Chip";
import { AnimatedAppear } from "./AnimatedAppear";
import type { SeatMeta } from "../game/useLocalTable";
import { formatGameMoney } from "../formatMoney";
import { playSfx } from "../sound/sfx";

const BOARD_REVEAL_DELAY_MS = 500;
const POT_CENTER_X = 0.5;
const POT_CENTER_Y = 0.43;
const POT_CHIP_CENTER_X = 0.425;
const POT_CHIP_CENTER_Y = 0.432;

// 좌석/베팅칩/딜러버튼 앵커 (테이블 영역 대비 %). hero = 바텀 센터.
const SEAT_POS = [
  { left: "50%", top: "82%" }, // 0 hero
  { left: "15%", top: "69%" }, // 1 lower-left
  { left: "15%", top: "38%" }, // 2 upper-left
  { left: "50%", top: "13%" }, // 3 top
  { left: "85%", top: "38%" }, // 4 upper-right
  { left: "85%", top: "69%" }, // 5 lower-right
] as const;

const BET_POS = [
  { left: "50%", top: "70%" },
  { left: "31%", top: "67%" },
  { left: "28%", top: "40%" },
  { left: "50%", top: "25%" },
  { left: "72%", top: "40%" },
  { left: "69%", top: "67%" },
] as const;

const DEALER_POS = [
  { left: "64%", top: "76%" },
  { left: "25%", top: "66%" },
  { left: "23%", top: "36%" },
  { left: "63%", top: "19%" },
  { left: "77%", top: "36%" },
  { left: "75%", top: "66%" },
] as const;

const DEAL_FROM = [
  { x: 0, y: -220 },
  { x: 180, y: -100 },
  { x: 220, y: 90 },
  { x: 0, y: 190 },
  { x: -220, y: 90 },
  { x: -180, y: -100 },
] as const;

export function PokerTable({
  state,
  seatsMeta,
  humanSeat,
  buttonIndex,
  reveal,
  playerAvatarIndex,
}: {
  state: HandState;
  seatsMeta: SeatMeta[];
  humanSeat: number;
  buttonIndex: number;
  reveal: boolean;
  playerAvatarIndex: number;
}) {
  const [tableSize, setTableSize] = useState({ width: 0, height: 0 });
  const [displayPot, setDisplayPot] = useState(0);
  const [potStacks, setPotStacks] = useState<ChipStackVisual[]>([]);
  const [betFlights, setBetFlights] = useState<
    { id: number; amount: number; visualSeat: number; targetStacks: ChipStackVisual[] }[]
  >([]);
  const previousCommitted = useRef<number[]>(state.players.map(() => 0));
  const previousPot = useRef(0);
  const potStacksRef = useRef<ChipStackVisual[]>([]);
  const flightId = useRef(0);
  // hero 를 시각적 0번(바텀 센터)에 두고 나머지를 순서대로 배치
  const n = state.players.length;
  const order: number[] = [];
  for (let i = 0; i < n; i++) order.push((humanSeat + i) % n);
  const visualOf = new Map<number, number>();
  order.forEach((seat, vi) => visualOf.set(seat, vi));

  // 승자 좌석 (핸드 종료 시 하이라이트용)
  const winnerAwards =
    state.street === "complete"
      ? (state.result?.awards ?? []).filter((award) => award.amount > 0)
      : [];
  const winners = new Set<number>(winnerAwards.map((award) => award.seat));
  const featuredSeat = winnerAwards[0]?.seat ?? humanSeat;
  const featuredPlayer = state.players[featuredSeat];
  const visibleCards = featuredPlayer
    ? [...featuredPlayer.holeCards, ...state.board]
    : state.board;
  const bestFive = visibleCards.length >= 5 ? findBestFive(visibleCards) : null;
  const showMadeHand =
    state.street === "complete" &&
    bestFive !== null &&
    bestFive.rank.category !== HandCategory.HighCard;
  const matchedCards = new Set(showMadeHand ? madeCards(bestFive).map(cardKey) : []);
  const currentPot = totalPot(state);

  useEffect(() => {
    let baseline = previousCommitted.current;
    if (currentPot < previousPot.current) {
      baseline = state.players.map(() => 0);
      setDisplayPot(0);
      setPotStacks([]);
      potStacksRef.current = [];
    }

    const incoming = state.players.flatMap((player) => {
      const added = player.totalCommitted - (baseline[player.seat] ?? 0);
      if (added <= 0) return [];
      return [{
        id: flightId.current++,
        amount: added,
        visualSeat: visualOf.get(player.seat) ?? 0,
      }];
    });

    previousCommitted.current = state.players.map((player) => player.totalCommitted);
    previousPot.current = currentPot;

    if (incoming.length === 0) {
      setDisplayPot(currentPot);
      return;
    }

    const nextPotStacks = incoming.reduce(
      (stacks, flight) => appendChipDelta(stacks, flight.amount),
      potStacksRef.current,
    );
    const flights = incoming.map((flight) => ({
      ...flight,
      targetStacks: nextPotStacks,
    }));

    setBetFlights((existing) => [...existing, ...flights]);
    const ids = new Set(incoming.map((flight) => flight.id));
    setTimeout(() => {
      setDisplayPot(currentPot);
      potStacksRef.current = nextPotStacks;
      setPotStacks(nextPotStacks);
    }, 620);
    setTimeout(
      () => setBetFlights((existing) => existing.filter((flight) => !ids.has(flight.id))),
      900,
    );
  }, [state, currentPot]);

  return (
    <View
      style={styles.area}
      onLayout={(event: LayoutChangeEvent) => setTableSize(event.nativeEvent.layout)}
    >
      <View style={styles.tableImage}>
        <Image
          source={require("../../assets/images/poker-table-portrait-v5.png")}
          resizeMode="stretch"
          style={styles.tableBackground}
        />
        <View style={styles.tableLight}>
            {/* 센터 브랜딩 + 커뮤니티 카드 + 팟 */}
            <Text style={styles.brand}>HOLD'EM</Text>
            <Text style={styles.stakes}>
              {formatGameMoney(state.smallBlind)} / {formatGameMoney(state.bigBlind)}
            </Text>
            {displayPot > 0 && state.street !== "complete" && (
              <View style={styles.potPill}>
                <ChipPile amount={displayPot} chipSize={25} stacks={potStacks} />
                <Text style={styles.potText}>팟 {formatGameMoney(displayPot)}</Text>
              </View>
            )}
            <View style={styles.board}>
              {state.board.map((card, i) => (
                <AnimatedAppear
                  key={cardKey(card)}
                  style={[styles.boardCard, { left: i * 66 }]}
                  delay={BOARD_REVEAL_DELAY_MS + (i < 3 ? i : 0) * 230}
                  translateX={-190 - i * 18}
                  translateY={-12}
                  rotateFrom="-14deg"
                  duration={920}
                >
                  <PlayingCard
                    card={card}
                    size="lg"
                    highlighted={matchedCards.has(cardKey(card))}
                  />
                </AnimatedAppear>
              ))}
            </View>
            {showMadeHand && (
              <View style={styles.handBadge}>
                <View style={styles.handBadgeDot} />
                <Text style={styles.handBadgeText}>{HAND_CATEGORY_NAMES[bestFive.rank.category]}</Text>
              </View>
            )}
        </View>
      </View>

      <View style={styles.sideControls} pointerEvents="none">
        <View style={styles.sideButton}><Text style={styles.sideButtonText}>♣</Text></View>
        <View style={styles.sideButton}><Text style={styles.sideButtonText}>⚙</Text></View>
      </View>

      {/* 딜러 버튼 */}
      <View style={[styles.dealer, anchor(DEALER_POS[visualOf.get(buttonIndex) ?? 0]!)]}>
        <Text style={styles.dealerText}>D</Text>
      </View>

      {/* 좌석 + 베팅칩 */}
      {state.players.map((p) => {
        const vi = visualOf.get(p.seat)!;
        const isHuman = p.seat === humanSeat;
        return (
          <React.Fragment key={p.seat}>
            <View style={[styles.seat, anchor(SEAT_POS[vi]!)]}>
              <TableSeat
                player={p}
                isHuman={isHuman}
                isActive={state.actingIndex === p.seat}
                revealCards={reveal}
                isWinner={winners.has(p.seat)}
                matchedCards={p.seat === featuredSeat ? matchedCards : undefined}
                dealIndex={vi}
                playerCount={n}
                dealOffset={DEAL_FROM[vi]!}
                avatarIndex={isHuman ? playerAvatarIndex : undefined}
              />
            </View>
          </React.Fragment>
        );
      })}

      {tableSize.width > 0 &&
        betFlights.map((flight) => (
          <BetToPot
            key={flight.id}
            amount={flight.amount}
            visualSeat={flight.visualSeat}
            targetStacks={flight.targetStacks}
            tableSize={tableSize}
          />
        ))}

      {tableSize.width > 0 &&
        winnerAwards.map((award) => (
          <PotToWinner
            key={`${award.seat}-${award.amount}`}
            amount={award.amount}
            visualSeat={visualOf.get(award.seat) ?? 0}
            tableSize={tableSize}
          />
        ))}
    </View>
  );
}

function BetToPot({
  amount,
  visualSeat,
  targetStacks,
  tableSize,
}: {
  amount: number;
  visualSeat: number;
  targetStacks: ChipStackVisual[];
  tableSize: { width: number; height: number };
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const start = BET_POS[visualSeat]!;
  const startX = (Number.parseFloat(start.left) / 100) * tableSize.width;
  const startY = (Number.parseFloat(start.top) / 100) * tableSize.height;
  const flightStacks = buildChipStacks(amount);
  const visibleTargetStacks = targetStacks.slice(0, 12);
  const targetLayout = chipStackLayout(visibleTargetStacks.length, 25);
  const targetMetrics = chipPileMetrics(25);
  const flightMetrics = chipPileMetrics(24);

  useEffect(() => {
    playSfx("chips_drop");
    Animated.timing(progress, {
      toValue: 1,
      duration: 1050,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
    const chipSound = setTimeout(() => playSfx("chips_collect"), 1000);
    return () => clearTimeout(chipSound);
  }, [progress]);

  return (
    <>
      {flightStacks.map((stack, index) => {
        const targetIndex = findTargetStackIndex(visibleTargetStacks, stack.value);
        const target = targetLayout[Math.max(0, targetIndex)] ?? targetLayout[0];
        const startOffsetX = (index - (flightStacks.length - 1) / 2) * 18;
        const flightStartX = startX + startOffsetX;
        const targetStackX = tableSize.width * POT_CHIP_CENTER_X - targetMetrics.width / 2 + (target?.left ?? targetMetrics.width / 2);
        const targetStackY = tableSize.height * POT_CHIP_CENTER_Y + 8;

        return (
          <Animated.View
            key={`${stack.value}-${index}`}
            pointerEvents="none"
            style={[
              styles.betFlight,
              {
                left: flightStartX - flightMetrics.width / 2,
                top: startY - 30,
                opacity: progress.interpolate({
                  inputRange: [0, 0.88, 1],
                  outputRange: [1, 1, 0],
                }),
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 0.72, 1],
                      outputRange: [0, targetStackX - flightStartX, targetStackX - flightStartX],
                    }),
                  },
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 0.72, 0.9, 1],
                      outputRange: [0, targetStackY - startY - 40, targetStackY - startY - 10, targetStackY - startY],
                    }),
                  },
                  { scale: progress.interpolate({ inputRange: [0, 0.72, 1], outputRange: [0.82, 0.88, 0.88] }) },
                ],
              },
            ]}
          >
            <ChipPile amount={amount} chipSize={24} stacks={[stack]} />
          </Animated.View>
        );
      })}
    </>
  );
}

function findTargetStackIndex(stacks: ChipStackVisual[], value: number): number {
  for (let i = stacks.length - 1; i >= 0; i -= 1) {
    if (stacks[i]?.value === value) return i;
  }
  return Math.max(0, stacks.length - 1);
}

function PotToWinner({
  amount,
  visualSeat,
  tableSize,
}: {
  amount: number;
  visualSeat: number;
  tableSize: { width: number; height: number };
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const target = SEAT_POS[visualSeat]!;
  const targetX = (Number.parseFloat(target.left) / 100) * tableSize.width;
  const targetY = (Number.parseFloat(target.top) / 100) * tableSize.height;
  const centerX = tableSize.width * POT_CENTER_X;
  const centerY = tableSize.height * POT_CENTER_Y;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      delay: 350,
      duration: 1250,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.flyingPot,
        {
          left: centerX - 42,
          top: centerY - 42,
          opacity: progress.interpolate({
            inputRange: [0, 0.82, 1],
            outputRange: [1, 1, 0],
          }),
          transform: [
            { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, targetX - centerX] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, targetY - centerY] }) },
            { scale: progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.7, 1.12, 0.55] }) },
            { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "18deg"] }) },
          ],
        },
      ]}
    >
      <ChipPile amount={amount} chipSize={32} />
    </Animated.View>
  );
}

function cardKey(card: Card): string {
  return `${card.rank}${card.suit}`;
}

function findBestFive(cards: Card[]): { cards: Card[]; rank: HandRank } {
  let bestCards = cards.slice(0, 5);
  let bestRank = evaluateHand(bestCards);

  for (let a = 0; a < cards.length - 4; a++) {
    for (let b = a + 1; b < cards.length - 3; b++) {
      for (let c = b + 1; c < cards.length - 2; c++) {
        for (let d = c + 1; d < cards.length - 1; d++) {
          for (let e = d + 1; e < cards.length; e++) {
            const candidate = [cards[a]!, cards[b]!, cards[c]!, cards[d]!, cards[e]!];
            const rank = evaluateHand(candidate);
            if (compareHands(rank, bestRank) > 0) {
              bestCards = candidate;
              bestRank = rank;
            }
          }
        }
      }
    }
  }
  return { cards: bestCards, rank: bestRank };
}

function madeCards(hand: { cards: Card[]; rank: HandRank }): Card[] {
  const [primary, secondary] = hand.rank.tiebreak;
  switch (hand.rank.category) {
    case HandCategory.Pair:
    case HandCategory.ThreeOfAKind:
    case HandCategory.FourOfAKind:
      return hand.cards.filter((card) => card.rank === primary);
    case HandCategory.TwoPair:
    case HandCategory.FullHouse:
      return hand.cards.filter((card) => card.rank === primary || card.rank === secondary);
    case HandCategory.Straight:
    case HandCategory.Flush:
    case HandCategory.StraightFlush:
      return hand.cards;
    default:
      return [];
  }
}

// 앵커를 중심 정렬(대략)하기 위한 절대 위치 스타일
function anchor(pos: { left: string; top: string }) {
  return { left: pos.left as unknown as number, top: pos.top as unknown as number };
}

const styles = StyleSheet.create({
  area: {
    flex: 1, position: "relative", justifyContent: "center",
    backgroundColor: "#071528",
  },
  tableImage: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.9,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    overflow: "hidden",
  },
  tableBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    borderRadius: 24,
    transform: [{ scale: 1.02 }],
  },
  tableLight: {
    width: "76%",
    height: "48%",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -16 }],
  },
  brand: {
    color: "rgba(221,185,98,0.22)",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 4,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 4,
  },
  stakes: { color: "rgba(255,255,255,0.5)", fontSize: 20, fontWeight: "800", marginTop: 2 },
  board: { position: "relative", marginTop: 6, width: 330, height: 100 },
  boardCard: { position: "absolute", top: 0, width: 66, alignItems: "center" },
  handBadge: {
    flexDirection: "row", alignItems: "center", marginTop: 8,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12,
    backgroundColor: "rgba(5,8,16,0.72)", borderWidth: 1,
    borderColor: "rgba(242,193,78,0.5)", gap: 6,
  },
  handBadgeDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: theme.gold,
    shadowColor: theme.gold, shadowOpacity: 1, shadowRadius: 4,
  },
  handBadgeText: { color: "#ffe18a", fontSize: 11, fontWeight: "900", letterSpacing: 0.6 },
  potPill: {
    flexDirection: "column",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "rgba(0,0,0,0.48)",
    minHeight: 82,
    minWidth: 270,
    paddingHorizontal: 18,
    paddingTop: 7,
    paddingBottom: 8,
    borderRadius: 34,
    gap: 0,
    justifyContent: "center",
  },
  potChip: { width: 14, height: 14, borderRadius: 7, backgroundColor: theme.gold, borderWidth: 2, borderColor: "#fff7d6" },
  potText: { color: theme.gold, fontWeight: "900", fontSize: 15, marginTop: -1 },

  seat: {
    position: "absolute",
    width: 118,
    marginLeft: -59,
    marginTop: -62,
    alignItems: "center",
  },
  betFlight: { position: "absolute", zIndex: 24, alignItems: "center" },
  flightAmount: {
    color: "#fff5cf", fontWeight: "900", fontSize: 13,
    backgroundColor: "rgba(5,8,14,0.82)", paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 9, overflow: "hidden", marginTop: -2,
  },
  flyingPot: { position: "absolute", zIndex: 30 },
  sideControls: {
    position: "absolute", left: 14, bottom: 28, gap: 10, zIndex: 8,
  },
  sideButton: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(42,38,29,0.92)", borderWidth: 2,
    borderColor: "rgba(219,184,101,0.72)",
    shadowColor: "#000", shadowOpacity: 0.7, shadowRadius: 5,
  },
  sideButtonText: { color: "#e8ddb9", fontSize: 23, fontWeight: "900" },

  dealer: {
    position: "absolute",
    width: 26,
    height: 26,
    marginLeft: -13,
    marginTop: -13,
    borderRadius: 13,
    backgroundColor: "#f5f5f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#c9962b",
  },
  dealerText: { color: "#1a1a1a", fontWeight: "900", fontSize: 13 },
});
