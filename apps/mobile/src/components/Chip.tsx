import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/** hex 색을 f(0~1)만큼 어둡게. */
function darken(hex: string, f: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - f)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - f)));
  const b = Math.max(0, Math.round((n & 255) * (1 - f)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
function lighten(hex: string, f: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) + (255 - ((n >> 16) & 255)) * f));
  const g = Math.min(255, Math.round(((n >> 8) & 255) + (255 - ((n >> 8) & 255)) * f));
  const b = Math.min(255, Math.round((n & 255) + (255 - (n & 255)) * f));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** 입체감 있는 단일 포커 칩. */
export function Chip({ size = 20, color = "#2e7d32" }: { size?: number; color?: string }) {
  const edge = darken(color, 0.35);
  const hi = lighten(color, 0.35);
  const faceHeight = size * 0.76;
  const thickness = Math.max(3, size * 0.2);
  const spot = size * 0.16;
  const spots = [
    { top: 0, left: size / 2 - spot / 2 },
    { bottom: 0, left: size / 2 - spot / 2 },
    { left: 1, top: faceHeight / 2 - spot / 2 },
    { right: 1, top: faceHeight / 2 - spot / 2 },
  ];

  return (
    <View style={{ width: size, height: faceHeight + thickness }}>
      <View style={[styles.chipShadow, { width: size * 0.9, height: thickness, left: size * 0.05, top: faceHeight }]} />
      <View
        style={[
          styles.side,
          {
            width: size, height: faceHeight, borderRadius: size / 2,
            backgroundColor: edge, top: thickness,
            borderBottomWidth: Math.max(2, thickness * 0.65),
            borderBottomColor: darken(color, 0.55),
          },
        ]}
      />
      <LinearGradient
        colors={[lighten(color, 0.58), hi, color, darken(color, 0.25)]}
        locations={[0, 0.2, 0.62, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[styles.face, { width: size, height: faceHeight, borderRadius: size / 2, borderColor: edge }]}
      >
        {spots.map((s, i) => (
          <View
            key={i}
            style={[
              styles.spot,
              { width: spot, height: spot, borderRadius: spot / 2 },
              s as object,
            ]}
          />
        ))}
        {/* 중앙 링 */}
        <View
          style={[
            styles.ring,
            {
              width: size * 0.54,
              height: faceHeight * 0.58,
              borderRadius: size,
              borderColor: lighten(color, 0.68),
            },
          ]}
        >
          <Text style={[styles.spade, { fontSize: size * 0.25 }]}>♠</Text>
        </View>
        <View style={[styles.glint, { width: size * 0.35, height: faceHeight * 0.18 }]} />
      </LinearGradient>
    </View>
  );
}

/** 여러 칩을 쌓은 스택 (금액 클수록 높게). */
export function ChipStack({
  amount,
  chipSize = 20,
}: {
  amount: number;
  chipSize?: number;
  color?: string;
}) {
  const visualSize = chipSize * 1.38;
  const count = amount >= 1200 ? 3 : amount >= 300 ? 2 : 1;
  const offset = visualSize * 0.25;
  return (
    <View style={{ width: visualSize + offset * (count - 1), height: visualSize }}>
      {Array.from({ length: count }).map((_, index) => (
        <Image
          key={index}
          source={chipStackSource(amount)}
          resizeMode="contain"
          style={{
            position: "absolute",
            left: index * offset,
            bottom: index * 2,
            width: visualSize,
            height: visualSize,
          }}
        />
      ))}
    </View>
  );
}

export const DENOMINATIONS = [
  { value: 1000, color: "#1f55a8" },
  { value: 500, color: "#7d3c98" },
  { value: 100, color: "#111111" },
  { value: 50, color: "#2e7d32" },
  { value: 20, color: "#c0392b" },
  { value: 10, color: "#f2f2f2" },
] as const;

const CHIP_IMAGE_SOURCES: Record<number, ImageSourcePropType> = {
  10: require("../../assets/images/chips/optimized/chip100.png") as ImageSourcePropType,
  20: require("../../assets/images/chips/optimized/chip200.png") as ImageSourcePropType,
  50: require("../../assets/images/chips/optimized/chip500.png") as ImageSourcePropType,
  100: require("../../assets/images/chips/optimized/chip1000.png") as ImageSourcePropType,
  500: require("../../assets/images/chips/optimized/chip10000.png") as ImageSourcePropType,
  1000: require("../../assets/images/chips/optimized/chip100000.png") as ImageSourcePropType,
};

export type ChipStackVisual = { value: number; count: number; color: string };

const MAX_CHIPS_PER_STACK = 14;

/** 금액을 단위별 실제 칩 개수로 분해해 쌓는다. */
export function ChipPile({
  amount,
  chipSize = 24,
  accumulate = false,
  stacks: providedStacks,
}: {
  amount: number;
  chipSize?: number;
  accumulate?: boolean;
  stacks?: ChipStackVisual[];
}) {
  const previousStacks = useRef<{ value: number; count: number }[]>([]);
  const previousAmount = useRef(amount);
  const [accumulatedStacks, setAccumulatedStacks] = useState<ChipStackVisual[]>(() => buildChipStacks(amount));

  useEffect(() => {
    if (!accumulate) return;
    setAccumulatedStacks((existing) => {
      if (amount <= 0) return [];
      if (amount < previousAmount.current) return buildChipStacks(amount);
      if (amount === previousAmount.current) return existing.length > 0 ? existing : buildChipStacks(amount);
      return appendChipDelta(existing, amount - previousAmount.current);
    });
    previousAmount.current = amount;
  }, [accumulate, amount]);

  const stacks = providedStacks ?? (accumulate ? accumulatedStacks : buildChipStacks(amount));
  const visibleStacks = stacks.length > 0
    ? stacks.slice(0, 12)
    : [{ value: 100, color: DENOMINATIONS[DENOMINATIONS.length - 1].color, count: 1 }];
  const layout = realisticPileLayout(visibleStacks, chipSize);
  const previousVisibleCounts = visibleStacks.map((stack, index) => {
    const previous = previousStacks.current[index];
    return previous && previous.value === stack.value ? previous.count : 0;
  });
  const { width: pileWidth, height: pileHeight } = chipPileMetrics(chipSize);

  useEffect(() => {
    previousStacks.current = visibleStacks.map((stack) => ({
      value: stack.value,
      count: stack.count,
    }));
  }, [visibleStacks]);

  return (
    <View style={{ width: pileWidth, height: pileHeight }}>
      {visibleStacks.map((stack, index) => (
        <ChipColumn
          key={`${stack.value}-${index}`}
          value={stack.value}
          count={stack.count + layout[index]!.extra}
          previousCount={previousVisibleCounts[index] > 0 ? previousVisibleCounts[index] + layout[index]!.extra : 0}
          size={chipSize}
          left={layout[index]!.left}
          lift={layout[index]!.lift}
          delay={index * 70}
          zIndex={layout[index]!.zIndex}
          animateToken={amount}
        />
      ))}
    </View>
  );
}

export function buildChipStacks(amount: number): ChipStackVisual[] {
  let remaining = Math.max(0, Math.round(amount));
  const stacks: ChipStackVisual[] = [];
  for (const denomination of DENOMINATIONS) {
    const count = Math.floor(remaining / denomination.value);
    remaining %= denomination.value;
    for (let i = 0; i < count; i += MAX_CHIPS_PER_STACK) {
      stacks.push({ value: denomination.value, color: denomination.color, count: Math.min(MAX_CHIPS_PER_STACK, count - i) });
    }
  }
  return stacks;
}

export function appendChipDelta(existing: ChipStackVisual[], delta: number): ChipStackVisual[] {
  const next = existing.map((stack) => ({ ...stack }));
  let remaining = Math.max(0, Math.round(delta));

  for (const denomination of DENOMINATIONS) {
    const count = Math.floor(remaining / denomination.value);
    remaining %= denomination.value;

    for (let i = 0; i < count; i += 1) {
      const openStackIndex = findOpenStackIndex(next, denomination.value);
      if (openStackIndex >= 0) {
        next[openStackIndex]!.count += 1;
      } else {
        next.push({ value: denomination.value, color: denomination.color, count: 1 });
      }
    }
  }

  return next;
}

function findOpenStackIndex(stacks: ChipStackVisual[], value: number): number {
  for (let i = 0; i < stacks.length; i += 1) {
    const stack = stacks[i]!;
    if (stack.value === value && stack.count < MAX_CHIPS_PER_STACK) return i;
  }
  return -1;
}

export function chipPileMetrics(size: number) {
  return {
    width: size * 9.6,
    height: size * 4.3,
  };
}

export function chipStackLayout(stacks: ChipStackVisual[], size: number) {
  return realisticPileLayout(stacks, size);
}

function realisticPileLayout(stacks: ChipStackVisual[], size: number) {
  const center = 4.08;
  const ground = 0.36;
  const slots = [
    { x: -2.25, y: 1.18, depth: 1 },
    { x: -0.75, y: 1.18, depth: 2 },
    { x: 0.75, y: 1.18, depth: 3 },
    { x: 2.25, y: 1.18, depth: 4 },
    { x: -1.5, y: 0, depth: 8 },
    { x: 0, y: 0, depth: 9 },
    { x: 1.5, y: 0, depth: 10 },
    { x: 3.0, y: 0, depth: 11 },
    { x: -3.0, y: 0, depth: 7 },
    { x: -2.25, y: 2.36, depth: 0 },
    { x: -0.75, y: 2.36, depth: 0 },
    { x: 0.75, y: 2.36, depth: 0 },
  ];

  return stacks.map((stack, index) => {
    const slot = slots[index % slots.length]!;
    const layer = Math.floor(index / slots.length);
    const x = slot.x + layer * 0.34;

    return {
      left: (center + x) * size,
      lift: Math.max(0, ground + slot.y - layer * 0.08) * size,
      zIndex: 20 + slot.depth * 4 + layer * 36 + index,
      extra: 0,
    };
  });
}

function ChipColumn({
  value,
  count,
  previousCount,
  size,
  left,
  lift,
  delay,
  zIndex,
  animateToken,
}: {
  value: number;
  count: number;
  previousCount: number;
  size: number;
  left: number;
  lift: number;
  delay: number;
  zIndex: number;
  animateToken: number;
}) {
  const drop = useRef(new Animated.Value(0)).current;
  const chipWidth = size * 1.42;
  const chipHeight = size * 1.26;
  const step = Math.max(3, size * 0.13);
  const maxVisible = Math.max(1, Math.min(MAX_CHIPS_PER_STACK, count));
  const settledCount = Math.max(0, Math.min(maxVisible, previousCount));
  const stackHeight = chipHeight + (maxVisible - 1) * step;
  const source = CHIP_IMAGE_SOURCES[value] ?? CHIP_IMAGE_SOURCES[100];

  useEffect(() => {
    if (animateToken === 0 || settledCount >= maxVisible) {
      drop.setValue(1);
      return;
    }
    drop.setValue(0);
    Animated.timing(drop, {
      toValue: 1,
      delay,
      duration: 420 + Math.max(0, maxVisible - settledCount - 1) * 95,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [animateToken, delay, drop, maxVisible, settledCount]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left,
        bottom: lift,
        zIndex,
        width: size,
        height: stackHeight,
      }}
    >
      {Array.from({ length: maxVisible }).map((_, i) => (
        <Animated.Image
          key={i}
          source={source}
          resizeMode="contain"
          style={[
            styles.realChipImage,
            {
              left: -size * 0.3,
              bottom: i * step,
              width: chipWidth,
              height: chipHeight,
              opacity: i < settledCount
                ? 1
                : chipProgress(drop, i - settledCount, maxVisible - settledCount, [0, 0.15, 1]),
              transform: [
                {
                  translateY: i < settledCount
                    ? 0
                    : chipProgress(drop, i - settledCount, maxVisible - settledCount, [-34 - (i - settledCount) * 4, -8, 0]),
                },
              ],
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

function chipProgress(
  progress: Animated.Value,
  index: number,
  total: number,
  outputRange: [number, number, number],
) {
  const count = Math.max(1, total);
  const start = Math.min(0.78, index / count);
  const mid = Math.min(0.9, start + 0.12);
  const end = Math.min(1, start + 0.32);
  return progress.interpolate({
    inputRange: [0, start, mid, end, 1],
    outputRange: [outputRange[0], outputRange[0], outputRange[1], outputRange[2], outputRange[2]],
  });
}

function MiniChip({
  color,
  size,
  bottom,
  strong,
}: {
  color: string;
  size: number;
  bottom: number;
  strong: boolean;
}) {
  const edge = darken(color, 0.38);
  const faceHeight = size * 0.52;
  const thickness = Math.max(3, size * 0.16);
  const stripeW = Math.max(3, size * 0.13);
  const isLight = color === "#ecf0f1";
  const stripeColor = isLight ? "#3f62b5" : "rgba(255,255,255,0.9)";

  return (
    <View style={{ position: "absolute", left: 0, bottom, width: size, height: faceHeight + thickness }}>
      <View
        style={[
          styles.miniChipSide,
          {
            top: faceHeight * 0.46,
            width: size,
            height: thickness + faceHeight * 0.25,
            borderRadius: size / 2,
            backgroundColor: edge,
          },
        ]}
      >
        <View style={[styles.sideStripe, { left: size * 0.14, width: stripeW, backgroundColor: stripeColor }]} />
        <View style={[styles.sideStripe, { left: size * 0.43, width: stripeW, backgroundColor: stripeColor }]} />
        <View style={[styles.sideStripe, { right: size * 0.13, width: stripeW, backgroundColor: stripeColor }]} />
      </View>
      <LinearGradient
        colors={[lighten(color, isLight ? 0.1 : 0.45), color, darken(color, isLight ? 0.12 : 0.24)]}
        start={{ x: 0.18, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[
          styles.miniChipFace,
          {
            width: size,
            height: faceHeight,
            borderRadius: size / 2,
            borderColor: edge,
            opacity: strong ? 1 : 0.96,
          },
        ]}
      >
        <View style={[styles.miniStripe, { top: -1, left: size * 0.44, width: stripeW, height: faceHeight * 0.34, backgroundColor: stripeColor }]} />
        <View style={[styles.miniStripe, { bottom: -1, left: size * 0.44, width: stripeW, height: faceHeight * 0.34, backgroundColor: stripeColor }]} />
        <View style={[styles.miniStripe, { left: -1, top: faceHeight * 0.34, width: stripeW, height: faceHeight * 0.32, backgroundColor: stripeColor }]} />
        <View style={[styles.miniStripe, { right: -1, top: faceHeight * 0.34, width: stripeW, height: faceHeight * 0.32, backgroundColor: stripeColor }]} />
        <View style={[styles.miniRing, { width: size * 0.5, height: faceHeight * 0.62, borderColor: isLight ? "#9ba7b6" : "rgba(255,255,255,0.62)" }]} />
        <View style={[styles.miniGlint, { width: size * 0.34, height: faceHeight * 0.18 }]} />
      </LinearGradient>
    </View>
  );
}

function chipStackSource(amount: number) {
  if (amount >= 500) return require("../../assets/images/chips/chip-stack-black.png");
  if (amount >= 25) return require("../../assets/images/chips/chip-stack-red.png");
  return require("../../assets/images/chips/chip-stack-green.png");
}

/** 금액대별 칩 색상. */
export function chipColor(amount: number): string {
  if (amount >= 1000) return "#f2c14e"; // gold
  if (amount >= 500) return "#8e44ad"; // purple
  if (amount >= 100) return "#2b6cb0"; // blue
  if (amount >= 25) return "#c0392b"; // red
  return "#2e7d32"; // green
}

const styles = StyleSheet.create({
  side: { position: "absolute", left: 0 },
  chipShadow: {
    position: "absolute", borderRadius: 999, backgroundColor: "rgba(0,0,0,0.48)",
    transform: [{ scaleX: 1.08 }],
  },
  face: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    overflow: "hidden",
  },
  spot: { position: "absolute", backgroundColor: "rgba(255,255,255,0.9)" },
  ring: {
    borderWidth: 1.3, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  spade: { color: "rgba(255,255,255,0.92)", fontWeight: "900" },
  glint: {
    position: "absolute", left: "18%", top: "8%", borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.32)", transform: [{ rotate: "-18deg" }],
  },
  pileGround: {
    position: "absolute",
    bottom: -1,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.34)",
    transform: [{ scaleX: 1.1 }],
  },
  realChipImage: {
    position: "absolute",
    shadowColor: "#000",
    shadowOpacity: 0.42,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  miniChipSide: {
    position: "absolute",
    left: 0,
    overflow: "hidden",
    borderWidth: 0.6,
    borderColor: "rgba(0,0,0,0.35)",
  },
  sideStripe: {
    position: "absolute",
    top: 0,
    height: "100%",
    opacity: 0.86,
  },
  miniChipFace: {
    position: "absolute",
    top: 0,
    left: 0,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 2.5,
    shadowOffset: { width: 0, height: 1 },
  },
  miniStripe: {
    position: "absolute",
    borderRadius: 2,
    opacity: 0.92,
  },
  miniRing: {
    borderWidth: 1.1,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  miniGlint: {
    position: "absolute",
    top: "13%",
    left: "18%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.36)",
    transform: [{ rotate: "-18deg" }],
  },
});
