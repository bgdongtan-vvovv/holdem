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

export function GameScreen({
  onExit,
  playerAvatarIndex,
}: {
  onExit: () => void;
  playerAvatarIndex: number;
}) {
  const seats = SEATS.map((seat, index) => ({
    ...seat,
    voice: (index === 0 ? playerAvatarIndex % 2 === 1 : index % 2 === 1)
      ? "female" as const
      : "male" as const,
  }));
  const table = useLocalTable({ seats, smallBlind: SMALL_BLIND, bigBlind: BIG_BLIND });
  const { state, seatsMeta, humanSeat, buttonIndex, legal, act, nextHand, handOver } = table;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.gameShell}>
        <View style={styles.topbar}>
          <View style={styles.topLeft}>
            <Pressable style={styles.iconBtn} onPress={onExit}>
              <Text style={styles.iconTxt}>⎋</Text>
            </Pressable>
            <View style={styles.network}>
              <Text style={styles.wifi}>◉</Text>
              <Text style={styles.ping}>66ms</Text>
            </View>
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
          playerAvatarIndex={playerAvatarIndex}
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
  root: { flex: 1, backgroundColor: "#02050b", alignItems: "center" },
  gameShell: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    backgroundColor: theme.bg,
    overflow: "hidden",
  },
  topbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 74,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: "#031728",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 13 },
  iconBtn: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: "#353636",
    alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#77705c",
    shadowColor: "#000", shadowOpacity: 0.8, shadowRadius: 5,
  },
  iconTxt: { color: theme.text, fontSize: 25, fontWeight: "900" },
  network: { alignItems: "center", justifyContent: "center" },
  wifi: { color: "#2ef28a", fontWeight: "900", fontSize: 25, lineHeight: 25 },
  ping: { color: "#fff", fontWeight: "800", fontSize: 13 },
  topRight: {
    alignItems: "center", gap: 5, backgroundColor: "rgba(52,50,52,0.96)",
    padding: 7, borderRadius: 10,
  },
  stakeBadge: { color: "#e3dfdc", fontWeight: "900", fontSize: 13 },
  moveBtn: {
    backgroundColor: "#363632", paddingHorizontal: 13, paddingVertical: 7,
    borderRadius: 5, borderWidth: 1.5, borderColor: "#7c7561",
  },
  moveTxt: { color: "#ecd58d", fontWeight: "900", fontSize: 14 },
  footer: {
    minHeight: 112, justifyContent: "center", backgroundColor: "#0a0b0e",
    borderTopWidth: 2, borderTopColor: "#363535",
  },
  waiting: { color: theme.textMuted, textAlign: "center", fontStyle: "italic", paddingVertical: 24 },
  resultWrap: { alignItems: "center", padding: 16, gap: 12 },
  resultText: { color: theme.text, fontSize: 15, fontWeight: "700", textAlign: "center" },
  nextBtn: { backgroundColor: theme.gold, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  nextText: { color: "#1a1a1a", fontWeight: "900", fontSize: 16 },
});
