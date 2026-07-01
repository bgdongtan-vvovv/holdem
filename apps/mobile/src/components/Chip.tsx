import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
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

const DENOMINATIONS = [
  { value: 1000, color: "#d4a72c" },
  { value: 500, color: "#7d3c98" },
  { value: 100, color: "#2471a3" },
  { value: 25, color: "#c0392b" },
  { value: 5, color: "#25282d" },
  { value: 1, color: "#229954" },
] as const;

/** 금액을 단위별 실제 칩 개수로 분해해 쌓는다. */
export function ChipPile({
  amount,
  chipSize = 24,
}: {
  amount: number;
  chipSize?: number;
}) {
  let remaining = Math.max(0, Math.round(amount));
  const chips: { value: number; color: string }[] = [];
  for (const denomination of DENOMINATIONS) {
    const count = Math.floor(remaining / denomination.value);
    remaining %= denomination.value;
    for (let i = 0; i < count; i++) chips.push(denomination);
  }

  const columns: typeof chips[] = [];
  for (let i = 0; i < chips.length; i += 5) columns.push(chips.slice(i, i + 5));
  const overlap = chipSize * 0.2;
  const columnWidth = chipSize * 0.78;
  const maxHeight = chipSize + Math.max(0, Math.min(5, chips.length) - 1) * overlap;

  return (
    <View
      style={{
        width: Math.max(chipSize, chipSize + Math.max(0, columns.length - 1) * columnWidth),
        height: maxHeight,
      }}
    >
      {columns.map((column, columnIndex) => (
        <View
          key={columnIndex}
          style={{
            position: "absolute",
            left: columnIndex * columnWidth,
            bottom: 0,
            width: chipSize,
            height: chipSize + Math.max(0, column.length - 1) * overlap,
          }}
        >
          {column.map((chip, chipIndex) => (
            <View
              key={`${chip.value}-${chipIndex}`}
              style={{ position: "absolute", left: 0, bottom: chipIndex * overlap }}
            >
              <Chip size={chipSize} color={chip.color} />
            </View>
          ))}
        </View>
      ))}
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
});
