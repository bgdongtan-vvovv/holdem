import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export const AVATARS = [
  require("../../assets/avatars/avatar_male_01_transparent.png"),
  require("../../assets/avatars/avatar_female_01_transparent.png"),
  require("../../assets/avatars/avatar_male_02_transparent.png"),
  require("../../assets/avatars/avatar_female_02_transparent.png"),
  require("../../assets/avatars/avatar_male_03_transparent.png"),
  require("../../assets/avatars/avatar_female_03_transparent.png"),
  require("../../assets/avatars/avatar_male_04_transparent.png"),
  require("../../assets/avatars/avatar_female_04_transparent.png"),
  require("../../assets/avatars/avatar_male_05_transparent.png"),
] as const;

/**
 * 좌석별 3D 캐릭터 아바타.
 */
export function Avatar({
  seat,
  avatarIndex,
  size = 64,
  countryFlag,
  rank,
}: {
  seat: number;
  avatarIndex?: number;
  size?: number;
  countryFlag?: string;
  rank?: number;
}) {
  const source = AVATARS[(avatarIndex ?? seat) % AVATARS.length];
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size },
      ]}
    >
      <View style={[styles.portrait, { borderRadius: size / 2 }]}><Image source={source} resizeMode="cover" style={styles.image} /></View>
      {countryFlag ? <View style={styles.flag}><Text style={styles.flagText}>{countryFlag}</Text></View> : null}
      <View accessibilityLabel={rank == null ? `좌석 ${seat + 1}` : `레벨 ${rank}`} style={styles.rank}><Text style={styles.rankText}>{rank ?? seat + 1}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  portrait: { width: "100%", height: "100%", overflow: "hidden", backgroundColor: "#332c26", borderWidth: 2, borderColor: "#c9b994", shadowColor: "#000", shadowOpacity: 0.7, shadowRadius: 5 },
  image: { width: "100%", height: "115%" },
  flag: { position: "absolute", left: -5, top: 1, backgroundColor: "#f5ead4", borderRadius: 3, paddingHorizontal: 2, borderWidth: 1, borderColor: "#a88a52" },
  flagText: { fontSize: 17, lineHeight: 20 },
  rank: { position: "absolute", right: -3, bottom: 4, width: 24, height: 24, borderRadius: 5, transform: [{ rotate: "45deg" }], backgroundColor: "#175780", borderWidth: 2, borderColor: "#87c9ec", shadowColor: "#000", shadowOpacity: 0.8, shadowRadius: 3, alignItems: "center", justifyContent: "center" },
  rankText: { transform: [{ rotate: "-45deg" }], color: "#fff", fontWeight: "900", fontSize: 11 },
});
