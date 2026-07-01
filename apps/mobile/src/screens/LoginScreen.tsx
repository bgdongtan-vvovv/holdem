import React, { useState } from "react";
import { ImageBackground, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { theme } from "../theme";

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [id, setId] = useState("david3323");
  const [pw, setPw] = useState("password");

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <ImageBackground
        source={require("../../assets/images/casino-lobby-bg.png")}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.backdropShade} />
      <View style={styles.header}>
        <Text style={styles.brandTop}>
          <Text style={{ color: theme.gold }}>♠ HOLDEM</Text>
        </Text>
        <View style={styles.headerRight}>
          <Text style={styles.headerLink}>로그인</Text>
          <View style={styles.signupBtn}>
            <Text style={styles.signupTxt}>회원가입</Text>
          </View>
        </View>
      </View>

      <View style={styles.center}>
        <View style={styles.card}>
          <View style={styles.logo}>
            <Text style={styles.logoMonogram}>H</Text>
            <Text style={styles.logoSuit}>♠</Text>
          </View>
          <Text style={styles.title}>HOLDEM CLUB 로그인</Text>

          <View style={styles.field}>
            <Text style={styles.label}>아이디</Text>
            <TextInput
              style={styles.input}
              value={id}
              onChangeText={setId}
              placeholder="아이디"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              value={pw}
              onChangeText={setPw}
              placeholder="비밀번호"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
            />
          </View>

          <Pressable style={styles.loginBtn} onPress={onLogin}>
            <Text style={styles.loginTxt}>로그인</Text>
          </Pressable>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orTxt}>OR</Text>
            <View style={styles.orLine} />
          </View>

          <SocialButton label="Facebook으로 로그인" glyph="f" bg="#fff" color="#1877f2" onPress={onLogin} />
          <SocialButton label="Apple으로 로그인" glyph="" bg="#fff" color="#000" onPress={onLogin} />
          <SocialButton label="Google으로 로그인" glyph="G" bg="#fff" color="#4285F4" onPress={onLogin} />

          <Text style={styles.footerLinks}>비밀번호 찾기 | 회원가입하기</Text>
          <Text style={styles.version}>2026.06.26.1</Text>
        </View>
        <Text style={styles.tagline}>PLAY BOLD · PLAY SMART</Text>
      </View>
    </SafeAreaView>
  );
}

function SocialButton({
  label,
  glyph,
  bg,
  color,
  onPress,
}: {
  label: string;
  glyph: string;
  bg: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.social, { backgroundColor: bg }]} onPress={onPress}>
      <Text style={[styles.socialGlyph, { color }]}>{glyph}</Text>
      <Text style={styles.socialTxt}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050505" },
  backdropShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  brandTop: { fontSize: 18, fontWeight: "900", letterSpacing: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerLink: { color: theme.text, fontWeight: "700", fontSize: 13 },
  signupBtn: { borderWidth: 1, borderColor: theme.railHi, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  signupTxt: { color: theme.text, fontWeight: "700", fontSize: 13 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "rgba(24,23,23,0.95)",
    borderRadius: 10,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(217,174,76,0.32)",
    shadowColor: "#000", shadowOpacity: 0.85, shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  logo: {
    width: 58, height: 62, borderRadius: 8, backgroundColor: "#161616",
    alignItems: "center", justifyContent: "center", borderWidth: 2,
    borderColor: theme.goldDeep, marginBottom: 12,
    transform: [{ rotate: "-5deg" }],
    shadowColor: theme.gold, shadowOpacity: 0.45, shadowRadius: 10,
  },
  logoMonogram: { color: theme.gold, fontSize: 28, fontFamily: "serif", fontWeight: "900" },
  logoSuit: { color: "#f4e4b5", fontSize: 14, marginTop: -8 },
  title: { color: "#d7d0c1", fontSize: 18, fontWeight: "800", marginBottom: 20 },
  field: { width: "100%", flexDirection: "row", alignItems: "center", marginBottom: 12 },
  label: { color: theme.textMuted, width: 70, fontSize: 14, fontWeight: "600" },
  input: {
    flex: 1, backgroundColor: "#383838", borderRadius: 7, paddingHorizontal: 12, paddingVertical: 12,
    color: theme.text, fontSize: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
  },
  loginBtn: {
    width: "100%", backgroundColor: "#7c5cff", borderRadius: 8, paddingVertical: 14,
    alignItems: "center", marginTop: 8,
  },
  loginTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
  orRow: { flexDirection: "row", alignItems: "center", width: "100%", marginVertical: 16, gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  orTxt: { color: theme.textMuted, fontWeight: "700", fontSize: 12 },
  social: {
    width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderRadius: 8, paddingVertical: 12, marginBottom: 10, gap: 8,
  },
  socialGlyph: { fontSize: 16, fontWeight: "900", width: 18, textAlign: "center" },
  socialTxt: { color: "#1a1a1a", fontWeight: "800", fontSize: 14 },
  footerLinks: { color: theme.textMuted, fontSize: 13, marginTop: 10 },
  version: {
    color: theme.textMuted, fontSize: 11, marginTop: 12,
    borderWidth: 1, borderColor: theme.railHi, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  tagline: {
    color: "#d8b85d", fontSize: 19, fontWeight: "900", marginTop: 20,
    letterSpacing: 1.5, textShadowColor: "#000", textShadowRadius: 8,
  },
});
