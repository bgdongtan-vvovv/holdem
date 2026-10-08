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
import { cardDims, PlayingCard } from "./PlayingCard";
import { SEAT_WIDTH, seatAvatarCenterY, TableSeat } from "./TableSeat";
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
import { DealerBadge } from "./GameChrome";
import { prime, type FeltId } from "./primeTheme";

// Decorative countries belong only to the local demo bots; remote players need metadata.
const DEMO_BOT_FLAGS = ["🇰🇷", "🇯🇵", "🇨🇦", "🇬🇧", "🇧🇷", "🇫🇷", "🇩🇪", "🇹🇭", "🇦🇺"] as const;
const BOARD_REVEAL_DELAY_MS = 500;

/**
 * 세로 Prime Poker 샘플(샘플사진 KakaoTalk_20260902_173449706*.jpg) 기준 좌석 앵커.
 * 값은 테이블 영역(=게임 화면 전체) 대비 아바타 중심 좌표. hero 는 좌하단.
 */
type Point = { x: number; y: number };

const SEAT_POS_6: readonly Point[] = [
  { x: 0.2, y: 0.79 }, // 0 hero
  { x: 0.11, y: 0.62 },
  { x: 0.11, y: 0.3 },
  { x: 0.5, y: 0.13 },
  { x: 0.89, y: 0.3 },
  { x: 0.89, y: 0.62 },
];

const SEAT_POS_9: readonly Point[] = [
  { x: 0.2, y: 0.79 }, // 0 hero
  { x: 0.11, y: 0.62 },
  { x: 0.11, y: 0.36 },
  { x: 0.11, y: 0.23 },
  { x: 0.34, y: 0.13 },
  { x: 0.66, y: 0.13 },
  { x: 0.89, y: 0.23 },
  { x: 0.89, y: 0.36 },
  { x: 0.89, y: 0.62 },
];

