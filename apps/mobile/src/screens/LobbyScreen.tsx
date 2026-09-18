import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { io, type Socket } from "socket.io-client";
import { EVENTS, type TableSummary } from "@holdem/shared";
import { theme } from "../theme";
import { brandTokens } from "../brand/tokens";
import { koCopy } from "../brand/copy.ko";
import { Avatar, AVATARS } from "../components/Avatar";
import { LobbyGameCard, type LobbyGame } from "../components/LobbyGameCard";
import { LobbyBottomNav } from "../components/LobbyBottomNav";
import { formatGameMoney } from "../formatMoney";
import { playSfx } from "../sound/sfx";

const DEFAULT_STAKES = { smallBlind: 10, bigBlind: 20 };

const GAMES: LobbyGame[] = [
  { id: "ring", title: koCopy.lobby.ring, subtitle: koCopy.lobby.ringSubtitle, enabled: true },
  { id: "sit-and-go", title: koCopy.lobby.sitAndGo, subtitle: koCopy.lobby.sitAndGoSubtitle, enabled: false },
  { id: "mtt", title: koCopy.lobby.tournament, subtitle: koCopy.lobby.tournamentSubtitle, enabled: false },
];

export function LobbyScreen({
  serverUrl,
  playerId,
  playerAvatarIndex,
  onAvatarChange,
  onEnterTable,
}: {
  serverUrl: string;
  playerId: string;
  playerAvatarIndex: number;
  onAvatarChange: (index: number) => void;
  onEnterTable: (tableId: string) => void;
}) {
  const socketRef = useRef<Socket | null>(null);
  const enteringRef = useRef(false);
  const [connected, setConnected] = useState(false);
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [busy, setBusy] = useState<"quickJoin" | "createTable" | string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = io(serverUrl, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit(EVENTS.listTables);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on(EVENTS.tables, (list: TableSummary[]) => setTables(list));
    socket.on(EVENTS.joined, (p: { tableId: string }) => {
      if (enteringRef.current) return;
      enteringRef.current = true;
      onEnterTable(p.tableId);
    });
    socket.on(EVENTS.error, (e: { code: string; message: string }) => {
      setBusy(null);
      setError(e.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl]);

  const handleQuickJoin = useCallback(() => {
    setError(null);
    setBusy("quickJoin");
    playSfx("ui_click");
    socketRef.current?.emit(EVENTS.quickJoin, DEFAULT_STAKES);
  }, []);

  const handleCreateTable = useCallback(() => {
    setError(null);
    setBusy("createTable");
    playSfx("ui_click");
    socketRef.current?.emit(EVENTS.createTable, DEFAULT_STAKES);
  }, []);

  const handleJoinTable = useCallback(
    (tableId: string) => {
      setError(null);
      setBusy(tableId);
      playSfx("ui_click");
      socketRef.current?.emit(EVENTS.join, { tableId, token: playerId });
    },
    [playerId],
  );

  const handleGamePress = useCallback(
    (game: LobbyGame) => {
      if (!game.enabled) return;
      handleQuickJoin();
    },
    [handleQuickJoin],
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden style="light" />
      <ImageBackground
        source={require("../../assets/images/ssun-lobby-bg.png")}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.backdropShade} />

      <View style={styles.header}>
        <Pressable
          style={styles.avatarBtn}
          onPress={() => {
            playSfx("ui_click");
            onAvatarChange((playerAvatarIndex + 1) % AVATARS.length);
          }}
        >
          <Avatar seat={0} avatarIndex={playerAvatarIndex} size={48} />
          <Text style={styles.avatarChangeTxt}>{koCopy.lobby.changeAvatar}</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.playerName}>{playerId}</Text>
          <View style={styles.connectionRow}>
            <View style={[styles.dot, connected ? styles.dotOn : styles.dotOff]} />
            <Text style={styles.connectionTxt}>{connected ? "온라인" : "연결 중..."}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorTxt}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>{koCopy.lobby.gamesTitle}</Text>
        <View style={styles.gameList}>
          {GAMES.map((game) => (
            <LobbyGameCard key={game.id} game={game} onPress={handleGamePress} />
          ))}
        </View>

        <Pressable
          style={[styles.createBtn, busy === "createTable" && styles.btnBusy]}
          disabled={!connected || busy !== null}
          onPress={handleCreateTable}
        >
          {busy === "createTable" ? (
            <ActivityIndicator color={brandTokens.color.text} />
          ) : (
            <Text style={styles.createBtnTxt}>+ 새 테이블 만들기 ({DEFAULT_STAKES.smallBlind}/{DEFAULT_STAKES.bigBlind})</Text>
          )}
        </Pressable>

        <View style={styles.tablesHeaderRow}>
          <Text style={styles.sectionTitle}>테이블 목록</Text>
          {!connected ? <ActivityIndicator size="small" color={brandTokens.color.textMuted} /> : null}
        </View>
        {tables.length === 0 ? (
          <Text style={styles.emptyTxt}>{connected ? "열린 테이블이 없습니다. 새로 만들어보세요." : "서버에 연결 중입니다..."}</Text>
        ) : (
          <View style={styles.tableList}>
            {tables.map((t) => (
              <TableRow
                key={t.tableId}
                table={t}
                busy={busy === t.tableId}
                disabled={busy !== null}
                onPress={() => handleJoinTable(t.tableId)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <LobbyBottomNav active="home" />
    </SafeAreaView>
  );
}

function TableRow({
  table,
  busy,
  disabled,
  onPress,
}: {
  table: TableSummary;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const full = table.occupiedSeats >= table.seatCount;
  return (
    <View style={styles.tableRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.tableRowTitle}>{table.tableId}</Text>
        <Text style={styles.tableRowSub}>
          {formatGameMoney(table.stakes.smallBlind)} / {formatGameMoney(table.stakes.bigBlind)} ·{" "}
          {table.occupiedSeats}/{table.seatCount}명 · {table.status === "active" ? "진행 중" : "대기 중"}
        </Text>
      </View>
      <Pressable
        style={[styles.enterBtn, (full || disabled) && !busy && styles.enterBtnDisabled]}
        disabled={disabled}
        onPress={onPress}
      >
        {busy ? <ActivityIndicator color={brandTokens.color.text} /> : <Text style={styles.enterBtnTxt}>{koCopy.lobby.enter}</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brandTokens.color.surface },
  backdropShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: brandTokens.depth.panelBorder,
    backgroundColor: "rgba(17,17,17,0.6)",
  },
  avatarBtn: { alignItems: "center" },
  avatarChangeTxt: {
    marginTop: 2,
    color: brandTokens.color.gold,
    fontSize: 10,
    fontWeight: "800",
  },
  headerInfo: { flex: 1 },
  playerName: { color: theme.text, fontSize: 17, fontWeight: "800" },
  connectionRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOn: { backgroundColor: brandTokens.color.success },
  dotOff: { backgroundColor: brandTokens.color.textMuted },
  connectionTxt: { color: theme.textMuted, fontSize: 12, fontWeight: "600" },
  scroll: { padding: 16, paddingBottom: 24, gap: 12 },
  errorBanner: {
    backgroundColor: "rgba(166,31,43,0.24)",
    borderWidth: 1,
    borderColor: brandTokens.color.red,
    borderRadius: brandTokens.radius.action,
    padding: 10,
  },
  errorTxt: { color: theme.text, fontSize: 13, fontWeight: "700" },
  sectionTitle: { color: theme.text, fontSize: 15, fontWeight: "900", marginTop: 8 },
  gameList: { gap: 10 },
  createBtn: {
    marginTop: 4,
    backgroundColor: brandTokens.color.felt,
    borderWidth: 1,
    borderColor: brandTokens.color.gold,
    borderRadius: brandTokens.radius.action,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnBusy: { opacity: 0.7 },
  createBtnTxt: { color: brandTokens.color.goldBright, fontWeight: "900", fontSize: 14 },
  tablesHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  emptyTxt: { color: theme.textMuted, fontSize: 13, fontStyle: "italic", paddingVertical: 8 },
  tableList: { gap: 8 },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: brandTokens.radius.action,
    backgroundColor: brandTokens.color.surfaceOverlay,
    borderWidth: 1,
    borderColor: brandTokens.depth.panelBorder,
  },
  tableRowTitle: { color: theme.text, fontSize: 14, fontWeight: "800" },
  tableRowSub: { color: theme.textMuted, fontSize: 12, marginTop: 2, fontWeight: "600" },
  enterBtn: {
    minWidth: 64,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: brandTokens.radius.action,
    backgroundColor: brandTokens.color.red,
    borderWidth: 1,
    borderColor: brandTokens.color.gold,
  },
  enterBtnDisabled: { opacity: 0.5 },
  enterBtnTxt: { color: theme.text, fontWeight: "900", fontSize: 13 },
});
