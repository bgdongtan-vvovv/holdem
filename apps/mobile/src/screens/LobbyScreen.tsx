import React from "react";
import { ImageBackground, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { theme } from "../theme";
import { Avatar, AVATARS } from "../components/Avatar";
import { playSfx } from "../sound/sfx";

export function LobbyScreen({
  onStartGame,
  playerAvatarIndex,
  onAvatarChange,
}: {
  onStartGame: () => void;
  playerAvatarIndex: number;
  onAvatarChange: (index: number) => void;
}) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden style="light" />
      <ImageBackground
        source={require("../../assets/images/casino-lobby-bg.png")}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.backdropShade} />

      {/* 상단 코인/메뉴 */}
      <View style={styles.topRow}>
        <View style={styles.coin}>
          <Text style={styles.coinIcon}>◉</Text>
          <Text style={styles.coinTxt}>10</Text>
        </View>
        <Text style={styles.menu}>≡</Text>
      </View>

      {/* 프로필 */}
      <View style={styles.profile}>
        <Pressable
          style={styles.avatar}
          onPress={() => {
            playSfx("ui_click");
            onAvatarChange((playerAvatarIndex + 1) % AVATARS.length);
          }}
        >
          <Avatar seat={0} avatarIndex={playerAvatarIndex} size={64} />
          <Text style={styles.avatarChange}>변경</Text>
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.pname}>데이비드3323</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { borderColor: "#8a97a8" }]}>
              <Text style={styles.badgeTxt}>I</Text>
            </View>
            <View style={[styles.badge, { borderColor: theme.goldDeep }]}>
              <Text style={[styles.badgeTxt, { color: theme.gold }]}>♠</Text>
            </View>
          </View>
        </View>
        <HeaderIcon icon="♧" label="보너스" />
        <HeaderIcon icon="⇄" label="전송" />
        <HeaderIcon icon="$" label="상점" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        {/* 배너 */}
        <View style={styles.banner}>
          <Text style={styles.bannerSmall}>총상금 4억</Text>
          <Text style={styles.bannerBig}>1등 1억원</Text>
          <Text style={styles.bannerSub}>새틀라이트 매일 저녁 5, 8, 11시</Text>
          <View style={styles.bannerCta}>
            <Text style={styles.bannerCtaTxt}>♨ 참여하기 ♨</Text>
          </View>
        </View>

        {/* 모드 카드 */}
        <View style={styles.modeRow}>
          <ModeCard title="홀덤" value="0.1/0.2" sub="바이인 8" cta="바로시작" onPress={onStartGame} />
          <ModeCard title="프리롤" value="4,500GTD" sub="참여 마감 : 00:06:34" cta="참가하기" onPress={onStartGame} />
          <ModeCard title="토너먼트" value="360만GTD" sub="07/01(수) 17:00" cta="참가하기" onPress={onStartGame} />
        </View>

        {/* 카테고리 그리드 */}
        <View style={styles.grid}>
          <GameTile emoji="A♠" label="홀덤" big onPress={onStartGame} />
          <GameTile emoji="♕" label="토너먼트" big onPress={onStartGame} />
          <GameTile emoji="2♠" label="OFC" big onPress={onStartGame} />
        </View>
        <View style={styles.grid}>
          <GameTile emoji="◎" label="앤티" onPress={onStartGame} />
          <GameTile emoji="A A A" label="오마하" onPress={onStartGame} />
          <GameTile emoji="21" label="블랙잭" onPress={onStartGame} />
          <GameTile emoji="A♠" label="바카라" onPress={onStartGame} />
        </View>
      </ScrollView>

      {/* 하단 탭 */}
      <View style={styles.tabbar}>
        <Tab icon="➕" label="테이블 생성" />
        <Tab icon="🏆" label="랭킹" />
        <Tab icon="🏠" label="로비" active />
        <Tab icon="⚙️" label="옵션" />
        <Tab icon="👥" label="친구" />
      </View>
    </SafeAreaView>
  );
}

function HeaderIcon({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.hIcon}>
      <Text style={styles.hIconGlyph}>{icon}</Text>
      <Text style={styles.hIconLabel}>{label}</Text>
    </View>
  );
}

function ModeCard({
  title, value, sub, cta, onPress,
}: { title: string; value: string; sub: string; cta: string; onPress: () => void }) {
  return (
    <View style={styles.modeCard}>
      <Text style={styles.modeTitle}>{title}</Text>
      <Text style={styles.modeValue}>{value}</Text>
      <Text style={styles.modeSub} numberOfLines={1}>{sub}</Text>
      <Pressable style={styles.modeCta} onPress={onPress}>
        <Text style={styles.modeCtaTxt}>{cta}</Text>
      </Pressable>
    </View>
  );
}

function GameTile({
  emoji, label, big, onPress,
}: { emoji: string; label: string; big?: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.tile, big && styles.tileBig]} onPress={onPress}>
      <View style={styles.tileArt}>
        <Text style={[styles.tileGlyph, big && styles.tileGlyphBig]}>{emoji}</Text>
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  );
}

