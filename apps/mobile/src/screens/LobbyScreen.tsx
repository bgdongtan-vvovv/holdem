import React from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { theme } from "../theme";

export function LobbyScreen({ onStartGame }: { onStartGame: () => void }) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />

      {/* 상단 코인/메뉴 */}
      <View style={styles.topRow}>
        <View style={styles.coin}>
          <Text style={styles.coinIcon}>◈</Text>
          <Text style={styles.coinTxt}>10</Text>
        </View>
        <Text style={styles.menu}>≡</Text>
      </View>

      {/* 프로필 */}
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 30 }}>🧑</Text>
        </View>
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
        <HeaderIcon icon="🍯" label="보너스" />
        <HeaderIcon icon="⇄" label="전송" />
        <HeaderIcon icon="🪙" label="상점" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        {/* 배너 */}
        <View style={styles.banner}>
          <Text style={styles.bannerSmall}>총상금 4억</Text>
          <Text style={styles.bannerBig}>1등 1억원</Text>
          <Text style={styles.bannerSub}>새틀라이트 매일 저녁 5, 8, 11시</Text>
          <View style={styles.bannerCta}>
            <Text style={styles.bannerCtaTxt}>🔥 참여하기 🔥</Text>
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
          <GameTile emoji="🂡" label="홀덤" big color="#b0413e" onPress={onStartGame} />
          <GameTile emoji="🏆" label="토너먼트" big color="#c9962b" onPress={onStartGame} />
          <GameTile emoji="🍍" label="OFC" big color="#2f80ed" onPress={onStartGame} />
        </View>
        <View style={styles.grid}>
          <GameTile emoji="🎰" label="앤티" color="#e0a020" onPress={onStartGame} />
          <GameTile emoji="🃏" label="오마하" color="#9b59b6" onPress={onStartGame} />
          <GameTile emoji="2️⃣1️⃣" label="블랙잭" color="#c9962b" onPress={onStartGame} />
          <GameTile emoji="🎴" label="바카라" color="#2980b9" onPress={onStartGame} />
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
      <Text style={{ fontSize: 22 }}>{icon}</Text>
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
  emoji, label, color, big, onPress,
}: { emoji: string; label: string; color: string; big?: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.tile, big && styles.tileBig]} onPress={onPress}>
      <View style={[styles.tileArt, { backgroundColor: color }]}>
        <Text style={{ fontSize: big ? 40 : 30 }}>{emoji}</Text>
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
  root: { flex: 1, backgroundColor: theme.bg },
  topRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 8,
  },
  coin: { flexDirection: "row", alignItems: "center", gap: 6 },
  coinIcon: { color: theme.gold, fontSize: 18 },
  coinTxt: { color: theme.text, fontWeight: "800", fontSize: 16 },
  menu: { color: theme.text, fontSize: 26, fontWeight: "900" },

  profile: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 6,
    borderBottomWidth: 1, borderBottomColor: "rgba(242,193,78,0.25)",
  },
  avatar: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: "#2b3350",
    alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: theme.railHi,
  },
  pname: { color: theme.text, fontWeight: "800", fontSize: 16 },
  badges: { flexDirection: "row", gap: 6, marginTop: 4 },
  badge: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center", backgroundColor: "#1a1d24",
  },
  badgeTxt: { color: "#c3ccd8", fontWeight: "900", fontSize: 11 },
  hIcon: { alignItems: "center", width: 52 },
  hIconLabel: { color: theme.textMuted, fontSize: 11, marginTop: 2, fontWeight: "600" },

  banner: {
    margin: 14, borderRadius: 14, padding: 18, minHeight: 150,
    backgroundColor: "#3a0d0d", borderWidth: 1, borderColor: "#5a1a1a",
    justifyContent: "center",
  },
  bannerSmall: { color: "#ff5a4d", fontSize: 22, fontWeight: "900" },
  bannerBig: { color: theme.gold, fontSize: 44, fontWeight: "900", letterSpacing: 1 },
  bannerSub: { color: theme.text, fontSize: 12, marginTop: 6, fontWeight: "600" },
  bannerCta: {
    alignSelf: "flex-start", marginTop: 12, backgroundColor: theme.goldDeep,
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8,
  },
  bannerCtaTxt: { color: "#1a1a1a", fontWeight: "900", fontSize: 14 },

  modeRow: { flexDirection: "row", paddingHorizontal: 10, gap: 8 },
  modeCard: {
    flex: 1, backgroundColor: "#141a28", borderRadius: 12, padding: 10, alignItems: "center",
    borderWidth: 1, borderColor: theme.railHi,
  },
  modeTitle: { color: theme.text, fontWeight: "900", fontSize: 15 },
  modeValue: { color: theme.text, fontWeight: "900", fontSize: 18, marginTop: 6 },
  modeSub: { color: "#5fd0ff", fontSize: 10, marginTop: 4, fontWeight: "600" },
  modeCta: {
    marginTop: 8, backgroundColor: "#c0392b", borderRadius: 6, paddingVertical: 7,
    width: "100%", alignItems: "center",
  },
  modeCtaTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },

  grid: { flexDirection: "row", justifyContent: "center", paddingHorizontal: 10, gap: 10, marginTop: 16 },
  tile: { alignItems: "center", width: 78 },
  tileBig: { width: 104 },
  tileArt: {
    width: "100%", aspectRatio: 1, borderRadius: 14, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  tileLabel: { color: theme.gold, fontWeight: "800", fontSize: 13, marginTop: 6 },

  tabbar: {
    position: "absolute", left: 0, right: 0, bottom: 0, height: 74,
    flexDirection: "row", backgroundColor: "#0c1220", borderTopWidth: 1, borderTopColor: theme.railHi,
    paddingBottom: 8, paddingTop: 8,
  },
  tab: { flex: 1, alignItems: "center", gap: 3 },
  tabLabel: { color: theme.textMuted, fontSize: 11, fontWeight: "600" },
});
