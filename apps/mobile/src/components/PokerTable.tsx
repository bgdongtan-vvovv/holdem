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
import { SHOWDOWN_FIRE_FRAMES } from "../effects/showdownFrames";
import { TableSurface } from "./TableSurface";
import { SideChromeButton, DealerBadge } from "./GameChrome";

// 참고 디자인 공간 (세로 기준). 컨테이너 가로/세로 비율(ratio = w/h)로
// 포트레이트 / 랜드스케이프를 구분해 각기 다른 레이아웃 파라미터를 쓴다.
// Decorative countries belong only to the local demo bots; remote players need metadata.
const DEMO_BOT_FLAGS = ["🇰🇷", "🇯🇵", "🇨🇦", "🇬🇧", "🇧🇷", "🇫🇷", "🇩🇪", "🇹🇭", "🇦🇺"] as const;
const DESIGN_W = 430;
const DESIGN_H = 690;
const RATIO_THRESHOLD = 0.95; // ratio >= 이 값이면 랜드스케이프

// 세로(포트레이트) 설계 기준 상수 (원본 유지)
const POT_PILL_MIN_WIDTH = 270;
const POT_PILL_MIN_HEIGHT = 82;
const POT_PILL_MARGIN_TOP = 8;
const POT_PILL_PADDING_TOP = 7;
const POT_PILL_PADDING_BOTTOM = 8;
const TABLE_LIGHT_WIDTH_RATIO = 0.76;
const TABLE_LIGHT_HEIGHT_RATIO = 0.48;
const TABLE_LIGHT_TRANSLATE_Y = -16;
const BOARD_REVEAL_DELAY_MS = 500;
const POT_CENTER_X = 0.5;
const POT_CENTER_Y = 0.43;

type TableVisualLayout = {
  scale: number;
  compact: boolean;
  seatScale: number;
  potChipSize: number;
  potPillWidth: number;
  potPillHeight: number;
  potPillPaddingTop: number;
  potPillPaddingBottom: number;
  potPillMarginTop: number;
  tableLightWidthRatio: number;
  tableLightHeightRatio: number;
  tableLightTranslateY: number;
  boardSpacing: number;
  boardWidth: number;
  boardHeight: number;
  boardTopRatio: number;
  boardOffsetX: number;
  boardOffsetY: number;
  boardCardSize: "md" | "lg";
};

type AnchorPos = { left: string; top: string };
type DealOffset = { x: number; y: number };

// 좌석/베팅칩/딜러버튼 앵커 (테이블 영역 대비 %). hero = 바텀 센터.
const SEAT_POS_6: readonly AnchorPos[] = [
  { left: "50%", top: "80%" }, // 0 hero
  { left: "15%", top: "69%" }, // 1 lower-left
  { left: "15%", top: "38%" }, // 2 upper-left
  { left: "50%", top: "21%" }, // 3 top
  { left: "85%", top: "38%" }, // 4 upper-right
  { left: "85%", top: "69%" }, // 5 lower-right
] as const;

const SEAT_POS_9: readonly AnchorPos[] = [
  { left: "50%", top: "80%" }, // 0 hero
  { left: "15%", top: "74%" },
  { left: "15%", top: "53%" },
  { left: "15%", top: "35%" },
  { left: "28%", top: "21%" },
  { left: "72%", top: "21%" },
  { left: "85%", top: "35%" },
  { left: "85%", top: "53%" },
  { left: "85%", top: "74%" },
] as const;

const BET_POS_6: readonly AnchorPos[] = [
  { left: "50%", top: "67%" },
  { left: "31%", top: "67%" },
  { left: "28%", top: "40%" },
  { left: "50%", top: "25%" },
  { left: "72%", top: "40%" },
  { left: "69%", top: "67%" },
] as const;

const BET_POS_9: readonly AnchorPos[] = [
  { left: "59%", top: "72%" },
  { left: "27%", top: "72%" },
  { left: "28%", top: "53%" },
  { left: "28%", top: "38%" },
  { left: "38%", top: "25%" },
  { left: "62%", top: "25%" },
  { left: "72%", top: "38%" },
  { left: "72%", top: "56%" },
  { left: "73%", top: "72%" },
] as const;

