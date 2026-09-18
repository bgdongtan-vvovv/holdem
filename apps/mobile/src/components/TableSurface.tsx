import React from "react";
import { Image, StyleSheet, View } from "react-native";

export type TableSurfaceProps = {
  /** 테이블 배경 이미지. 기본은 승인된 원본 테이블(poker-table.png). */
  surfaceSource?: React.ComponentProps<typeof Image>["source"];
  /** 조명 원 너비(%) */
  lightWidth?: number;
  /** 조명 원 높이(%) */
  lightHeight?: number;
  /** 조명 원 수직 이동(px) */
  lightTranslateY?: number;
  /** 테이블 영역 가장자리 그림자 세기 */
  shadowOpacity?: number;
  /** 테이블 코너 반경 */
  borderRadius?: number;
  /** 서피스 배율(해상도/화면비 보정용) */
  scale?: number;
  children?: React.ReactNode;
};

export function TableSurface({
  surfaceSource,
  lightWidth = 76,
  lightHeight = 48,
  lightTranslateY = -16,
  shadowOpacity = 0.9,
  borderRadius = 24,
  scale = 1.02,
  children,
}: TableSurfaceProps) {
  return (
    <View style={styles.tableImage}>
      <Image
        source={surfaceSource ?? require("../../assets/images/poker-table.png")}
        resizeMode="stretch"
        style={[styles.tableBackground, { borderRadius, shadowOpacity, transform: [{ scale }] }]}
      />
      <View
        style={[
          styles.tableLight,
          {
            width: `${lightWidth}%`,
            height: `${lightHeight}%`,
            transform: [{ translateY: lightTranslateY }],
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tableImage: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    overflow: "hidden",
  },
  tableBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  tableLight: {
    alignItems: "center",
    justifyContent: "center",
  },
});
