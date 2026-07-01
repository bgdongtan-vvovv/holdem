import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { HandState } from "@holdem/poker-engine";
import { totalPot } from "@holdem/poker-engine";
import { theme } from "../theme";
import { PlayingCard } from "./PlayingCard";
import { TableSeat } from "./TableSeat";
import { Chip, chipColor } from "./Chip";
import type { SeatMeta } from "../game/useLocalTable";

// 좌석/베팅칩/딜러버튼 앵커 (테이블 영역 대비 %). hero = 바텀 센터.
const SEAT_POS = [
  { left: "50%", top: "90%" }, // 0 hero
  { left: "13%", top: "70%" }, // 1
  { left: "8%", top: "34%" }, // 2
  { left: "50%", top: "6%" }, // 3
  { left: "92%", top: "34%" }, // 4
  { left: "87%", top: "70%" }, // 5
] as const;

const BET_POS = [
  { left: "50%", top: "70%" },
  { left: "31%", top: "61%" },
  { left: "28%", top: "42%" },
  { left: "50%", top: "24%" },
  { left: "72%", top: "42%" },
  { left: "69%", top: "61%" },
] as const;

const DEALER_POS = [
  { left: "63%", top: "80%" },
  { left: "26%", top: "64%" },
  { left: "22%", top: "40%" },
  { left: "62%", top: "17%" },
  { left: "78%", top: "40%" },
  { left: "74%", top: "64%" },
] as const;

export function PokerTable({
  state,
  seatsMeta,
  humanSeat,
  buttonIndex,
  reveal,
}: {
  state: HandState;
  seatsMeta: SeatMeta[];
  humanSeat: number;
  buttonIndex: number;
  reveal: boolean;
}) {
  // hero 를 시각적 0번(바텀 센터)에 두고 나머지를 순서대로 배치
  const n = state.players.length;
  const order: number[] = [];
  for (let i = 0; i < n; i++) order.push((humanSeat + i) % n);
  const visualOf = new Map<number, number>();
  order.forEach((seat, vi) => visualOf.set(seat, vi));

  return (
    <View style={styles.area}>
      {/* 오벌 펠트 */}
      <View style={styles.felt}>
        <LinearGradient
          colors={[theme.feltTop, theme.felt, theme.feltBottom]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.feltInner}
        >
          {/* 센터 브랜딩 + 커뮤니티 카드 + 팟 */}
          <Text style={styles.brand}>HOLD'EM</Text>
          <Text style={styles.stakes}>
            {state.smallBlind / 100} / {state.bigBlind / 100}
          </Text>
          {state.board.length > 0 && (
            <View style={styles.board}>
              {state.board.map((c, i) => (
                <PlayingCard key={i} card={c} size="md" />
              ))}
            </View>
          )}
          {totalPot(state) > 0 && (
            <View style={styles.potPill}>
              <Chip size={16} color={theme.gold} />
              <Text style={styles.potText}>팟 {(totalPot(state) / 100).toFixed(2)}</Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* 딜러 버튼 */}
      <View style={[styles.dealer, anchor(DEALER_POS[visualOf.get(buttonIndex) ?? 0]!)]}>
        <Text style={styles.dealerText}>D</Text>
      </View>

      {/* 좌석 + 베팅칩 */}
      {state.players.map((p) => {
        const vi = visualOf.get(p.seat)!;
        const isHuman = p.seat === humanSeat;
        return (
          <React.Fragment key={p.seat}>
            {p.committed > 0 && (
              <View style={[styles.betBubble, anchor(BET_POS[vi]!)]}>
                <Chip size={16} color={chipColor(p.committed)} />
                <Text style={styles.betText}>{(p.committed / 100).toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.seat, anchor(SEAT_POS[vi]!)]}>
              <TableSeat
                player={p}
                isHuman={isHuman}
                isActive={state.actingIndex === p.seat}
                revealCards={reveal}
              />
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

// 앵커를 중심 정렬(대략)하기 위한 절대 위치 스타일
function anchor(pos: { left: string; top: string }) {
  return { left: pos.left as unknown as number, top: pos.top as unknown as number };
}

const styles = StyleSheet.create({
  area: { flex: 1, position: "relative", justifyContent: "center" },
  felt: {
    position: "absolute",
    left: "3%",
    right: "3%",
    top: "8%",
    bottom: "8%",
    borderRadius: 999,
    backgroundColor: theme.felt,
    borderWidth: 10,
    borderColor: theme.rail,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  feltInner: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    color: "rgba(255,255,255,0.18)",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 4,
  },
  stakes: { color: "rgba(255,255,255,0.5)", fontSize: 20, fontWeight: "800", marginTop: 2 },
  board: { flexDirection: "row", marginTop: 12 },
  potPill: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 6,
  },
  potChip: { width: 14, height: 14, borderRadius: 7, backgroundColor: theme.gold, borderWidth: 2, borderColor: "#fff7d6" },
  potText: { color: theme.gold, fontWeight: "800", fontSize: 14 },

  seat: {
    position: "absolute",
    width: 96,
    marginLeft: -48,
    marginTop: -55,
    alignItems: "center",
  },
  betBubble: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.chipBubble,
    borderColor: theme.chipBubbleEdge,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginLeft: -34,
    marginTop: -14,
    gap: 6,
  },
  betChip: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#2e7d32", borderWidth: 2, borderColor: "#a5d6a7" },
  betText: { color: "#0a2a14", fontWeight: "900", fontSize: 14 },

  dealer: {
    position: "absolute",
    width: 26,
    height: 26,
    marginLeft: -13,
    marginTop: -13,
    borderRadius: 13,
    backgroundColor: "#f5f5f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#c9962b",
  },
  dealerText: { color: "#1a1a1a", fontWeight: "900", fontSize: 13 },
});
