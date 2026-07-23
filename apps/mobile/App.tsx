import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { LoginScreen } from "./src/screens/LoginScreen";
import { LobbyScreen } from "./src/screens/LobbyScreen";
import { GameScreen } from "./src/screens/GameScreen";
import { initSfx, unlockSfx } from "./src/sound/sfx";
import { playMusic, stopMusic } from "./src/sound/music";

type Screen = "login" | "lobby" | "game";

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [playerAvatarIndex, setPlayerAvatarIndex] = useState(0);

  useEffect(() => {
    void initSfx();
    installMobileFullscreenUnlock();
    return () => {
      void stopMusic();
    };
  }, []);

  switch (screen) {
    case "login":
      return (
        <LoginScreen
          onLogin={async () => {
            await enterMobileWebFullscreen();
            await unlockSfx("ui_confirm");
            void playMusic("lobby");
            setScreen("lobby");
          }}
        />
      );
    case "lobby":
      return (
        <LobbyScreen
          playerAvatarIndex={playerAvatarIndex}
          onAvatarChange={setPlayerAvatarIndex}
          onStartGame={async () => {
            await enterMobileWebFullscreen();
            await unlockSfx("ui_confirm");
            void playMusic("table");
            setScreen("game");
          }}
        />
      );
    case "game":
      return (
        <GameScreen
          playerAvatarIndex={playerAvatarIndex}
          onExit={async () => {
            await enterMobileWebFullscreen();
            await unlockSfx("ui_back");
            void playMusic("lobby");
            setScreen("lobby");
          }}
        />
      );
  }
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
