import React from "react";
import { ImageBackground, ImageSourcePropType, Pressable, StyleSheet, Text, View } from "react-native";
import { brandTokens } from "../brand/tokens";

export type LobbyEvent = {
  id: string;
  title: string;
  subtitle: string;
  startsAtLabel: string;
  art: ImageSourcePropType;
};

/** 배너 원화는 2172×724(3:1). 왼쪽 약 45% 가 텍스트 안전 영역이다. */
const BANNER_ASPECT = 3;

export function LobbyEventBanner({
  event,
  width,
  onPress,
}: {
  event: LobbyEvent;
  width: number;
  onPress?: (event: LobbyEvent) => void;
}) {
  const height = Math.round(width / BANNER_ASPECT);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.title} ${event.subtitle}`}
      onPress={onPress ? () => onPress(event) : undefined}
      style={[styles.card, { width, height }]}
    >
      <ImageBackground source={event.art} resizeMode="cover" style={StyleSheet.absoluteFill} imageStyle={styles.art} />
      <View style={styles.textArea}>
        <View style={styles.pill}>
          <Text style={styles.pillTxt}>{event.startsAtLabel}</Text>
        </View>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
          {event.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {event.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: brandTokens.radius.sheet,
    overflow: "hidden",
    backgroundColor: brandTokens.color.surfaceRaised,
    borderWidth: 1,
    borderColor: brandTokens.depth.panelBorder,
  },
  art: { borderRadius: brandTokens.radius.sheet },
  textArea: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "46%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
    gap: 4,
  },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: brandTokens.depth.panelBorder,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillTxt: { color: brandTokens.color.goldBright, fontSize: 10, fontWeight: "800" },
  title: {
    color: brandTokens.color.text,
    fontSize: 20,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: brandTokens.color.text,
    opacity: 0.92,
    fontSize: 12,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 3,
  },
});