const DEALER_POS_6: readonly AnchorPos[] = [
  { left: "64%", top: "72%" },
  { left: "25%", top: "66%" },
  { left: "23%", top: "36%" },
  { left: "63%", top: "19%" },
  { left: "77%", top: "36%" },
  { left: "75%", top: "66%" },
] as const;

const DEALER_POS_9: readonly AnchorPos[] = [
  { left: "67%", top: "88%" },
  { left: "22%", top: "74%" },
  { left: "20%", top: "54%" },
  { left: "20%", top: "35%" },
  { left: "35%", top: "17%" },
  { left: "65%", top: "17%" },
  { left: "80%", top: "35%" },
  { left: "80%", top: "57%" },
  { left: "78%", top: "74%" },
] as const;

const DEAL_FROM_6: readonly DealOffset[] = [
  { x: 0, y: -220 },
  { x: 180, y: -100 },
  { x: 220, y: 90 },
  { x: 0, y: 190 },
  { x: -220, y: 90 },
  { x: -180, y: -100 },
] as const;

const DEAL_FROM_9: readonly DealOffset[] = [
  { x: 0, y: -230 },
  { x: 150, y: -160 },
  { x: 215, y: -50 },
  { x: 210, y: 80 },
  { x: 85, y: 185 },
  { x: -85, y: 185 },
  { x: -210, y: 80 },
  { x: -215, y: -50 },
  { x: -150, y: -160 },
] as const;