function Tab({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <View style={styles.tab}>
      <Text style={{ fontSize: 20, opacity: active ? 1 : 0.7 }}>{icon}</Text>
      <Text style={[styles.tabLabel, active && { color: theme.gold }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080706" },
  backdropShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  topRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 8,
  },
  coin: { flexDirection: "row", alignItems: "center", gap: 6 },
  coinIcon: { color: theme.gold, fontSize: 18 },
  coinTxt: { color: theme.text, fontWeight: "800", fontSize: 16 },
  menu: { color: theme.text, fontSize: 26, fontWeight: "900" },

  profile: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 6,
    marginHorizontal: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(214,169,88,0.18)",
    backgroundColor: "rgba(18,18,17,0.82)",
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 14,
  },
  avatar: {
    width: 64, height: 64, alignItems: "center", justifyContent: "center",
  },
  avatarChange: {
    position: "absolute", bottom: -4, color: theme.gold, fontSize: 9, fontWeight: "900",
    backgroundColor: "rgba(0,0,0,0.72)", paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: 6, overflow: "hidden",
  },
  pname: { color: theme.text, fontWeight: "800", fontSize: 19 },
  badges: { flexDirection: "row", gap: 6, marginTop: 4 },
  badge: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center", backgroundColor: "#1a1d24",
  },
  badgeTxt: { color: "#c3ccd8", fontWeight: "900", fontSize: 11 },
  hIcon: { alignItems: "center", width: 58 },
  hIconGlyph: {
    color: "#d4b16d",
    fontSize: 24,
    lineHeight: 26,
    fontWeight: "300",
    textShadowColor: "rgba(214,169,88,0.34)",
    textShadowRadius: 7,
  },
  hIconLabel: { color: "#bba77d", fontSize: 12, marginTop: 4, fontWeight: "500" },

  banner: {
    margin: 14, borderRadius: 14, padding: 22, minHeight: 196,
    backgroundColor: "rgba(18,17,15,0.88)", borderWidth: 1, borderColor: "rgba(211,162,81,0.72)",
    justifyContent: "center",
    shadowColor: "#d9ad62", shadowOpacity: 0.18, shadowRadius: 18,
  },
  bannerSmall: { color: "#d2a45e", fontSize: 20, fontWeight: "800" },
  bannerBig: {
    color: "#e8c27b",
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.82)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bannerSub: { color: "#e7e2d8", fontSize: 13, marginTop: 12, fontWeight: "600" },
  bannerCta: {
    alignSelf: "flex-start", marginTop: 18,
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingHorizontal: 24, paddingVertical: 11, borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(214,169,88,0.86)",
  },
  bannerCtaTxt: { color: "#e7c37c", fontWeight: "900", fontSize: 15 },

  modeRow: { flexDirection: "row", paddingHorizontal: 10, gap: 8 },
  modeCard: {
    flex: 1, backgroundColor: "rgba(27,27,26,0.9)", borderRadius: 12, padding: 14, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(214,169,88,0.58)",
    shadowColor: "#000", shadowOpacity: 0.45, shadowRadius: 10,
  },
  modeTitle: { color: "#f2efe8", fontWeight: "900", fontSize: 15 },
  modeValue: { color: "#f5f1e8", fontWeight: "900", fontSize: 20, marginTop: 14 },
  modeSub: { color: "#c9c1b5", fontSize: 11, marginTop: 7, fontWeight: "600" },
  modeCta: {
    marginTop: 15, backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 6, paddingVertical: 8,
    width: "100%", alignItems: "center", borderWidth: 1, borderColor: "rgba(214,169,88,0.74)",
  },
  modeCtaTxt: { color: "#d9b36a", fontWeight: "800", fontSize: 13 },

  grid: { flexDirection: "row", justifyContent: "center", paddingHorizontal: 10, gap: 18, marginTop: 20 },
  tile: { alignItems: "center", width: 78 },
  tileBig: { width: 104 },
  tileArt: {
    width: "100%", aspectRatio: 1, borderRadius: 14, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(25,25,24,0.82)",
    borderWidth: 1.2, borderColor: "rgba(214,169,88,0.62)",
    shadowColor: "#000", shadowOpacity: 0.75, shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
  },
  tileGlyph: {
    color: "#d7b574",
    fontSize: 24,
    fontWeight: "300",
    textShadowColor: "rgba(214,169,88,0.34)",
    textShadowRadius: 8,
  },
  tileGlyphBig: { fontSize: 30 },
  tileLabel: { color: "#d7b574", fontWeight: "800", fontSize: 13, marginTop: 8 },

  tabbar: {
    position: "absolute", left: 0, right: 0, bottom: 0, height: 74,
    flexDirection: "row", backgroundColor: "rgba(13,13,13,0.98)", borderTopWidth: 1, borderTopColor: "rgba(214,169,88,0.42)",
    paddingBottom: 8, paddingTop: 8,
  },
  tab: { flex: 1, alignItems: "center", gap: 3 },
  tabLabel: { color: theme.textMuted, fontSize: 11, fontWeight: "600" },
});
