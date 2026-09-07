import React from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import ActionBar from '../components/ActionBar';

export function GameScreen({ onExit, playerAvatarIndex }: { onExit: () => void; playerAvatarIndex: number; }) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden style="light" />
      {/* Existing GameScreen UI code */}
      <ActionBar /> {/* Integrating ActionBar within GameScreen */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  // ... Other styles ...
});