export function PokerTable({
  state,
  seatsMeta,
  humanSeat,
  buttonIndex,
  reveal,
  showdownEffectActive,
  playerAvatarIndex,
  humanCardsOpened,
  onOpenHumanCards,
}: {
  state: HandState;
  seatsMeta: (SeatMeta & { countryFlag?: string; rank?: number })[];
  humanSeat: number;
  buttonIndex: number;
  reveal: boolean;
  showdownEffectActive?: boolean;
  playerAvatarIndex: number;
  humanCardsOpened?: boolean;
  onOpenHumanCards?: () => void;
}) {
  const [tableSize, setTableSize] = useState({ width: 0, height: 0 });
  const layout = React.useMemo(() => makeTableLayout(tableSize), [tableSize]);
  const [displayPot, setDisplayPot] = useState(0);
  const [potStacks, setPotStacks] = useState<ChipStackVisual[]>([]);
  const [betFlights, setBetFlights] = useState<
    {
      id: number;
      amount: number;
      visualSeat: number;
      previousStacks: ChipStackVisual[];
      targetStacks: ChipStackVisual[];
    }[]
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
  const seatScale = n > 6 ? layout.seatScale * 0.9 : layout.seatScale;

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

    const startingPotStacks = potStacksRef.current;
    let runningPotStacks = startingPotStacks;
    const flights = incoming.map((flight) => {
      const previousStacks = runningPotStacks;
      const targetStacks = appendChipDelta(previousStacks, flight.amount);
      runningPotStacks = targetStacks;
      return {
        ...flight,
        previousStacks,
        targetStacks,
      };
    });
    const nextPotStacks = runningPotStacks;

    setBetFlights((existing) => [...existing, ...flights]);
    const ids = new Set(incoming.map((flight) => flight.id));
    setTimeout(() => {
      setDisplayPot(currentPot);
      potStacksRef.current = nextPotStacks;
      setPotStacks(nextPotStacks);
    }, 520);
    setTimeout(
      () => setBetFlights((existing) => existing.filter((flight) => !ids.has(flight.id))),
      600,
    );
  }, [state, currentPot]);

  return (
    <View
      style={styles.area}
      onLayout={(event: LayoutChangeEvent) => setTableSize(event.nativeEvent.layout)}
    >
      <TableSurface
        lightWidth={layout.tableLightWidthRatio * 100}
        lightHeight={layout.tableLightHeightRatio * 100}
        lightTranslateY={layout.tableLightTranslateY}
        shadowOpacity={0.9}
        borderRadius={24}
        scale={1.02}
      >
        {/* 센터 팟 + 커뮤니티 카드 */}
        {displayPot > 0 && state.street !== "complete" && (
          <View
            style={[
              styles.potPill,
              {
                minWidth: layout.potPillWidth,
                minHeight: layout.potPillHeight,
                paddingTop: layout.potPillPaddingTop,
                paddingBottom: layout.potPillPaddingBottom,
                marginTop: layout.potPillMarginTop,
              },
            ]}
          >
            <ChipPile amount={displayPot} chipSize={layout.potChipSize} stacks={potStacks} />
            <Text style={[styles.potText, layout.compact && styles.potTextCompact]}>
              팟 {formatGameMoney(displayPot)}
            </Text>
          </View>
        )}
      </TableSurface>

      <View
        pointerEvents="none"
        style={[
          styles.boardLayer,
          {
            width: layout.boardWidth,
            height: layout.boardHeight + 34,
            left: tableSize.width > 0 ? (tableSize.width - layout.boardWidth) / 2 : "50%",
            top: tableSize.height > 0 ? tableSize.height * layout.boardTopRatio : "58%",
            transform: [{ translateX: layout.boardOffsetX }],
          },
        ]}
      >
        <View style={[styles.board, { width: layout.boardWidth, height: layout.boardHeight }]}>
          {state.board.map((card, i) => (
            <AnimatedAppear
              key={cardKey(card)}
              style={[
                styles.boardCard,
                {
                  left: boardStartOffset(state.board.length, layout) + i * layout.boardSpacing,
                  width: layout.boardSpacing,
                },
              ]}
              delay={BOARD_REVEAL_DELAY_MS + (i < 3 ? i : 0) * 230}
              translateX={-190 - i * 18}
              translateY={-12}
              rotateFrom="-14deg"
              duration={920}
            >
              <PlayingCard
                card={card}
                size={layout.boardCardSize}
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

      <View style={styles.sideControls} pointerEvents="none">
        <SideChromeButton glyph="♣" onPress={() => {}} />
        <SideChromeButton glyph="⚙" onPress={() => {}} />
      </View>

      {/* 딜러 버튼 — GameChrome 딜러 뱃지 */}
      <View style={[styles.dealer, anchor(positionFor(DEALER_POS_6, DEALER_POS_9, visualOf.get(buttonIndex) ?? 0, n))]}>
        <DealerBadge />
      </View>

      {/* 좌석 + 베팅칩 */}
      {state.players.map((p) => {
        const vi = visualOf.get(p.seat)!;
        const isHuman = p.seat === humanSeat;
        return (
          <React.Fragment key={p.seat}>
            <View style={[styles.seat, anchor(positionFor(SEAT_POS_6, SEAT_POS_9, vi, n)), { transform: [{ scale: seatScale }] }]}>
              <TableSeat
                player={p}
                isHuman={isHuman}
                isActive={state.actingIndex === p.seat}
                revealCards={reveal}
                isWinner={winners.has(p.seat)}
                matchedCards={p.seat === featuredSeat ? matchedCards : undefined}
                dealIndex={vi}
                playerCount={n}
                dealOffset={positionFor(DEAL_FROM_6, DEAL_FROM_9, vi, n)}
                avatarIndex={isHuman ? playerAvatarIndex : undefined}
                countryFlag={seatsMeta[p.seat]?.countryFlag ?? (seatsMeta[p.seat]?.isBot ? DEMO_BOT_FLAGS[p.seat % DEMO_BOT_FLAGS.length] : undefined)}
                rank={seatsMeta[p.seat]?.rank}
                cardsOpened={isHuman ? humanCardsOpened : undefined}
                onOpenCards={isHuman ? onOpenHumanCards : undefined}
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
            previousStacks={flight.previousStacks}
            targetStacks={flight.targetStacks}
            tableSize={tableSize}
            layout={layout}
            playerCount={n}
          />
        ))}

      {tableSize.width > 0 &&
        winnerAwards.map((award) => (
          <PotToWinner
            key={`${award.seat}-${award.amount}`}
            amount={award.amount}
            visualSeat={visualOf.get(award.seat) ?? 0}
            tableSize={tableSize}
            playerCount={n}
          />
        ))}

      {showdownEffectActive && <ShowdownBurst />}
    </View>
  );
}

export function ShowdownBurst() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 2200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View pointerEvents="none" style={styles.showdownOverlay}>
      <Animated.View
        style={[
          styles.showdownVideoWrap,
          {
            opacity: progress.interpolate({
              inputRange: [0, 0.12, 1],
              outputRange: [0, 1, 1],
            }),
            transform: [
              { translateY: -80 },
              {
                scale: progress.interpolate({
                  inputRange: [0, 0.28, 1],
                  outputRange: [0.9, 1, 1],
                }),
              },
            ],
          },
        ]}
      >
        <ShowdownFireSequence />
      </Animated.View>
    </View>
  );
}

function ShowdownFireSequence() {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    setFrameIndex(0);
    const timer = setInterval(() => {
      setFrameIndex((index) => (index + 1) % SHOWDOWN_FIRE_FRAMES.length);
    }, 90);
    return () => clearInterval(timer);
  }, []);

  return (
    <Image
      source={SHOWDOWN_FIRE_FRAMES[frameIndex]}
      resizeMode="contain"
      style={styles.showdownVideo}
    />
  );
}

