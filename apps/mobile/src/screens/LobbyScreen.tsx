import React from "react";
import { FlatList, Image, ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";

export function LobbyScreen({ onStartGame, playerAvatarIndex, onAvatarChange }: { onStartGame: () => void; playerAvatarIndex: number; onAvatarChange: (index: number) => void; }) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Text style={styles.title}>로비</Text>
        <Text style={styles.subtitle}>게임을 시작하세요</Text>
        <Pressable style={styles.button} onPress={onStartGame}>
          <Text style={styles.buttonText}>게임 시작</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a1a1a' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#999', marginBottom: 30 },
  button: { backgroundColor: '#ffd700', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 8 },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#000' }
});