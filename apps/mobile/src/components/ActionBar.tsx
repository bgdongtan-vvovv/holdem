import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Action, HandState, LegalActions } from "@holdem/poker-engine";
import { totalPot } from "@holdem/poker-engine";
import { formatGameMoney } from "../formatMoney";
import { playSfx } from "../sound/sfx";
import { prime } from "./primeTheme";

type Preset = { tag: string; to: number };
type PreAction = "checkFold" | "call" | null;

/**
 * Prime Poker 세로 액션 영역.
 * - 내 차례: 하단 [Fold][Call/Check][최소 레이즈] + 우측에 쌓인 레이즈 프리셋(3BB/4BB/Pot…). 프리셋은 한 번 탭으로 바로 레이즈.
 * - 남의 차례: 샘플의 체크박스형 선행 액션([✓ Check/Fold] [Call N]). 내 차례가 오면 선택한 액션을 한 번 실행한다.
 */
export function ActionBar({
  state,
  legal,
  onAction,
  disabled = false,
}: {
  state: HandState;
  legal: LegalActions;
  onAction: (a: Action) => void;
  disabled?: boolean;
}) {
  const [preAction, setPreAction] = useState<PreAction>(null);
  const hero = state.players[legal.seat];
  const owed = Math.max(0, state.currentBet - (hero?.committed ?? 0));
  const preCallAmount = useRef(owed);

  // 스트리트가 바뀌면 선행 액션은 초기화된다.
  useEffect(() => {
    setPreAction(null);
  }, [state.street, state.board.length]);

  // 콜 금액이 바뀌면(누가 레이즈) "Call" 예약은 취소 — 샘플 동작과 동일.
  useEffect(() => {
    if (preAction === "call" && owed !== preCallAmount.current) setPreAction(null);
  }, [owed, preAction]);

  // 내 차례가 오면 예약된 선행 액션을 실행.
  useEffect(() => {
    if (disabled || !preAction) return;
    const choice = preAction;
    setPreAction(null);
    if (choice === "checkFold") {
      onAction(legal.canCheck ? { type: "check" } : { type: "fold" });
    } else if (choice === "call") {
      onAction(legal.canCheck ? { type: "check" } : { type: "call" });
    }
  }, [disabled, preAction, legal.canCheck, onAction]);

  const fmt = formatGameMoney;
  const act = (a: Action) => {
    playSfx("ui_click");
    onAction(a);
  };

  if (disabled) {
    const hasLiveHand = hero && hero.status === "active" && hero.holeCards.length > 0;
    if (!hasLiveHand) return <View style={styles.wrap} />;
    return (
      <View style={styles.wrap}>
        <View style={styles.row}>
          <View style={styles.flexSpacerSm} />
          <PreActionTile
            label={owed > 0 ? "Fold" : "Check/Fold"}
            checked={preAction === "checkFold"}
            onPress={() => setPreAction((v) => (v === "checkFold" ? null : "checkFold"))}
          />
          <PreActionTile
            label={owed > 0 ? `Call ${fmt(owed)}` : "Check"}
            checked={preAction === "call"}
            onPress={() => {
              preCallAmount.current = owed;
              setPreAction((v) => (v === "call" ? null : "call"));
            }}
          />
        </View>
      </View>
    );
  }

  const presets = buildPresets(state, legal);
  const [primary, ...stacked] = presets;
  const raiseVerb = state.currentBet > 0 ? "Raise" : "Bet";

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {legal.canRaise && stacked.length > 0 && (
        <View style={styles.column} pointerEvents="box-none">
          {[...stacked].reverse().map((p) => (
            <RaiseTile
              key={p.tag}
              tag={p.tag}
              verb={p.to >= legal.maxRaiseTo ? "All-In" : raiseVerb}
              amount={fmt(p.to)}
              onPress={() => act({ type: "raise", to: p.to })}
            />
          ))}
        </View>
      )}

      <View style={styles.row}>
        <Pressable testID="action-fold" style={styles.tile} onPress={() => act({ type: "fold" })}>
          <Text style={styles.tileLabel}>Fold</Text>
        </Pressable>

        {legal.canCheck ? (
          <Pressable testID="action-check" style={styles.tile} onPress={() => act({ type: "check" })}>
            <Text style={styles.tileLabel}>Check</Text>
          </Pressable>
        ) : (
          <Pressable testID="action-call" style={styles.tile} onPress={() => act({ type: "call" })}>
            <Text style={styles.tileLabelSm}>{legal.callAmount >= (hero?.stack ?? Infinity) ? "All-In" : "Call"}</Text>
            <Text style={styles.tileAmount}>{fmt(legal.callAmount)}</Text>
          </Pressable>
        )}

        {legal.canRaise && primary ? (
          <RaiseTile
            tag={primary.tag}
            verb={primary.to >= legal.maxRaiseTo ? "All-In" : raiseVerb}
            amount={fmt(primary.to)}
            onPress={() => act({ type: "raise", to: primary.to })}
            inRow
          />
        ) : (
          <View style={[styles.tile, styles.tileGhost]} />
        )}
      </View>
    </View>
  );
}