function BetToPot({
  amount,
  visualSeat,
  previousStacks,
  targetStacks,
  tableSize,
  layout,
  playerCount,
}: {
  amount: number;
  visualSeat: number;
  previousStacks: ChipStackVisual[];
  targetStacks: ChipStackVisual[];
  tableSize: { width: number; height: number };
  layout: TableVisualLayout;
  playerCount: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const start = positionFor(BET_POS_6, BET_POS_9, visualSeat, playerCount);
  const startX = (Number.parseFloat(start.left) / 100) * tableSize.width;
  const startY = (Number.parseFloat(start.top) / 100) * tableSize.height;
  const flightStacks = buildChipStacks(amount);
  const visibleTargetStacks = targetStacks.slice(0, 12);
  const targetChipSize = layout.potChipSize;
  const flightChipSize = Math.max(17, targetChipSize - 1);
  const targetLayout = chipStackLayout(visibleTargetStacks, targetChipSize);
  const targetMetrics = chipPileMetrics(targetChipSize);
  const flightMetrics = chipPileMetrics(flightChipSize);
  const potOrigin = getPotPileOrigin(tableSize, targetMetrics, layout);
  const runningFlightStacks = previousStacks.map((stack) => ({ ...stack }));

  useEffect(() => {
    playSfx("chips_drop");
    Animated.timing(progress, {
      toValue: 1,
      duration: 560,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
    const chipSound = setTimeout(() => playSfx("chips_collect"), 520);
    return () => clearTimeout(chipSound);
  }, [progress]);

  return (
    <>
      {flightStacks.map((stack, index) => {
        const targetIndex = findIncomingStackIndex(runningFlightStacks, visibleTargetStacks, stack, index);
        const runningStack = runningFlightStacks[targetIndex];
        const targetStackAtIndex = visibleTargetStacks[targetIndex];
        if (targetStackAtIndex) {
          runningFlightStacks[targetIndex] = {
            ...targetStackAtIndex,
            count: Math.min(targetStackAtIndex.count, (runningStack?.count ?? 0) + stack.count),
          };
        }
        const target = targetLayout[Math.max(0, targetIndex)] ?? targetLayout[0];
        const targetStack = visibleTargetStacks[Math.max(0, targetIndex)] ?? stack;
        const flightLayout = chipStackLayout([stack], flightChipSize)[0];
        const startOffsetX = (index - (flightStacks.length - 1) / 2) * Math.max(12, flightChipSize * 0.72);
        const flightStartX = startX + startOffsetX;
        const flightLeft = flightStartX - (flightLayout?.left ?? 0);
        const targetLeft = potOrigin.x + (target?.left ?? targetMetrics.width / 2) - (flightLayout?.left ?? 0);
        const finalStackTop =
          potOrigin.y +
          targetMetrics.height -
          (target?.lift ?? 0) -
          visualStackHeight(targetChipSize, targetStack.count);
        const flightColumnTopOffset =
          flightMetrics.height -
          (flightLayout?.lift ?? 0) -
          visualStackHeight(flightChipSize, stack.count);
        const targetTop = finalStackTop - flightColumnTopOffset;

        return (
          <Animated.View
            key={`${stack.value}-${index}`}
            pointerEvents="none"
            style={[
              styles.betFlight,
              {
                left: flightLeft,
                top: startY - 30,
                opacity: progress.interpolate({
                  inputRange: [0, 0.72, 1],
                  outputRange: [1, 1, 0],
                }),
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 0.72, 1],
                      outputRange: [0, targetLeft - flightLeft, targetLeft - flightLeft],
                    }),
                  },
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 0.72, 0.9, 1],
                      outputRange: [0, targetTop - startY - 32, targetTop - startY - 8, targetTop - startY],
                    }),
                  },
                  { scale: progress.interpolate({ inputRange: [0, 0.72, 1], outputRange: [0.82, 0.88, 0.88] }) },
                ],
              },
            ]}
          >
            <ChipPile amount={amount} chipSize={flightChipSize} stacks={[stack]} />
          </Animated.View>
        );
      })}
    </>
  );
}

