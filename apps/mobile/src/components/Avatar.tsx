import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AVATAR_BG, AVATAR_EMOJI } from "../theme";

/**
 * 좌석 아바타 (자리표시). 실제 3D 캐릭터 이미지로 교체할 자리.
 * seat 인덱스로 이모지/배경색을 안정적으로 고른다.
 */
export function Avatar({ seat, size = 64 }: { seat: number; size?: number }) {
  const emoji = AVATAR_EMOJI[seat % AVATAR_EMOJI.length];
  const bg = AVATAR_BG[seat % AVATAR_BG.length];
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={{ fontSize: size * 0.55 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    overflow: "hidden",
  },
});
