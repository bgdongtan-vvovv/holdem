import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Card } from "@holdem/poker-engine";
import { playSfx } from "../sound/sfx";
import { FELTS, prime, type FeltId } from "./primeTheme";

const RANK_LABEL: Record<number, string> = {
  2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9",
  10: "10", 11: "J", 12: "Q", 13: "K", 14: "A",
};
const SUIT_SYMBOL: Record<string, string> = { c: "♣", d: "♦", h: "♥", s: "♠" };

/**
 * 게임 상단바 — 샘플(세로 화면)의 좌측 [카드 아이콘][내 핸드 알약][+] / 우측 [⋮] 구성.
 * 알약에는 내가 직접 연 홀카드의 수트·랭크가 표시된다(열기 전엔 비어 있음).
 */
export function GameTopBar({
  heroCards,
  onOpenMenu,
}: {
  heroCards: Card[] | null;
  onOpenMenu: () => void;
}) {
  const sorted = heroCards ? [...heroCards].sort((a, b) => b.rank - a.rank) : null;
  return (
    <View style={styles.topBar} pointerEvents="box-none">
      <View style={styles.topLeft}>
        <Pressable accessibilityLabel="핸드 기록" style={styles.squareBtn} onPress={() => playSfx("ui_click")}>
          <View style={styles.miniCardBack} />
          <View style={[styles.miniCardBack, styles.miniCardFront]} />
        </Pressable>
        <View style={styles.handPill}>
          {sorted ? (
            <>
              <Text style={styles.handPillSuits}>{sorted.map((c) => SUIT_SYMBOL[c.suit]).join("")}</Text>
              <Text style={styles.handPillRanks}>{sorted.map((c) => RANK_LABEL[c.rank]).join("")}</Text>
            </>
          ) : null}
        </View>
        <Pressable accessibilityLabel="테이블 추가" style={styles.circleBtn} onPress={() => playSfx("ui_click")}>
          <Text style={styles.circleBtnText}>+</Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="메뉴"
        testID="game-menu"
        style={styles.kebab}
        onPress={() => {
          playSfx("ui_click");
          onOpenMenu();
        }}
      >
        <Text style={styles.kebabText}>⋮</Text>
      </Pressable>
    </View>
  );
}

/**
 * 하단 옵션 시트 — 샘플의 메뉴 시트(게임 규칙/토글/Exit Table)와 "Change Felt" 팝업을 합쳤다.
 */
export function GameMenuSheet({
  felt,
  onChangeFelt,
  onExit,
  onClose,
  stakesLabel,
}: {
  felt: FeltId;
  onChangeFelt: (felt: FeltId) => void;
  onExit: () => void;
  onClose: () => void;
  stakesLabel: string;
}) {
  return (
    <View style={styles.sheetRoot}>
      <Pressable style={styles.sheetScrim} onPress={onClose} accessibilityLabel="메뉴 닫기" />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetLink}>게임 규칙</Text>
          <Text style={styles.sheetMeta}>{stakesLabel}</Text>
        </View>

        <Text style={styles.sheetLabel}>Change Felt</Text>
        <View style={styles.feltRow}>
          {FELTS.map((f) => (
            <Pressable
              key={f.id}
              accessibilityLabel={`펠트 ${f.id}`}
              style={[styles.feltSwatch, { backgroundColor: f.swatch }, felt === f.id && styles.feltSwatchOn]}
              onPress={() => {
                playSfx("ui_click");
                onChangeFelt(f.id);
              }}
            >
              {felt === f.id ? <Text style={styles.feltCheck}>✓</Text> : null}
            </Pressable>
          ))}
        </View>

        <View style={styles.sheetActions}>
          <Pressable
            testID="exit-table"
            style={styles.sheetAction}
            onPress={() => {
              playSfx("ui_back");
              onExit();
            }}
          >
            <Text style={styles.sheetActionIcon}>⇥</Text>
            <Text style={styles.sheetActionText}>Exit Table</Text>
          </Pressable>
          <Pressable style={styles.sheetAction} onPress={onClose}>
            <Text style={styles.sheetActionIcon}>✕</Text>
            <Text style={styles.sheetActionText}>닫기</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** 딜러 버튼 — 샘플의 납작한 노란 코인 + D. */
export function DealerBadge() {
  return (
    <View style={styles.dealerBadge}>
      <Text style={styles.dealerBadgeText}>D</Text>
    </View>
  );
}

/** 하단 원형 보조 버튼(샘플의 ⊞ / ⌃). */
export function RoundDockButton({
  glyph,
  onPress,
  label,
}: {
  glyph: string;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} style={styles.dockBtn} onPress={onPress}>
      <Text style={styles.dockBtnText}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    zIndex: 20,
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  squareBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: "rgba(45,45,47,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  miniCardBack: {
    position: "absolute",
    width: 11,
    height: 15,
    borderRadius: 2,
    borderWidth: 1.3,
    borderColor: "#d8d8d8",
    transform: [{ translateX: -2 }, { translateY: -1 }, { rotate: "-10deg" }],
  },
  miniCardFront: {
    backgroundColor: "rgba(45,45,47,1)",
    transform: [{ translateX: 3 }, { translateY: 1 }, { rotate: "8deg" }],
  },
  handPill: {
    width: 70,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#ededed",
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  handPillSuits: { color: "#fff", fontSize: 9, lineHeight: 10, letterSpacing: 1 },
  handPillRanks: { color: "#fff", fontSize: 12, fontWeight: "700", lineHeight: 14 },
  circleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(60,60,62,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  circleBtnText: { color: "#eaeaea", fontSize: 20, lineHeight: 22, fontWeight: "500" },
  kebab: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  kebabText: { color: "#e8e8e8", fontSize: 22, fontWeight: "900" },

  sheetRoot: { ...StyleSheet.absoluteFillObject, zIndex: 60, justifyContent: "flex-end" },
  sheetScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    backgroundColor: "#121213",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 26,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: prime.panelBorder,
  },
  grabber: { alignSelf: "center", width: 38, height: 4, borderRadius: 2, backgroundColor: "#4a4a4d", marginBottom: 12 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sheetLink: { color: "#d8d8d8", fontSize: 13, textDecorationLine: "underline" },
  sheetMeta: { color: prime.textDim, fontSize: 12 },
  sheetLabel: { color: "#e8e8e8", fontSize: 13, fontWeight: "600", marginBottom: 8 },
  feltRow: {
    flexDirection: "row",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: prime.panel,
    marginBottom: 14,
  },
  feltSwatch: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  feltSwatchOn: { borderColor: "#f0f0f0" },
  feltCheck: { color: "#fff", fontWeight: "900", fontSize: 16 },
  sheetActions: {
    flexDirection: "row",
    gap: 28,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: prime.panel,
  },
  sheetAction: { alignItems: "center", gap: 4 },
  sheetActionIcon: { color: "#e6e6e6", fontSize: 20 },
  sheetActionText: { color: "#d8d8d8", fontSize: 11 },

  dealerBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: prime.dealer,
    borderWidth: 1.5,
    borderColor: "#ffe27a",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  dealerBadgeText: { color: prime.dealerText, fontWeight: "900", fontSize: 12 },

  dockBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(32,32,34,0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  dockBtnText: { color: prime.gold, fontSize: 18, fontWeight: "900" },
});
