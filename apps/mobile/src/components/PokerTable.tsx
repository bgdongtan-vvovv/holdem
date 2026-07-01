import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, ImageBackground, type LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Card, HandRank, HandState } from "@holdem/poker-engine";
import { compareHands, evaluateHand, HAND_CATEGORY_NAMES, totalPot } from "@holdem/poker-engine";
import { theme } from "../theme";
import { PlayingCard } from "./PlayingCard";
import { TableSeat } from "./TableSeat";
import { ChipPile } from "./Chip";
import { AnimatedAppear } from "./AnimatedAppear";
import type { SeatMeta } from "../game/useLocalTable";
import { formatGameMoney } from "../formatMoney";

// 좌석/베팅칩/딜러버튼 앵커 (테이블 영역 대비 %). hero = 바텀 센터.
const SEAT_POS = [
  { left: "50%", top: "90%" }, // 0 hero
  { left: "13%", top: "70%" }, // 1
  { left: "8%", top: "34%" }, // 2
  { left: "50%", top: "6%" }, // 3
  { left: "92%", top: "34%" }, // 4
  { left: "87%", top: "70%" }, // 5
] as const;

const BET_POS = [
  { left: "50%", top: "70%" },
  { left: "31%", top: "61%" },
  { left: "28%", top: "42%" },
  { left: "50%", top: "24%" },
  { left: "72%", top: "42%" },
  { left: "69%", top: "61%" },
] as const;

const DEALER_POS = [
  { left: "63%", top: "80%" },
  { left: "26%", top: "64%" },
  { left: "22%", top: "40%" },
  { left: "62%", top: "17%" },
  { left: "78%", top: "40%" },
  { left: "74%", top: "64%" },
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
}: {
  state: HandState;
  seatsMeta: SeatMeta[];
  humanSeat: number;
  buttonIndex: number;
  reveal: boolean;
}) {
  const [tableSize, setTableSize] = useState({ width: 0, height: 0 });
  const [displayPot, setDisplayPot] = useState(0);
  const [betFlights, setBetFlights] = useState<
    { id: number; amount: number; visualSeat: number }[]
  >([]);
  const previousCommitted = useRef<number[]>(state.players.map(() => 0));
  const previousPot = useRef(0);
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
  const human = state.players[humanSeat];
  const visibleCards = human ? [...human.holeCards, ...state.board] : state.board;
  const bestFive = visibleCards.length >= 5 ? findBestFive(visibleCards) : null;
  const matchedCards = new Set(bestFive?.cards.map(cardKey) ?? []);
  const currentPot = totalPot(state);

  useEffect(() => {
    let baseline = previousCommitted.current;
    if (currentPot < previousPot.current) {
      baseline = state.players.map(() => 0);
      setDisplayPot(0);
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

    setBetFlights((existing) => [...existing, ...incoming]);
    const ids = new Set(incoming.map((flight) => flight.id));
    setTimeout(() => setDisplayPot(currentPot), 620);
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
      <ImageBackground
        source={require("../../assets/images/poker-table-3d.png")}
        resizeMode="stretch"
        style={styles.tableImage}
        imageStyle={styles.tableImageAsset}
      >
        <LinearGradient
          colors={["rgba(1,5,14,0.35)", "rgba(8,31,70,0.02)", "rgba(1,5,14,0.42)"]}
          style={styles.tableLight}
        >
            {/* 센터 브랜딩 + 커뮤니티 카드 + 팟 */}
            <Text style={styles.brand}>HOLD'EM</Text>
            <Text style={styles.stakes}>
              {formatGameMoney(state.smallBlind)} / {formatGameMoney(state.bigBlind)}
            </Text>
            {state.board.length > 0 && (
              <View style={styles.board}>
                {state.board.map((c, i) => (
                  <AnimatedAppear
                    key={`${c.rank}${c.suit}`}
                    delay={i * 230}
                    translateX={-190 - i * 18}
                    translateY={-12}
                    rotateFrom="-14deg"
                    duration={920}
                  >
                    <PlayingCard card={c} size="md" highlighted={matchedCards.has(cardKey(c))} />
                  </AnimatedAppear>
                ))}
              </View>
            )}
            {bestFive && (
              <View style={styles.handBadge}>
                <View style={styles.handBadgeDot} />
                <Text style={styles.handBadgeText}>{HAND_CATEGORY_NAMES[bestFive.rank.category]}</Text>
              </View>
            )}
            {displayPot > 0 && state.street !== "complete" && (
              <View style={styles.potPill}>
                <ChipPile amount={displayPot} chipSize={25} />
                <Text style={styles.potText}>팟 {formatGameMoney(displayPot)}</Text>
              </View>
            )}
        </LinearGradient>
      </ImageBackground>

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
                matchedCards={isHuman ? matchedCards : undefined}
                dealIndex={vi}
                playerCount={n}
                dealOffset={DEAL_FROM[vi]!}
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
  tableSize,
}: {
  amount: number;
  visualSeat: number;
  tableSize: { width: number; height: number };
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const start = BET_POS[visualSeat]!;
  const startX = (Number.parseFloat(start.left) / 100) * tableSize.width;
  const startY = (Number.parseFloat(start.top) / 100) * tableSize.height;
  const targetX = tableSize.width / 2;
  const targetY = tableSize.height * 0.58;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 1050,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.betFlight,
        {
          left: startX - 35,
          top: startY - 30,
          opacity: progress.interpolate({
            inputRange: [0, 0.82, 1],
            outputRange: [1, 1, 0.15],
          }),
          transform: [
            { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, targetX - startX] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, targetY - startY] }) },
            { scale: progress.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0.8, 1.12, 0.65] }) },
          ],
        },
      ]}
    >
      <ChipPile amount={amount} chipSize={24} />
      <Text style={styles.flightAmount}>{formatGameMoney(amount)}</Text>
    </Animated.View>
  );
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
  const centerX = tableSize.width / 2;
  const centerY = tableSize.height / 2;

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

// 앵커를 중심 정렬(대략)하기 위한 절대 위치 스타일
function anchor(pos: { left: string; top: string }) {
  return { left: pos.left as unknown as number, top: pos.top as unknown as number };
}

const styles = StyleSheet.create({
  area: {
    flex: 1, position: "relative", justifyContent: "center",
    backgroundColor: "#030711",
  },
  tableImage: {
    position: "absolute",
    left: "-1%",
    right: "-1%",
    top: "2%",
    bottom: "2%",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.9,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  tableImageAsset: { borderRadius: 32 },
  tableLight: {
    width: "68%",
    height: "54%",
    alignItems: "center",
    justifyContent: "center",
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
  board: { flexDirection: "row", marginTop: 13, gap: 0, transform: [{ translateY: -20 }] },
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
    flexDirection: "row",
    alignItems: "center",
    marginTop: 0,
    backgroundColor: "rgba(0,0,0,0.48)",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 24,
    gap: 8,
  },
  potChip: { width: 14, height: 14, borderRadius: 7, backgroundColor: theme.gold, borderWidth: 2, borderColor: "#fff7d6" },
  potText: { color: theme.gold, fontWeight: "800", fontSize: 14 },

  seat: {
    position: "absolute",
    width: 96,
    marginLeft: -48,
    marginTop: -55,
    alignItems: "center",
  },
  betFlight: { position: "absolute", zIndex: 24, alignItems: "center" },
  flightAmount: {
    color: "#fff5cf", fontWeight: "900", fontSize: 13,
    backgroundColor: "rgba(5,8,14,0.82)", paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 9, overflow: "hidden", marginTop: -2,
  },
  flyingPot: { position: "absolute", zIndex: 30 },

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
