import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { LinearGradient } from "expo-linear-gradient";
import { prime } from "../components/primeTheme";
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

  const seatedPlayers = tables.reduce((sum, t) => sum + t.occupiedSeats, 0);
  const activeTables = tables.filter((t) => t.status === "active").length;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden style="light" />
      <View style={styles.shell}>
        <View style={styles.header}>
          <Pressable
            style={styles.avatarBtn}
            accessibilityLabel={koCopy.lobby.changeAvatar}
            onPress={() => {
              playSfx("ui_click");
              onAvatarChange((playerAvatarIndex + 1) % AVATARS.length);
            }}
          >
            <Avatar seat={0} avatarIndex={playerAvatarIndex} size={38} showBadges={false} />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.playerName} numberOfLines={1}>{playerId}</Text>
            <View style={styles.connectionRow}>
              <View style={[styles.dot, connected ? styles.dotOn : styles.dotOff]} />
              <Text style={styles.connectionTxt}>{connected ? "온라인" : "연결 중..."}</Text>
            </View>
          </View>
          <View style={styles.wallet}>
            <Text style={styles.walletGlyph}>◆</Text>
            <Text style={styles.walletTxt}>
              {formatGameMoney(DEFAULT_STAKES.smallBlind)}/{formatGameMoney(DEFAULT_STAKES.bigBlind)}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Image
              source={require("../../assets/images/prime-lobby-banner.jpg")}
              resizeMode="cover"
              style={styles.heroImage}
            />
              <LinearGradient
                colors={["rgba(0,0,0,0.75)", "rgba(0,0,0,0.25)", "rgba(0,0,0,0)"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.heroShade}
              >
                <Text style={styles.heroKicker}>SSUN POKER</Text>
                <Text style={styles.heroTitle}>HOLD'EM{"\n"}RING GAME</Text>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillTxt}>
                    NL · {formatGameMoney(DEFAULT_STAKES.smallBlind)}/{formatGameMoney(DEFAULT_STAKES.bigBlind)} · 최대 9인
                  </Text>
                </View>
              </LinearGradient>
          </View>
          <View style={styles.pager}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.pagerDot, i === 0 && styles.pagerDotOn]} />
            ))}
          </View>

          <LinearGradient colors={["#3a2c12", "#1e170b"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.statStrip}>
            <Stat label="열린 테이블" value={String(tables.length)} />
            <View style={styles.statDivider} />
            <Stat label="진행 중" value={String(activeTables)} />
            <View style={styles.statDivider} />
            <Stat label="착석 인원" value={String(seatedPlayers)} />
          </LinearGradient>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{koCopy.lobby.recommendedTitle}</Text>
            <View style={styles.onlinePill}>
              <Text style={styles.onlinePillTxt}>{connected ? `${seatedPlayers} Online` : "Offline"}</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow}>
            {GAMES.map((game) => (
              <LobbyGameCard
                key={game.id}
                game={game}
                onPress={handleGamePress}
                footnote={game.id === "ring" ? `${tables.length}개 테이블` : undefined}
              />
            ))}
          </ScrollView>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>테이블</Text>
            {!connected ? <ActivityIndicator size="small" color={prime.textDim} /> : null}
            <View style={{ flex: 1 }} />
            <Pressable
              style={[styles.createBtn, busy === "createTable" && styles.btnBusy]}
              disabled={!connected || busy !== null}
              onPress={handleCreateTable}
            >
              {busy === "createTable" ? (
                <ActivityIndicator size="small" color={prime.gold} />
              ) : (
                <Text style={styles.createBtnTxt}>+ 새 테이블</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.tablePanel}>
            <View style={styles.tableHeadRow}>
              <Text style={[styles.th, { flex: 1.3 }]}>테이블</Text>
              <Text style={[styles.th, { flex: 1 }]}>블라인드</Text>
              <Text style={[styles.th, { flex: 0.8 }]}>인원</Text>
              <View style={{ width: 70 }} />
            </View>
            {tables.length === 0 ? (
              <Text style={styles.emptyTxt}>
                {connected ? "열린 테이블이 없습니다. 새로 만들어보세요." : "서버에 연결 중입니다..."}
              </Text>
            ) : (
              tables.map((t) => (
                <TableRow
                  key={t.tableId}
                  table={t}
                  busy={busy === t.tableId}
                  disabled={busy !== null}
                  onPress={() => handleJoinTable(t.tableId)}
                />
              ))
            )}
          </View>

          <Pressable
            style={[styles.quickJoin, (!connected || busy !== null) && styles.btnBusy]}
            disabled={!connected || busy !== null}
            onPress={handleQuickJoin}
          >
            <LinearGradient colors={["#c8323b", prime.red, prime.redDeep]} style={styles.quickJoinFill}>
              {busy === "quickJoin" ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.quickJoinTxt}>{koCopy.lobby.quickJoin}</Text>
              )}
            </LinearGradient>
          </Pressable>
        </ScrollView>

        <LobbyBottomNav active="home" onCenterPress={handleQuickJoin} centerBusy={busy === "quickJoin"} />
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  const live = table.status === "active";
  return (
    <View style={styles.tableRow}>
      <View style={{ flex: 1.3 }}>
        <Text style={styles.tableRowTitle} numberOfLines={1}>{table.tableId}</Text>
        <Text style={[styles.tableRowStatus, live && styles.tableRowLive]}>{live ? "● 진행 중" : "○ 대기 중"}</Text>
      </View>
      <Text style={[styles.td, { flex: 1 }]}>
        {formatGameMoney(table.stakes.smallBlind)} / {formatGameMoney(table.stakes.bigBlind)}
      </Text>
      <Text style={[styles.td, { flex: 0.8 }]}>
        {table.occupiedSeats}/{table.seatCount}
      </Text>
      <Pressable
        style={[styles.enterBtn, (full || disabled) && !busy && styles.enterBtnDisabled]}
        disabled={disabled}
        onPress={onPress}
      >
        {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.enterBtnTxt}>{koCopy.lobby.enter}</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000", alignItems: "center" },
  shell: { flex: 1, width: "100%", maxWidth: 480, backgroundColor: prime.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: prime.bg,
  },
  avatarBtn: { borderRadius: 19 },
  headerInfo: { flex: 1 },
  playerName: { color: prime.text, fontSize: 15, fontWeight: "700" },
  connectionRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dotOn: { backgroundColor: prime.online },
  dotOff: { backgroundColor: prime.textMuted },
  connectionTxt: { color: prime.textDim, fontSize: 11 },
  wallet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    backgroundColor: prime.panel,
    borderWidth: 1,
    borderColor: "rgba(217,178,106,0.4)",
  },
  walletGlyph: { color: prime.gold, fontSize: 11 },
  walletTxt: { color: prime.gold, fontSize: 13, fontWeight: "700" },
  scroll: { paddingBottom: 28 },

  hero: { height: 196, overflow: "hidden" },
  heroImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  heroShade: { flex: 1, paddingHorizontal: 16, justifyContent: "center" },
  heroKicker: { color: prime.goldSoft, fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  heroTitle: {
    color: "#fff6dc",
    fontSize: 30,
    lineHeight: 33,
    fontWeight: "900",
    marginTop: 4,
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroPill: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(242,193,78,0.8)",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  heroPillTxt: { color: "#f6e3b0", fontSize: 11, fontWeight: "700" },
  pager: { flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 8 },
  pagerDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#4a4a4d" },
  pagerDotOn: { width: 18, backgroundColor: "#d8d8d8" },

  statStrip: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(217,178,106,0.55)",
    paddingVertical: 8,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "800" },
  statLabel: { color: "#d8c49a", fontSize: 10, marginTop: 1 },
  statDivider: { width: 1, height: 26, backgroundColor: "rgba(217,178,106,0.35)" },

  errorBanner: {
    marginHorizontal: 14,
    marginTop: 12,
    backgroundColor: "rgba(184,38,47,0.2)",
    borderWidth: 1,
    borderColor: prime.red,
    borderRadius: 6,
    padding: 10,
  },
  errorTxt: { color: prime.text, fontSize: 13, fontWeight: "600" },

  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, marginTop: 20, marginBottom: 10 },
  sectionTitle: { color: prime.text, fontSize: 19, fontWeight: "700" },
  onlinePill: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(63,211,107,0.55)",
    backgroundColor: "rgba(63,211,107,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  onlinePillTxt: { color: prime.online, fontSize: 11, fontWeight: "700" },
  cardRow: { paddingHorizontal: 14, gap: 10 },

  createBtn: {
    paddingHorizontal: 12,
    height: 28,
    justifyContent: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(217,178,106,0.6)",
  },
  btnBusy: { opacity: 0.55 },
  createBtnTxt: { color: prime.gold, fontWeight: "700", fontSize: 12 },

  tablePanel: {
    marginHorizontal: 14,
    borderRadius: 8,
    backgroundColor: prime.panel,
    borderWidth: 1,
    borderColor: prime.panelBorder,
    overflow: "hidden",
  },
  tableHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#232325",
  },
  th: { color: prime.textDim, fontSize: 11, fontWeight: "600" },
  emptyTxt: { color: prime.textDim, fontSize: 13, padding: 14 },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: prime.hairline,
  },
  tableRowTitle: { color: prime.text, fontSize: 13, fontWeight: "700" },
  tableRowStatus: { color: prime.textMuted, fontSize: 10, marginTop: 2 },
  tableRowLive: { color: prime.online },
  td: { color: "#dcdcdf", fontSize: 13 },
  enterBtn: {
    width: 70,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    backgroundColor: prime.red,
    borderWidth: 1,
    borderColor: prime.redGlow,
  },
  enterBtnDisabled: { opacity: 0.45 },
  enterBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },

  quickJoin: { marginHorizontal: 14, marginTop: 16, borderRadius: 26, overflow: "hidden" },
  quickJoinFill: { height: 50, alignItems: "center", justifyContent: "center", borderRadius: 26 },
  quickJoinTxt: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
