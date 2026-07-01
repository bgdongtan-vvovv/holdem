import React, { useState } from "react";
import { LoginScreen } from "./src/screens/LoginScreen";
import { LobbyScreen } from "./src/screens/LobbyScreen";
import { GameScreen } from "./src/screens/GameScreen";

type Screen = "login" | "lobby" | "game";

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");

  switch (screen) {
    case "login":
      return <LoginScreen onLogin={() => setScreen("lobby")} />;
    case "lobby":
      return <LobbyScreen onStartGame={() => setScreen("game")} />;
    case "game":
      return <GameScreen onExit={() => setScreen("lobby")} />;
  }
}
