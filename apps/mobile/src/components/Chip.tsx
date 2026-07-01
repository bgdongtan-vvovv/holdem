import React from "react";
import { StyleSheet, View } from "react-native";

/** 포커 칩 아이콘 (테두리 대시가 있는 동심원). 색상은 금액대별로 다르게. */
export function Chip({ size = 16, color = "#2e7d32" }: { size?: number; color?: string }) {
  return (
    <View
      style={[
        styles.outer,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            width: size * 0.58,
            height: size * 0.58,
            borderRadius: (size * 0.58) / 2,
            borderColor: "rgba(255,255,255,0.85)",
          },
        ]}
      />
    </View>
  );
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
  outer: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
    borderStyle: "dashed",
  },
  inner: { borderWidth: 1.5 },
});
