import React, { useState } from "react";
import { Image, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { prime } from "../components/primeTheme";

/**
 * 로그인 — 샘플 스플래시(골드 컨페티 + 어두운 아레나, KakaoTalk_20260902_155622655.jpg) 위에
 * 골드 워드마크, 하단엔 샘플 바텀시트(KakaoTalk_20260902_173449706_09/10.jpg) 톤의 로그인 패널.
 */
export function LoginScreen({ onLogin }: { onLogin: (playerId: string) => void }) {
  const [id, setId] = useState("david3323");
  const [pw, setPw] = useState("password");

  const handleLogin = () => {
    onLogin(id.trim() || `guest${Math.floor(Math.random() * 100000)}`);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden style="light" />
      <View style={styles.shell}>
        <Image
          source={require("../../assets/images/prime-login-splash.jpg")}
          resizeMode="cover"
          style={styles.splash}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.92)"]}
          locations={[0, 0.3, 0.55, 0.75]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.brand}>
          <View style={styles.brandRule} />
          <Text style={styles.brandTop}>SSUN</Text>
          <Text style={styles.brandBottom}>POKER</Text>
          <View style={styles.brandRule} />
          <Text style={styles.brandTag}>TEXAS HOLD'EM · REAL TABLE</Text>
        </View>

        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle}>로그인</Text>
          <Text style={styles.sheetSub}>계정으로 테이블에 입장하세요</Text>

          <View style={styles.fieldBox}>
            <Row label="아이디">
              <TextInput
                style={styles.input}
                value={id}
                onChangeText={setId}
                placeholder="아이디"
                placeholderTextColor={prime.textMuted}
                autoCapitalize="none"
              />
            </Row>
            <View style={styles.fieldDivider} />
            <Row label="비밀번호">
              <TextInput
                style={styles.input}
                value={pw}
                onChangeText={setPw}
                placeholder="비밀번호"
                placeholderTextColor={prime.textMuted}
                secureTextEntry
              />
            </Row>
          </View>

          <Pressable testID="login-submit" style={styles.cta} onPress={handleLogin}>
            <LinearGradient colors={["#c8323b", prime.red, prime.redDeep]} style={styles.ctaFill}>
              <Text style={styles.ctaText}>로그인</Text>
            </LinearGradient>
          </Pressable>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orTxt}>또는</Text>
            <View style={styles.orLine} />
          </View>

          <View style={styles.socialRow}>
            <SocialTile glyph="G" color="#e8e8e8" label="Google" onPress={handleLogin} />
            <SocialTile glyph="" color="#e8e8e8" label="Apple" onPress={handleLogin} />
            <SocialTile glyph="f" color="#5b8dff" label="Facebook" onPress={handleLogin} />
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerLink}>비밀번호 찾기</Text>
            <Text style={styles.footerDot}>·</Text>
            <Text style={styles.footerLink}>회원가입</Text>
          </View>
          <Text style={styles.version}>v2026.10 · 19+ 게임 이용 등급</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function SocialTile({
  glyph,
  color,
  label,
  onPress,
}: {
  glyph: string;
  color: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityLabel={`${label}로 로그인`} style={styles.social} onPress={onPress}>
      <Text style={[styles.socialGlyph, { color }]}>{glyph}</Text>
      <Text style={styles.socialTxt}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000", alignItems: "center" },
  shell: { flex: 1, width: "100%", maxWidth: 480, overflow: "hidden", backgroundColor: prime.bg },

  // 스플래시의 테이블·칩 부분이 로그인 시트 위로 보이도록 이미지를 위로 끌어올린다.
  splash: { position: "absolute", left: 0, right: 0, top: "-24%", height: "100%" },
  brand: { alignItems: "center", marginTop: "12%" },
  brandRule: { width: 168, height: 2, backgroundColor: prime.goldSoft },
  brandTop: {
    color: "#f1d48a",
    fontSize: 52,
    lineHeight: 58,
    fontWeight: "900",
    fontFamily: "Georgia",
    letterSpacing: 5,
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  brandBottom: {
    color: "#d9b26a",
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "700",
    fontFamily: "Georgia",
    letterSpacing: 7,
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  brandTag: { marginTop: 10, color: "rgba(255,240,205,0.82)", fontSize: 11, fontWeight: "700", letterSpacing: 3 },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(20,20,21,0.97)",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderColor: "rgba(217,178,106,0.35)",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 18,
  },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "#48484b", marginBottom: 12 },
  sheetTitle: { color: "#f4f4f4", fontSize: 20, fontWeight: "700", textAlign: "center" },
  sheetSub: { color: prime.textDim, fontSize: 12, textAlign: "center", marginTop: 3, marginBottom: 14 },

  fieldBox: { backgroundColor: prime.panelHi, borderRadius: 8, paddingHorizontal: 12 },
  field: { flexDirection: "row", alignItems: "center", height: 46 },
  fieldDivider: { height: 1, backgroundColor: prime.hairline },
  label: { color: "#cfcfd3", width: 68, fontSize: 14 },
  input: { flex: 1, color: "#f4f4f4", fontSize: 15, paddingVertical: 10 },

  cta: { marginTop: 14, borderRadius: 26, overflow: "hidden" },
  ctaFill: {
    height: 50,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,120,120,0.35)",
  },
  ctaText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  orRow: { flexDirection: "row", alignItems: "center", marginVertical: 12, gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: prime.hairline },
  orTxt: { color: prime.textMuted, fontSize: 12 },

  socialRow: { flexDirection: "row", gap: 8 },
  social: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#3a3a3d",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  socialGlyph: { fontSize: 16, fontWeight: "900" },
  socialTxt: { color: "#ececec", fontSize: 13, fontWeight: "600" },

  footerRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 14 },
  footerLink: { color: "#cfcfd3", fontSize: 12, textDecorationLine: "underline" },
  footerDot: { color: prime.textMuted, fontSize: 12 },
  version: { color: prime.textMuted, fontSize: 10, textAlign: "center", marginTop: 8 },
});
