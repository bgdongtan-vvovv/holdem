import React, { useEffect, useState } from "react";
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
    return () => {
      void stopMusic();
    };
  }, []);

  switch (screen) {
    case "login":
      return (
        <LoginScreen
          onLogin={async () => {
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
            await unlockSfx("ui_back");
            void playMusic("lobby");
            setScreen("lobby");
          }}
        />
      );
  }
}
