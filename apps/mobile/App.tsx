import React, { useEffect, useState } from "react";
import { Platform, View, Text, Pressable } from "react-native";
import { AppProvider, LoginScreen } from "./src/screens/LoginScreen";
import { LobbyScreen } from "./src/screens/LobbyScreen";
import { GameScreen } from "./src/screens/GameScreen";
import { initSfx, unlockSfx } from "./src/sound/sfx";
import { playMusic, stopMusic } from "./src/sound/music";

type Screen = "login" | "lobby" | "game";

export default function App() {
  const [screen, setScreen] = useState<Screen>("lobby");
  const [playerAvatarIndex, setPlayerAvatarIndex] = useState(0);

  useEffect(() => {
    void initSfx();
    installMobileFullscreenUnlock();
    return () => {
      void stopMusic();
    };
  }, []);

  return (
    <AppProvider>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
        <Text style={{ color: '#fff', fontSize: 24, marginBottom: 20 }}>SSun Holdem</Text>
        {screen === "lobby" && (
          <>
            <Text style={{ color: '#ffd700', fontSize: 18, marginBottom: 30 }}>로비 화면</Text>
            <Pressable
              style={{ backgroundColor: '#ffd700', padding: 15, borderRadius: 8 }}
              onPress={async () => {
                await enterMobileWebFullscreen();
                await unlockSfx("ui_confirm");
                void playMusic("table");
                setScreen("game");
              }}
            >
              <Text style={{ color: '#000', fontSize: 16, fontWeight: 'bold' }}>게임 시작</Text>
            </Pressable>
          </>
        )}
        {screen === "game" && (
          <>
            <Text style={{ color: '#ffd700', fontSize: 18, marginBottom: 20 }}>포커 테이블</Text>
            <View style={{ width: '80%', height: 300, backgroundColor: '#0a5c3c', borderRadius: 150, borderWidth: 3, borderColor: '#ffd700', alignItems: 'center', justifyContent: 'center', marginBottom: 30 }}>
              <Text style={{ color: '#ffd700', fontSize: 24, fontWeight: 'bold' }}>♠ ♥ ♦ ♣</Text>
              <Text style={{ color: '#fff', fontSize: 14, marginTop: 10 }}>게임 중...</Text>
            </View>
            <Pressable
              style={{ backgroundColor: '#ffd700', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6, marginBottom: 10 }}
              onPress={() => {}}
            >
              <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>폴드</Text>
            </Pressable>
            <Pressable
              style={{ backgroundColor: '#ffd700', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6, marginBottom: 10 }}
              onPress={() => {}}
            >
              <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>콜</Text>
            </Pressable>
            <Pressable
              style={{ backgroundColor: '#ffd700', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6, marginBottom: 20 }}
              onPress={() => {}}
            >
              <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>레이즈</Text>
            </Pressable>
            <Pressable
              style={{ backgroundColor: '#666', padding: 12, borderRadius: 6 }}
              onPress={async () => {
                await enterMobileWebFullscreen();
                await unlockSfx("ui_back");
                void playMusic("lobby");
                setScreen("lobby");
              }}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>나가기</Text>
            </Pressable>
          </>
        )}
      </View>
    </AppProvider>
  );
}

function installMobileFullscreenUnlock(): void {
  if (Platform.OS !== "web" || !isMobileWeb()) return;

  const doc = globalThis.document;
  if (!doc) return;

  const unlock = () => {
    void enterMobileWebFullscreen();
    doc.removeEventListener("pointerdown", unlock);
    doc.removeEventListener("touchend", unlock);
    doc.removeEventListener("click", unlock);
  };

  doc.addEventListener("pointerdown", unlock, { once: true });
  doc.addEventListener("touchend", unlock, { once: true });
  doc.addEventListener("click", unlock, { once: true });
}

function isMobileWeb(): boolean {
  if (Platform.OS !== "web") return false;
  const ua = globalThis.navigator?.userAgent ?? "";
  const touchPoints = globalThis.navigator?.maxTouchPoints ?? 0;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || touchPoints > 1;
}

async function enterMobileWebFullscreen(): Promise<void> {
  if (!isMobileWeb()) return;

  const doc = globalThis.document;
  const root = doc?.documentElement as (HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
    msRequestFullscreen?: () => Promise<void> | void;
  }) | undefined;

  try {
    if (!doc?.fullscreenElement) {
      if (root?.requestFullscreen) {
        await root.requestFullscreen();
      } else if (root?.webkitRequestFullscreen) {
        await root.webkitRequestFullscreen();
      } else if (root?.msRequestFullscreen) {
        await root.msRequestFullscreen();
      }
    }

    const orientation = globalThis.screen?.orientation as {
      lock?: (orientation: "portrait" | "portrait-primary") => Promise<void>;
    } | undefined;
    await orientation?.lock?.("portrait").catch(() => undefined);
  } catch {
    // 모바일 브라우저/인앱 브라우저가 전체화면 API를 막는 경우는 조용히 기본 화면으로 진행합니다.
  }
}