function findIncomingStackIndex(
  runningStacks: ChipStackVisual[],
  targetStacks: ChipStackVisual[],
  incomingStack: ChipStackVisual,
  fallbackIndex: number,
): number {
  for (let i = 0; i < targetStacks.length; i += 1) {
    const target = targetStacks[i];
    if (!target || target.value !== incomingStack.value) continue;

    const before = runningStacks[i]?.count ?? 0;
    if (target.count > before) return i;
  }

  for (let i = 0; i < targetStacks.length; i += 1) {
    const before = runningStacks[i]?.count ?? 0;
    const after = targetStacks[i]?.count ?? 0;
    if (after > before) return i;
  }

  return Math.min(Math.max(0, fallbackIndex), Math.max(0, targetStacks.length - 1));
}

function visualStackHeight(size: number, count: number): number {
  const chipHeight = size * 1.26;
  const step = Math.max(3, size * 0.13);
  const visibleCount = Math.max(1, Math.min(20, count));
  return chipHeight + (visibleCount - 1) * step;
}

function getPotPileOrigin(
  tableSize: { width: number; height: number },
  metrics: { width: number; height: number },
  layout: TableVisualLayout,
) {
  const lightTop =
    (tableSize.height - tableSize.height * layout.tableLightHeightRatio) / 2 +
    layout.tableLightTranslateY;
  const lightCenterY = lightTop + (tableSize.height * layout.tableLightHeightRatio) / 2;
  const potTop = lightCenterY - layout.potPillHeight / 2;
  const potLeft = (tableSize.width - layout.potPillWidth) / 2;

  return {
    x: potLeft + (layout.potPillWidth - metrics.width) / 2,
    y:
      potTop +
      layout.potPillPaddingTop +
      (layout.potPillHeight - layout.potPillPaddingTop - layout.potPillPaddingBottom - metrics.height - 16) / 2,
  };
}

