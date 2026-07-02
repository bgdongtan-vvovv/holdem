import React from "react";
import { Image, StyleSheet, View } from "react-native";

export const AVATARS = [
  require("../../assets/avatars/avatar_male_01_transparent.png"),
  require("../../assets/avatars/avatar_female_01_transparent.png"),
  require("../../assets/avatars/avatar_male_02_transparent.png"),
  require("../../assets/avatars/avatar_female_02_transparent.png"),
  require("../../assets/avatars/avatar_male_03_transparent.png"),
  require("../../assets/avatars/avatar_female_03_transparent.png"),
] as const;

/**
 * 좌석별 3D 캐릭터 아바타.
 */
export function Avatar({
  seat,
  avatarIndex,
  size = 64,
}: {
  seat: number;
  avatarIndex?: number;
  size?: number;
}) {
  const source = AVATARS[(avatarIndex ?? seat) % AVATARS.length];
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size },
      ]}
    >
      <Image source={source} resizeMode="contain" style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
});
