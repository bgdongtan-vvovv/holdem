import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { feltSource, prime, type FeltId } from "./primeTheme";

/**
 * 풀블리드 테이블 배경(바 + 우드 레일 + 펠트) 위에 펠트 중앙 로고를 얹는다.
 * 배경은 샘플(세로 화면) 구도를 따라 생성한 prime-table-*.jpg. 펠트 색은 메뉴에서 바꿀 수 있다.
 */
export function TableSurface({
  felt = "charcoal",
  logoTop = "50%",
  children,
}: {
  felt?: FeltId;
  /** 로고 중심의 세로 위치(테이블 영역 대비). */
  logoTop?: `${number}%`;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.root} pointerEvents="box-none">
      <Image source={feltSource(felt)} resizeMode="cover" style={styles.background} />
      {/* 레퍼런스 사진 그대로처럼 보이지 않도록 우리 브랜드 골드 톤의 은은한 컬러그레이딩을 얹는다. */}
      <LinearGradient
        colors={["rgba(40,16,6,0.28)", "rgba(0,0,0,0)", "rgba(8,20,22,0.3)"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={[styles.logo, { top: logoTop }]} pointerEvents="none">
        <TableLogo />
      </View>
      {children}
    </View>
  );
}

/** 펠트 위 브랜드 워터마크 — 샘플 중앙 로고(골드 2단 워드마크 + 가는 라인) 구성. */
export function TableLogo({ scale = 1 }: { scale?: number }) {
  return (
    <View style={[styles.logoWrap, { transform: [{ scale }] }]}>
      <View style={styles.logoRule} />
      <Text style={styles.logoTop}>SSUN</Text>
      <Text style={styles.logoBottom}>POKER</Text>
      <View style={styles.logoRule} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, overflow: "hidden", backgroundColor: "#140d09" },
  background: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  logo: { position: "absolute", left: 0, right: 0, alignItems: "center", marginTop: -38 },
  logoWrap: { alignItems: "center", opacity: 0.5 },
  logoRule: { width: 116, height: 1.5, backgroundColor: prime.logoGold, opacity: 0.8 },
  logoTop: {
    color: prime.logoGold,
    fontSize: 31,
    lineHeight: 35,
    fontWeight: "900",
    fontFamily: "Georgia",
    letterSpacing: 3,
  },
  logoBottom: {
    color: prime.logoGold,
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "700",
    fontFamily: "Georgia",
    letterSpacing: 4,
    marginBottom: 2,
  },
});
