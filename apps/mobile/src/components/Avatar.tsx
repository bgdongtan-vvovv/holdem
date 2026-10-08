import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { prime } from "./primeTheme";

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
 * Prime Poker 스타일 원형 아바타: 회색 링 + 좌하단 레벨 뱃지(와인색 사각) + 우하단 국기.
 * 뱃지/국기는 이름판 위로 살짝 걸치도록 원 밖으로 내려 배치한다.
 */
export function Avatar({
  seat,
  avatarIndex,
  size = 64,
  countryFlag,
  rank,
  showBadges = true,
}: {
  seat: number;
  avatarIndex?: number;
  size?: number;
  countryFlag?: string;
  rank?: number;
  showBadges?: boolean;
}) {
  const source = AVATARS[(avatarIndex ?? seat) % AVATARS.length];
  const badge = Math.round(Math.max(16, size * 0.27));
  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.portrait, { borderRadius: size / 2 }]}>
        <Image source={source} resizeMode="cover" style={styles.image} />
      </View>
      {showBadges && (
        <>
          <View
            accessibilityLabel={rank == null ? `좌석 ${seat + 1}` : `레벨 ${rank}`}
            style={[styles.level, { width: badge, height: badge, left: -badge * 0.35, bottom: -badge * 0.15 }]}
          >
            <Text style={[styles.levelText, { fontSize: badge * 0.58 }]}>{rank ?? seat + 1}</Text>
          </View>
          {countryFlag ? (
            <View style={[styles.flag, { right: -badge * 0.4, bottom: -badge * 0.15, height: badge }]}>
              <Text style={[styles.flagText, { fontSize: badge * 0.95, lineHeight: badge * 1.05 }]}>{countryFlag}</Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  portrait: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: "#2c2c2e",
    borderWidth: 2,
    borderColor: "#9b9b9f",
  },
  image: { width: "100%", height: "112%" },
  level: {
    position: "absolute",
    borderRadius: 3,
    backgroundColor: prime.levelBadge,
    borderWidth: 1,
    borderColor: prime.levelBadgeBorder,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  levelText: { color: "#fff", fontWeight: "800" },
  flag: {
    position: "absolute",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 3,
  },
  flagText: {},
});