// 테이블 중앙 요소들의 세로 위치(테이블 높이 대비).
const CENTER = {
  potLabelY: 0.4,
  boardTopY: 0.437,
  potPileY: 0.56, // 베팅칩 비행 방향 계산용 기준점(실제 팟 더미는 보드 바로 아래에 붙인다)
  infoTopY: 0.628,
  logoTop: "54%" as const,
};
const POT_CHIP_SIZE = 16;

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
  reactions,
  felt = "charcoal",
  tableLabel,
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
  /** 좌석(seat) -> 현재 떠 있는 이모지 반응. */
  reactions?: Record<number, { emoji: string; key: number }>;
  felt?: FeltId;
  /** 펠트 중앙 정보 문구 첫 줄(예: "Ring Game · NL Hold'em"). */
  tableLabel?: string;
}) {
  const [tableSize, setTableSize] = useState({ width: 0, height: 0 });
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
  // hero 를 시각적 0번(좌하단)에 두고 나머지를 시계 방향으로 배치
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
  const ready = tableSize.width > 0;
  const seatScale = ready ? Math.min(1, Math.max(0.78, tableSize.width / 400)) : 1;
  // 샘플 보드카드는 테이블 폭의 ~80% 를 차지할 만큼 크다.
  const boardCardSize = ready && tableSize.width < 340 ? "md" : "lg";
  const boardDims = cardDims(boardCardSize);
  const boardSpacing = boardDims.w + 5;

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

  const potPile = chipPileMetrics(POT_CHIP_SIZE);
  // 팟 칩: 보드카드 바로 아래, 금액 알약은 그 밑. 칩 더미는 박스 하단에서 최대 ~2.7칩 높이 위까지
  // 쌓이므로 박스 하단을 카드 하단보다 충분히 내려 칩 윗면이 카드와 겹치지 않게 한다.
  const boardBottom = tableSize.height * CENTER.boardTopY + boardDims.h + 4;
  const center: Point = { x: tableSize.width / 2, y: boardBottom + 52 - potPile.height / 2 };
  const blindLine = `Blinds ${formatGameMoney(state.smallBlind)} | ${formatGameMoney(state.bigBlind)}`;
  const activeCount = state.players.filter((p) => p.status !== "out").length;
  // 서버는 상대 홀카드를 보내지 않는다 → 핸드 진행 중인 상대에게는 뒷면 카드만 그린다.
  const handLive = state.street !== "complete" && state.players.some((p) => p.holeCards.length > 0 || p.totalCommitted > 0);

  return (
    <View
      style={styles.area}
      onLayout={(event: LayoutChangeEvent) => setTableSize(event.nativeEvent.layout)}
    >
      <TableSurface felt={felt} logoTop={CENTER.logoTop} />

      {ready && (
        <>
          {/* Total Pot 알약 */}
          {displayPot > 0 && (
            <View style={[styles.potLabelWrap, { top: tableSize.height * CENTER.potLabelY - 22 }]} pointerEvents="none">
              <View style={styles.potLabel}>
                <Text style={styles.potLabelTitle}>Total Pot</Text>
                <Text style={styles.potLabelAmount}>{formatGameMoney(displayPot)}</Text>
              </View>
            </View>
          )}

          {/* 커뮤니티 카드 */}
          <View
            pointerEvents="none"
            style={[
              styles.boardLayer,
              {
                width: boardSpacing * 5,
                left: (tableSize.width - boardSpacing * 5) / 2,
                top: tableSize.height * CENTER.boardTopY,
              },
            ]}
          >
            {state.board.map((card, i) => (
              <AnimatedAppear
                key={cardKey(card)}
                style={[styles.boardCard, { left: i * boardSpacing, width: boardSpacing }]}
                delay={BOARD_REVEAL_DELAY_MS + (i < 3 ? i : 0) * 230}
                translateX={-190 - i * 18}
                translateY={-12}
                rotateFrom="-14deg"
                duration={920}
              >
                <PlayingCard card={card} size={boardCardSize} highlighted={matchedCards.has(cardKey(card))} />
              </AnimatedAppear>
            ))}
          </View>

          {/* 팟 칩 더미 + 금액 */}
          {displayPot > 0 && state.street !== "complete" && (
            <View
              pointerEvents="none"
              style={[styles.potPile, { left: center.x - potPile.width / 2, top: center.y - potPile.height / 2 }]}
            >
              <ChipPile amount={displayPot} chipSize={POT_CHIP_SIZE} stacks={potStacks} />
              <Text style={styles.potAmount}>{formatGameMoney(displayPot)}</Text>
            </View>
          )}

          {showMadeHand && (
            <View style={[styles.handBadgeWrap, { top: center.y - 12 }]} pointerEvents="none">
              <View style={styles.handBadge}>
                <Text style={styles.handBadgeText}>{HAND_CATEGORY_NAMES[bestFive.rank.category]}</Text>
              </View>
            </View>
          )}

          {/* 펠트 위 정보 문구 (샘플의 토너먼트 정보 자리) */}
          <View style={[styles.info, { top: tableSize.height * CENTER.infoTopY }]} pointerEvents="none">
            <Text style={styles.infoTitle}>{tableLabel ?? "Ring Game · NL Hold'em"}</Text>
            <Text style={styles.infoLine}>{blindLine}</Text>
            <Text style={styles.infoLine}>Players {activeCount} / {n}</Text>
          </View>

          {/* 딜러 버튼 */}
          {(() => {
            const d = dealerPoint(tableSize, visualOf.get(buttonIndex) ?? 0, n);
            return (
              <View style={[styles.dealer, { left: d.x - 11, top: d.y - 11 }]} pointerEvents="none">
                <DealerBadge />
              </View>
            );
          })()}

          {/* 좌석 */}
          {state.players.map((p) => {
            const vi = visualOf.get(p.seat)!;
            const isHuman = p.seat === humanSeat;
            const pos = seatPoint(tableSize, vi, n);
            return (
              <View
                key={p.seat}
                style={[
                  styles.seat,
                  {
                    left: pos.x - SEAT_WIDTH / 2,
                    top: pos.y - seatAvatarCenterY(isHuman),
                    transform: [{ scale: seatScale }],
                    zIndex: isHuman ? 12 : 10,
                  },
                ]}
              >
                <TableSeat
                  player={p}
                  isHuman={isHuman}
                  isActive={state.actingIndex === p.seat}
                  revealCards={reveal}
                  isWinner={winners.has(p.seat)}
                  matchedCards={p.seat === featuredSeat ? matchedCards : undefined}
                  dealIndex={vi}
                  playerCount={n}
                  dealOffset={{ x: center.x - pos.x, y: tableSize.height * CENTER.boardTopY - pos.y }}
                  avatarIndex={isHuman ? playerAvatarIndex : undefined}
                  countryFlag={seatsMeta[p.seat]?.countryFlag ?? (seatsMeta[p.seat]?.isBot ? DEMO_BOT_FLAGS[p.seat % DEMO_BOT_FLAGS.length] : undefined)}
                  rank={seatsMeta[p.seat]?.rank}
                  cardsOpened={isHuman ? humanCardsOpened : undefined}
                  onOpenCards={isHuman ? onOpenHumanCards : undefined}
                  reaction={reactions?.[p.seat]}
                  inHand={handLive}
                />
              </View>
            );
          })}

          {betFlights.map((flight) => (
            <BetToPot
              key={flight.id}
              amount={flight.amount}
              start={betPoint(tableSize, flight.visualSeat, n)}
              previousStacks={flight.previousStacks}
              targetStacks={flight.targetStacks}
              potOrigin={{ x: center.x - potPile.width / 2, y: center.y - potPile.height / 2 }}
            />
          ))}

          {winnerAwards.map((award) => (
            <PotToWinner
              key={`${award.seat}-${award.amount}`}
              amount={award.amount}
              from={center}
              to={seatPoint(tableSize, visualOf.get(award.seat) ?? 0, n)}
            />
          ))}
        </>
      )}

      {showdownEffectActive && <ShowdownBurst />}
    </View>
  );
}

// 인원이 적을 때 빈자리 없이 대칭으로 보이도록 고르는 앵커 인덱스(헤즈업은 상대가 정면 위).
const SEAT_PICK: Record<number, readonly number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 2, 3, 4],
  5: [0, 1, 2, 4, 5],
  7: [0, 1, 3, 4, 5, 6, 8],
  8: [0, 1, 3, 4, 5, 6, 7, 8],
};