function PotToWinner({
  amount,
  visualSeat,
  tableSize,
  playerCount,
}: {
  amount: number;
  visualSeat: number;
  tableSize: { width: number; height: number };
  playerCount: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const target = positionFor(SEAT_POS_6, SEAT_POS_9, visualSeat, playerCount);
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

function positionFor<T>(sixSeatPositions: readonly T[], nineSeatPositions: readonly T[], visualIndex: number, playerCount: number): T {
  const positions = playerCount > 6 ? nineSeatPositions : sixSeatPositions;
  return positions[Math.min(Math.max(0, visualIndex), positions.length - 1)] ?? positions[0]!;
}

function makeTableLayout(tableSize: { width: number; height: number }): TableVisualLayout {
  const w = tableSize.width;
  const h = tableSize.height;
  const ratio = w > 0 && h > 0 ? w / h : 1;

  // 방향 판별: ratio >= 임계값이면 랜드스케이프. 임계값은 1보다 약간 작게 잡아
  // 정사각형에 가까운 케이스(예: 430×460)도 포트레이트로 처리한다.
  const isLandscape = ratio >= RATIO_THRESHOLD && w > h;
  const tighter = isLandscape; // 랜드스케이프는 가용 가로가 넓어도 세로가 짧음

  // 기준 차원 선택: 포트레이트는 높이.constraint, 랜드스케이프는 너비.constraint
  const primary = tighter ? w : h;
  const secondary = tighter ? h : w;
  const primaryDesign = tighter ? DESIGN_W : DESIGN_H;
  const secondaryDesign = tighter ? DESIGN_H : DESIGN_W;

  const primaryScale = primary > 0 ? primary / primaryDesign : 1;
  const secondaryScale = secondary > 0 ? secondary / secondaryDesign : 1;
  // 스케일: 기본은 primary 기준. 세로가 너무 짧아 내용물이 깨질 때만 secondary로 제한.
  let scale = Math.max(0.62, primaryScale);
  const wouldOverflowSecondary = primaryScale * secondaryDesign > secondary && secondary > 0;
  if (wouldOverflowSecondary) {
    scale = Math.min(scale, secondary / secondaryDesign);
  }
  scale = Math.min(1, scale);
  const compact = scale < 0.92;

  // ── 테이블 조명(라이트) 영역 비율 ──────────────────────────────
  // 포트레이트: 기본 0.76 × 0.48 (높이 방향 여유 확보)
  // 랜드스케이프: 가로로 더 넓고 세로로 더 짧은 광학 중심 영역
  const tlWidthRatio = isLandscape
    ? compact ? 0.88 : 0.92
    : compact ? 0.7 : TABLE_LIGHT_WIDTH_RATIO;
  const tlHeightRatio = isLandscape
    ? compact ? 0.34 : 0.39
    : compact ? 0.41 : TABLE_LIGHT_HEIGHT_RATIO;
  const tlTranslateY = isLandscape
    ? compact ? -22 : -10
    : compact ? -30 : TABLE_LIGHT_TRANSLATE_Y;

  // ── 팟 필(pill) 크기 ───────────────────────────────────────────
  const basePillW = isLandscape
    ? compact ? 250 : 320
    : compact ? 230 : POT_PILL_MIN_WIDTH;
  const basePillH = isLandscape
    ? compact ? 62 : 74
    : compact ? 70 : POT_PILL_MIN_HEIGHT;

  return {
    scale,
    compact,
    seatScale: compact ? Math.max(0.72, scale * 0.95) : 1,
    potChipSize: compact ? Math.round(22 * scale) : 25,
    potPillWidth: Math.round(basePillW * (compact ? scale : 1)),
    potPillHeight: Math.round(basePillH * (compact ? scale : 1)),
    potPillPaddingTop: compact ? 5 : POT_PILL_PADDING_TOP,
    potPillPaddingBottom: compact ? 6 : POT_PILL_PADDING_BOTTOM,
    potPillMarginTop: compact ? 4 : POT_PILL_MARGIN_TOP,
    tableLightWidthRatio: tlWidthRatio,
    tableLightHeightRatio: tlHeightRatio,
    tableLightTranslateY: tlTranslateY,
    boardSpacing: compact ? 48 : 66,
    boardWidth: compact ? 244 : 330,
    boardHeight: compact ? 74 : 100,
    boardTopRatio: isLandscape
      ? compact ? 0.51 : 0.54
      : compact ? 0.57 : 0.58,
    boardOffsetX: 0,
    boardOffsetY: isLandscape
      ? compact ? 36 : 52
      : compact ? 58 : 82,
    boardCardSize: compact ? "md" : "lg",
  };
}

function boardStartOffset(cardCount: number, layout: TableVisualLayout): number {
  return 0;
}

const styles = StyleSheet.create({
  area: {
    flex: 1, position: "relative", justifyContent: "center", marginBottom: 128,
    backgroundColor: "#20130d",
  },
  brand: {
    color: "rgba(221,185,98,0.22)",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 4,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 4,
  },
  brandCompact: {
    fontSize: 21,
    letterSpacing: 3,
  },
  stakes: { color: "rgba(255,255,255,0.5)", fontSize: 20, fontWeight: "800", marginTop: 2 },
  stakesCompact: { fontSize: 16, marginTop: 0 },
  boardLayer: {
    position: "absolute",
    alignItems: "center",
    zIndex: 9,
    elevation: 9,
  },
  board: { position: "relative", width: 330, height: 100 },
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
    marginTop: POT_PILL_MARGIN_TOP,
    backgroundColor: "transparent",
    minHeight: POT_PILL_MIN_HEIGHT,
    minWidth: POT_PILL_MIN_WIDTH,
    paddingHorizontal: 18,
    paddingTop: POT_PILL_PADDING_TOP,
    paddingBottom: POT_PILL_PADDING_BOTTOM,
    borderRadius: 34,
    gap: 0,
    justifyContent: "center",
  },
  potChip: { width: 14, height: 14, borderRadius: 7, backgroundColor: theme.gold, borderWidth: 2, borderColor: "#fff7d6" },
  potText: {
    color: "#ffe6a1",
    backgroundColor: "rgba(50,25,12,0.94)",
    borderWidth: 1, borderColor: "#bb9250", borderRadius: 12, overflow: "hidden",
    paddingHorizontal: 14, paddingVertical: 3,
    fontWeight: "900",
    fontSize: 15,
    marginTop: -1,
    textShadowColor: "rgba(0,0,0,0.72)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  potTextCompact: { fontSize: 13, marginTop: -2 },

  seat: {
    position: "absolute",
    width: 112,
    marginLeft: -56,
    marginTop: -56,
    alignItems: "center",
  },
  betFlight: { position: "absolute", zIndex: 24, alignItems: "center" },
  flightAmount: {
    color: "#fff5cf", fontWeight: "900", fontSize: 13,
    backgroundColor: "rgba(5,8,14,0.82)", paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 9, overflow: "hidden", marginTop: -2,
  },
  flyingPot: { position: "absolute", zIndex: 30 },
  showdownOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  showdownVideoWrap: {
    width: "82%",
    aspectRatio: 288 / 176,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  showdownVideo: {
    width: "100%",
    height: "100%",
  },
  showdownFlare: {
    position: "absolute",
    width: 280,
    height: 112,
    borderRadius: 56,
    backgroundColor: "rgba(255,102,20,0.26)",
    shadowColor: "#ff8a1f",
    shadowOpacity: 1,
    shadowRadius: 34,
    borderWidth: 1,
    borderColor: "rgba(255,220,118,0.42)",
  },
  showdownRing: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: "rgba(255,202,76,0.85)",
    shadowColor: "#ffb320",
    shadowOpacity: 0.85,
    shadowRadius: 22,
  },
  showdownFlame: {
    position: "absolute",
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 4,
    shadowColor: "#ff5a12",
    shadowOpacity: 0.9,
    shadowRadius: 14,
  },
  showdownTextWrap: {
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(5,7,12,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,214,97,0.64)",
    shadowColor: "#f2c14e",
    shadowOpacity: 0.75,
    shadowRadius: 22,
  },
  showdownText: {
    color: "#ffd465",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 3,
    textShadowColor: "#ff5a12",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  showdownSubText: {
    color: "#fff0ba",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: -1,
  },
  sideControls: {
    position: "absolute", left: 14, bottom: 28, gap: 10, zIndex: 8,
  },
  dealer: {
    position: "absolute",
    zIndex: 10,
    width: 26,
    height: 26,
    marginLeft: -13,
    marginTop: -13,
  },
});
