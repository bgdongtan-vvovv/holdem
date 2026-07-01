import React, { useEffect, useState } from "react";
import { LoginScreen } from "./src/screens/LoginScreen";
import { LobbyScreen } from "./src/screens/LobbyScreen";
import { GameScreen } from "./src/screens/GameScreen";
import { initSfx, playSfx } from "./src/sound/sfx";
import { playMusic, stopMusic } from "./src/sound/music";

type Screen = "login" | "lobby" | "game";

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");

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
          onLogin={() => {
            playSfx("ui_confirm");
            void playMusic("lobby");
            setScreen("lobby");
          }}
        />
      );
    case "lobby":
      return (
        <LobbyScreen
          onStartGame={() => {
            playSfx("ui_confirm");
            void playMusic("table");
            setScreen("game");
          }}
        />
      );
    case "game":
      return (
        <GameScreen
          onExit={() => {
            playSfx("ui_back");
            void playMusic("lobby");
            setScreen("lobby");
          }}
        />
      );
  }
}
