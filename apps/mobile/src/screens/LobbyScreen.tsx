import React, { useContext } from "react";
import { FlatList, Image, ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AppContext } from "./LoginScreen"; // Import context from LoginScreen

export function LobbyScreen({ onStartGame, playerAvatarIndex, onAvatarChange }: { onStartGame: () => void; playerAvatarIndex: number; onAvatarChange: (index: number) => void; }) {
  const { userInfo } = useContext(AppContext); // Access userInfo from context
  // ... Other existing LobbyScreen code ...
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      {/* Existing LobbyScreen UI code */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  // ... Other styles ...
});