function seatPoint(size: { width: number; height: number }, visualIndex: number, playerCount: number): Point {
  const positions = playerCount > 6 ? SEAT_POS_9 : SEAT_POS_6;
  const pick = SEAT_PICK[playerCount];
  const index = pick ? pick[Math.min(Math.max(0, visualIndex), pick.length - 1)]! : visualIndex;
  const p = positions[Math.min(Math.max(0, index), positions.length - 1)] ?? positions[0]!;
  return { x: p.x * size.width, y: p.y * size.height };
}

/** 좌석에서 테이블 중앙 쪽으로 일정 거리만큼 들어간 지점. */
function towardCenter(size: { width: number; height: number }, from: Point, distance: number): Point {
  const cx = size.width / 2;
  const cy = size.height * CENTER.potPileY;
  const dx = cx - from.x;
  const dy = cy - from.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  return { x: from.x + (dx / len) * distance, y: from.y + (dy / len) * distance };
}

function betPoint(size: { width: number; height: number }, visualIndex: number, playerCount: number): Point {
  return towardCenter(size, seatPoint(size, visualIndex, playerCount), 78);
}

function dealerPoint(size: { width: number; height: number }, visualIndex: number, playerCount: number): Point {
  const seat = seatPoint(size, visualIndex, playerCount);
  const p = towardCenter(size, seat, 56);
  // 좌석 정면보다 살짝 위로 올려 이름판과 겹치지 않게 한다.
  return { x: p.x, y: p.y - 18 };
}

function BetToPot({
  amount,
  start,
  previousStacks,
  targetStacks,
  potOrigin,
}: {
  amount: number;
  start: Point;
  previousStacks: ChipStackVisual[];
  targetStacks: ChipStackVisual[];
  potOrigin: Point;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const startX = start.x;
  const startY = start.y;
  const flightStacks = buildChipStacks(amount);
  const visibleTargetStacks = targetStacks.slice(0, 12);
  const targetChipSize = POT_CHIP_SIZE;
  const flightChipSize = POT_CHIP_SIZE;
  const targetLayout = chipStackLayout(visibleTargetStacks, targetChipSize);
  const targetMetrics = chipPileMetrics(targetChipSize);
  const flightMetrics = chipPileMetrics(flightChipSize);
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
        const startOffsetX = (index - (flightStacks.length - 1) / 2) * Math.max(10, flightChipSize * 0.72);
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
                      outputRange: [0, targetTop - startY - 2, targetTop - startY + 22, targetTop - startY + 30],
                    }),
                  },
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

function PotToWinner({ amount, from, to }: { amount: number; from: Point; to: Point }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      delay: 350,
      duration: 1250,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const pile = chipPileMetrics(24);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.flyingPot,
        {
          left: from.x - pile.width / 2,
          top: from.y - pile.height / 2,
          opacity: progress.interpolate({ inputRange: [0, 0.82, 1], outputRange: [1, 1, 0] }),
          transform: [
            { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, to.x - from.x] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, to.y - from.y] }) },
            { scale: progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.7, 1.05, 0.5] }) },
          ],
        },
      ]}
    >
      <ChipPile amount={amount} chipSize={24} />
    </Animated.View>
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

const styles = StyleSheet.create({
  area: { ...StyleSheet.absoluteFillObject, backgroundColor: "#140d09" },
  potLabelWrap: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 8 },
  potLabel: {
    minWidth: 104,
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderRadius: 14,
    backgroundColor: "rgba(10,10,10,0.62)",
    alignItems: "center",
  },
  potLabelTitle: { color: "#f2f2f2", fontWeight: "700", fontSize: 13, lineHeight: 16 },
  potLabelAmount: { color: prime.gold, fontWeight: "800", fontSize: 15, lineHeight: 18 },
  boardLayer: { position: "absolute", height: 96, zIndex: 9 },
  boardCard: { position: "absolute", top: 0, alignItems: "center" },
  potPile: { position: "absolute", alignItems: "center", zIndex: 7 },
  potAmount: {
    marginTop: -2,
    color: "#f1f1f1",
    fontWeight: "700",
    fontSize: 13,
    backgroundColor: "rgba(10,10,10,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  handBadgeWrap: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 9 },
  handBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "rgba(10,10,10,0.75)",
    borderWidth: 1,
    borderColor: "rgba(242,193,78,0.6)",
  },
  handBadgeText: { color: prime.gold, fontSize: 12, fontWeight: "800", letterSpacing: 0.4 },
  info: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 2 },
  infoTitle: { color: "rgba(200,200,200,0.72)", fontSize: 13, fontWeight: "600", lineHeight: 17 },
  infoLine: { color: "rgba(185,185,185,0.62)", fontSize: 12, lineHeight: 16 },
  seat: { position: "absolute", width: SEAT_WIDTH, alignItems: "center" },
  dealer: { position: "absolute", zIndex: 11 },
  betFlight: { position: "absolute", zIndex: 24, alignItems: "center" },
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
});
