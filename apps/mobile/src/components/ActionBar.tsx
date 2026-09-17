import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Action, HandState, LegalActions } from "@holdem/poker-engine";
import { totalPot } from "@holdem/poker-engine";
import { theme } from "../theme";
import { formatGameMoney } from "../formatMoney";
import { playSfx } from "../sound/sfx";

function GradientButton({
  colors,
  textColor = "#fff",
  label,
  subLabel,
  onPress,
  disabled = false,
}: {
  colors: readonly [string, string];
  textColor?: string;
  label: string;
  subLabel?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      style={[styles.btnWrap, disabled && styles.disabled]}
      onPress={() => {
        playSfx("ui_click");
        onPress();
      }}
    >
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.btn}>
        <Text style={[styles.btnText, { color: textColor }]}>{label}</Text>
        {subLabel && <Text style={[styles.btnSubText, { color: textColor }]}>{subLabel}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

const GRAD = {
  fold: ["#e05a4a", "#a5261a"] as const,
  call: ["#3ea877", "#1f6e4a"] as const,
  raise: ["#f6d365", "#d9a327"] as const,
};

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
  const [raiseTo, setRaiseTo] = useState<number>(legal.minRaiseTo);

  // legal 이 바뀌면 raiseTo 를 최소값으로 리셋
  const key = `${state.actingIndex}-${state.currentBet}-${state.street}`;
  const lastKey = React.useRef(key);
  if (lastKey.current !== key) {
    lastKey.current = key;
    setRaiseTo(legal.minRaiseTo);
  }

  const pot = totalPot(state);
  const presets = buildPresets(legal, pot);
  const clamp = (v: number) => Math.max(legal.minRaiseTo, Math.min(legal.maxRaiseTo, v));
  const fmt = formatGameMoney;
  const click = (action: () => void) => {
    playSfx("ui_click");
    action();
  };

  return (
    <View style={styles.wrap}>
      {legal.canRaise && (
        <View style={styles.raiseRow}>
          <Pressable
            disabled={disabled}
            style={[styles.step, disabled && styles.disabled]}
            onPress={() => click(() => setRaiseTo((v) => clamp(v - state.bigBlind)))}
          >
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <View style={styles.raiseAmt}>
            <Text style={styles.raiseAmtText}>{fmt(raiseTo)}</Text>
          </View>
          <Pressable
            disabled={disabled}
            style={[styles.step, disabled && styles.disabled]}
            onPress={() => click(() => setRaiseTo((v) => clamp(v + state.bigBlind)))}
          >
            <Text style={styles.stepText}>＋</Text>
          </Pressable>
          {presets.map((p) => (
            <Pressable
              key={p.label}
              disabled={disabled}
              style={[styles.preset, disabled && styles.disabled]}
              onPress={() => click(() => setRaiseTo(clamp(p.to)))}
            >
              <Text style={styles.presetText}>{p.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.btnRow}>
        <GradientButton disabled={disabled} colors={GRAD.fold} label="폴드" onPress={() => onAction({ type: "fold" })} />

        {legal.canCheck ? (
          <GradientButton disabled={disabled} colors={GRAD.call} label="체크" onPress={() => onAction({ type: "check" })} />
        ) : (
          <GradientButton
            disabled={disabled}
            colors={GRAD.call}
            label={`콜 ${fmt(legal.callAmount)}`}
            onPress={() => onAction({ type: "call" })}
          />
        )}

        {legal.canRaise && (
          <GradientButton
            disabled={disabled}
            colors={GRAD.raise}
            textColor="#1a1a1a"
            label={state.currentBet > 0 ? "레이즈" : "벳"}
            subLabel={`${fmt(raiseTo)}${raiseTo >= legal.maxRaiseTo ? " 올인" : ""}`}
            onPress={() => onAction({ type: "raise", to: raiseTo })}
          />
        )}
      </View>
    </View>
  );
}

function buildPresets(legal: LegalActions, pot: number) {
  const items: { label: string; to: number }[] = [];
  if (pot > 0) {
    items.push({ label: "½팟", to: Math.round(legal.callAmount + pot * 0.5) });
    items.push({ label: "팟", to: Math.round(legal.callAmount + pot) });
  }
  items.push({ label: "올인", to: legal.maxRaiseTo });
  return items;
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingBottom: 10, paddingTop: 6 },
  raiseRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 },
  step: {
    width: 38, height: 38, borderRadius: 8, backgroundColor: theme.buttonBg,
    alignItems: "center", justifyContent: "center",
  },
  stepText: { color: theme.text, fontSize: 22, fontWeight: "800" },
  raiseAmt: {
    minWidth: 66, height: 38, borderRadius: 8, backgroundColor: "#00000055",
    alignItems: "center", justifyContent: "center", paddingHorizontal: 8,
  },
  raiseAmtText: { color: theme.gold, fontSize: 16, fontWeight: "800" },
  preset: {
    paddingHorizontal: 10, height: 38, borderRadius: 8, backgroundColor: theme.buttonBg,
    alignItems: "center", justifyContent: "center",
  },
  presetText: { color: theme.text, fontWeight: "700", fontSize: 13 },
  btnRow: { flexDirection: "row", gap: 8 },
  btnWrap: {
    flex: 1, height: 54, borderRadius: 12, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  btn: { flex: 1, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderRadius: 12 },
  btnText: { color: "#fff", fontWeight: "900", fontSize: 16, lineHeight: 19 },
  btnSubText: { marginTop: 1, fontWeight: "900", fontSize: 13, lineHeight: 15 },
  disabled: { opacity: 0.45 },
});