function RaiseTile({
  tag,
  verb,
  amount,
  onPress,
  inRow = false,
}: {
  tag: string;
  verb: string;
  amount: string;
  onPress: () => void;
  inRow?: boolean;
}) {
  return (
    <Pressable style={[styles.tile, inRow ? null : styles.columnTile]} onPress={onPress}>
      <View style={styles.raiseHead}>
        <Text style={styles.raiseTag}>{tag}</Text>
        <Text style={styles.raiseVerb}>{verb}</Text>
      </View>
      <Text style={styles.tileAmount}>{amount}</Text>
    </Pressable>
  );
}

function PreActionTile({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.tile, styles.preTile]}
      onPress={() => {
        playSfx("ui_click");
        onPress();
      }}
    >
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
      <Text style={[styles.preLabel, checked && styles.preLabelOn]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** 프리플랍은 2/3/4BB + Pot, 이후 스트리트는 Min/½/¾/Pot. 첫 항목이 하단 줄, 나머지는 우측 스택. */
function buildPresets(state: HandState, legal: LegalActions): Preset[] {
  const clamp = (v: number) => Math.max(legal.minRaiseTo, Math.min(legal.maxRaiseTo, Math.round(v)));
  const pot = totalPot(state);
  const potRaise = state.currentBet + legal.callAmount + pot;
  const raw: Preset[] =
    state.street === "preflop"
      ? [
          { tag: "2BB", to: state.bigBlind * 2 },
          { tag: "3BB", to: state.bigBlind * 3 },
          { tag: "4BB", to: state.bigBlind * 4 },
          { tag: "Pot", to: potRaise },
        ]
      : [
          { tag: "Min", to: legal.minRaiseTo },
          { tag: "½ Pot", to: state.currentBet + legal.callAmount + pot * 0.5 },
          { tag: "¾ Pot", to: state.currentBet + legal.callAmount + pot * 0.75 },
          { tag: "Pot", to: potRaise },
        ];
  const seen = new Set<number>();
  return raw
    .map((p) => ({ ...p, to: clamp(p.to) }))
    .filter((p) => {
      if (seen.has(p.to)) return false;
      seen.add(p.to);
      return true;
    });
}

const TILE_H = 50;

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingBottom: 10, paddingTop: 6, minHeight: TILE_H + 16 },
  column: {
    position: "absolute",
    right: 8,
    bottom: TILE_H + 16 + 6,
    width: "32%",
    gap: 6,
  },
  row: { flexDirection: "row", gap: 6 },
  flexSpacerSm: { flex: 0.6 },
  tile: {
    flex: 1,
    height: TILE_H,
    borderRadius: 8,
    backgroundColor: "rgba(28,28,30,0.96)",
    borderWidth: 1,
    borderColor: "#3a3a3d",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tileGhost: { opacity: 0 },
  columnTile: { flex: 0, alignSelf: "stretch" },
  tileLabel: { color: "#f2f2f2", fontSize: 17, fontWeight: "600" },
  tileLabelSm: { color: "#f2f2f2", fontSize: 14, fontWeight: "600", lineHeight: 17 },
  tileAmount: { color: prime.gold, fontSize: 18, fontWeight: "800", lineHeight: 22 },
  raiseHead: { flexDirection: "row", alignSelf: "stretch", justifyContent: "space-between", paddingHorizontal: 8 },
  raiseTag: { color: "#bdbdc2", fontSize: 11, fontWeight: "600" },
  raiseVerb: { color: "#f2f2f2", fontSize: 12, fontWeight: "700" },
  preTile: { flexDirection: "row", justifyContent: "flex-start", paddingHorizontal: 10, gap: 8 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: "#7c7c80",
    backgroundColor: "#1a1a1c",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: prime.gold, borderColor: prime.gold },
  checkMark: { color: "#1c1400", fontWeight: "900", fontSize: 12, lineHeight: 14 },
  preLabel: { color: "#d9d9dc", fontSize: 13, fontWeight: "600", flexShrink: 1 },
  preLabelOn: { color: prime.gold },
});
