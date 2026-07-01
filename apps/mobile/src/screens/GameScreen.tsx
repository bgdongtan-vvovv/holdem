import React from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { HAND_CATEGORY_NAMES } from "@holdem/poker-engine";
import { theme } from "../theme";
import { PokerTable } from "../components/PokerTable";
import { ActionBar } from "../components/ActionBar";
import { useLocalTable, type TableOptions } from "../game/useLocalTable";
import { formatGameMoney } from "../formatMoney";

const SMALL_BLIND = 10;
const BIG_BLIND = 20;

const SEATS: TableOptions["seats"] = [
  { id: "데이비드", isBot: false, stack: 3072 },
  { id: "당근쥬스", isBot: true, stack: 1587 },
  { id: "cmgykidfs", isBot: true, stack: 2400 },
  { id: "guest80652", isBot: true, stack: 760 },
  { id: "규규규승", isBot: true, stack: 1980 },
  { id: "kitiya", isBot: true, stack: 3481 },
];

export function GameScreen({ onExit }: { onExit: () => void }) {
  const table = useLocalTable({ seats: SEATS, smallBlind: SMALL_BLIND, bigBlind: BIG_BLIND });
  const { state, seatsMeta, humanSeat, buttonIndex, legal, act, nextHand, handOver } = table;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.topbar}>
        <View style={styles.topLeft}>
          <Pressable style={styles.iconBtn} onPress={onExit}>
            <Text style={styles.iconTxt}>⎋</Text>
          </Pressable>
          <Text style={styles.ping}>▮▮▮ 66ms</Text>
        </View>
        <View style={styles.topRight}>
          <Text style={styles.stakeBadge}>
            {formatGameMoney(SMALL_BLIND)} / {formatGameMoney(BIG_BLIND)}
          </Text>
          <View style={styles.moveBtn}>
            <Text style={styles.moveTxt}>테이블 이동</Text>
          </View>
        </View>
      </View>

      <PokerTable
        state={state}
        seatsMeta={seatsMeta}
        humanSeat={humanSeat}
        buttonIndex={buttonIndex}
        reveal={handOver && state.result?.wentToShowdown === true}
      />

      <View style={styles.footer}>
        {handOver ? (
          <ResultPanel state={state} onNext={nextHand} />
        ) : legal ? (
          <ActionBar state={state} legal={legal} onAction={act} />
        ) : (
          <Text style={styles.waiting}>상대가 생각 중…</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

function ResultPanel({
  state,
  onNext,
}: {
  state: ReturnType<typeof useLocalTable>["state"];
  onNext: () => void;
}) {
  const result = state.result;
  const winners = result?.awards.filter((a) => a.amount > 0) ?? [];
  const summary = winners
    .map((a) => {
      const name = state.players[a.seat]?.id ?? `seat ${a.seat}`;
      const sd = result?.showdown.find((s) => s.seat === a.seat);
      const handName = sd?.hand ? ` · ${HAND_CATEGORY_NAMES[sd.hand.category]}` : "";
      return `${name} +${formatGameMoney(a.amount)}${handName}`;
    })
    .join("   ");

  return (
    <View style={styles.resultWrap}>
      <Text style={styles.resultText}>{summary || "핸드 종료"}</Text>
      <Pressable style={styles.nextBtn} onPress={onNext}>
        <Text style={styles.nextText}>다음 핸드 ▶</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  topbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: theme.buttonBg,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.railHi,
  },
  iconTxt: { color: theme.text, fontSize: 18, fontWeight: "800" },
  ping: { color: theme.success, fontWeight: "800", fontSize: 13 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  stakeBadge: { color: theme.text, fontWeight: "900", fontSize: 15 },
  moveBtn: {
    backgroundColor: theme.buttonBg, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: theme.railHi,
  },
  moveTxt: { color: theme.text, fontWeight: "800", fontSize: 13 },
  footer: { minHeight: 120, justifyContent: "center" },
  waiting: { color: theme.textMuted, textAlign: "center", fontStyle: "italic", paddingVertical: 24 },
  resultWrap: { alignItems: "center", padding: 16, gap: 12 },
  resultText: { color: theme.text, fontSize: 15, fontWeight: "700", textAlign: "center" },
  nextBtn: { backgroundColor: theme.gold, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  nextText: { color: "#1a1a1a", fontWeight: "900", fontSize: 16 },
});
