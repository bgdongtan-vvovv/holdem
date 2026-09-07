import React, { useState, createContext, useContext, useMemo } from "react";
import { ImageBackground, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { theme } from "../theme";

export const AppContext = createContext<{ userInfo: { id: string; pw: string; }; setUser: (id: string, pw: string) => void; } | null>(null);

export function AppProvider({ children }) {
  const [userInfo, setUserInfo] = useState({ id: "", pw: "" });

  const setUser = (id, pw) => {
    setUserInfo({ id, pw });
  };

  return (
    <AppContext.Provider value={{ userInfo, setUser }}>
      {children}
    </AppContext.Provider>
  );
}

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  // Initialize state without context
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  const handleLogin = () => {
    onLogin();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden style="light" />
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
              onChangeText={(text) => { setId(text); }}
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
              onChangeText={(text) => { setPw(text); }}
              placeholder="비밀번호"
              placeholderTextColor={theme.textMuted}
              secureTextEntry
            />
          </View>
          <Pressable style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginTxt}>로그인</Text>
          </Pressable>
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orTxt}>OR</Text>
            <View style={styles.orLine} />
          </View>
          <SocialButton label="Facebook으로 로그인" glyph="f" bg="#fff" color="#1877f2" onPress={handleLogin} />
          <SocialButton label="Apple으로 로그인" glyph="" bg="#fff" color="#000" onPress={handleLogin} />
          <SocialButton label="Google으로 로그인" glyph="G" bg="#fff" color="#4285F4" onPress={handleLogin} />
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
  /* Existing styles from the original LoginScreen */
});