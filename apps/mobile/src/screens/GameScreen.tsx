import React from "react";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { HAND_CATEGORY_NAMES, type Action, type HandState, type LegalActions } from "@holdem/poker-engine";
import { theme } from "../theme";
import { PokerTable, ShowdownBurst } from "../components/PokerTable";
import { ActionBar } from "../components/ActionBar";
import { useLocalTable, type SeatMeta, type TableOptions } from "../game/useLocalTable";
import { useRemoteTable, type RemoteTableOptions } from "../game/useRemoteTable";
import { formatGameMoney } from "../formatMoney";
import { playSfx, unlockSfx } from "../sound/sfx";

const SMALL_BLIND = 10;
const BIG_BLIND = 20;
const SHOWDOWN_CARD_REVEAL_DELAY_MS = 3000;
const REMOTE_BUY_IN_IN_BIG_BLINDS = 100;
const REMOTE_SEAT_RETRY_MS = 700;
const REMOTE_MAX_SEAT_ATTEMPTS = 6;

const SEATS: TableOptions["seats"] = [
  { id: "데이비드", isBot: false, stack: 3072 },
  { id: "당근쥬스", isBot: true, stack: 1587 },
  { id: "cmgykidfs", isBot: true, stack: 2400 },
  { id: "guest80652", isBot: true, stack: 760 },
  { id: "규규규승", isBot: true, stack: 1980 },
  { id: "kitiya", isBot: true, stack: 3481 },
  { id: "블랙존", isBot: true, stack: 2240 },
  { id: "에이스퀸", isBot: true, stack: 2870 },
  { id: "로얄킹", isBot: true, stack: 1960 },
];

/**
 * 데이터소스 스위치 지점: `remote` 가 주어지면 온라인(useRemoteTable), 없으면 로컬 봇
 * (useLocalTable) 로 진행한다. 화면/사운드 렌더 로직(TableView)은 두 경로가 공유한다.
 */
export function GameScreen({
  onExit,
  playerAvatarIndex,
  remote,
}: {
  onExit: () => void;
  playerAvatarIndex: number;
  remote?: RemoteTableOptions;
}) {
  if (remote) {
    return <RemoteGameScreen remote={remote} onExit={onExit} playerAvatarIndex={playerAvatarIndex} />;
  }
  return <LocalGameScreen onExit={onExit} playerAvatarIndex={playerAvatarIndex} />;
}

function LocalGameScreen({
  onExit,
  playerAvatarIndex,
}: {
  onExit: () => void;
  playerAvatarIndex: number;
}) {
  const seats = SEATS.map((seat, index) => ({
    ...seat,
    voice: (index === 0 ? playerAvatarIndex % 2 === 1 : index % 2 === 1)
      ? ("female" as const)
      : ("male" as const),
  }));
  const table = useLocalTable({ seats, smallBlind: SMALL_BLIND, bigBlind: BIG_BLIND });

  return (
    <TableView
      onExit={onExit}
      playerAvatarIndex={playerAvatarIndex}
      state={table.state}
      seatsMeta={table.seatsMeta}
      humanSeat={table.humanSeat}
      buttonIndex={table.buttonIndex}
      legal={table.legal}
      act={table.act}
      nextHand={table.nextHand}
      handOver={table.handOver}
      stakes={{ smallBlind: SMALL_BLIND, bigBlind: BIG_BLIND }}
      statusOverlay={null}
    />
  );
}

function RemoteGameScreen({
  remote,
  onExit,
  playerAvatarIndex,
}: {
  remote: RemoteTableOptions;
  onExit: () => void;
  playerAvatarIndex: number;
}) {
  const table = useRemoteTable(remote);
  const { state, humanSeat, sit, connected, error } = table;
  const [seatAttempt, setSeatAttempt] = React.useState(0);

  // 서버는 "입장 = 관전"이다. 실제로 플레이하려면 착석(sit)이 필요하므로, 연결 후
  // 빈 좌석을 순서대로 시도한다(0..5). 이미 찬 좌석이면 다음 좌석으로 재시도.
  React.useEffect(() => {
    if (!connected || humanSeat !== -1 || seatAttempt >= REMOTE_MAX_SEAT_ATTEMPTS) return;
    const buyIn = Math.max(state.bigBlind, BIG_BLIND) * REMOTE_BUY_IN_IN_BIG_BLINDS;
    sit(seatAttempt, buyIn);
    const retryTimer = setTimeout(() => setSeatAttempt((n) => n + 1), REMOTE_SEAT_RETRY_MS);
    return () => clearTimeout(retryTimer);
  }, [connected, humanSeat, seatAttempt, sit, state.bigBlind]);

  const statusOverlay = !connected
    ? "서버에 연결 중..."
    : error
      ? error
      : humanSeat === -1
        ? "착석 중..."
        : null;

  return (
    <TableView
      onExit={onExit}
      playerAvatarIndex={playerAvatarIndex}
      state={table.state}
      seatsMeta={table.seatsMeta}
      humanSeat={table.humanSeat}
      buttonIndex={table.buttonIndex}
      legal={table.legal}
      act={table.act}
      nextHand={table.nextHand}
      handOver={table.handOver}
      stakes={{ smallBlind: table.state.smallBlind || SMALL_BLIND, bigBlind: table.state.bigBlind || BIG_BLIND }}
      statusOverlay={statusOverlay}
    />
  );
}

function TableView({
  onExit,
  playerAvatarIndex,
  state,
  seatsMeta,
  humanSeat,
  buttonIndex,
  legal,
  act,
  nextHand,
  handOver,
  stakes,
  statusOverlay,
}: {
  onExit: () => void;
  playerAvatarIndex: number;
  state: HandState;
  seatsMeta: SeatMeta[];
  humanSeat: number;
  buttonIndex: number;
  legal: LegalActions | null;
  act: (action: Action) => void;
  nextHand: () => void;
  handOver: boolean;
  stakes: { smallBlind: number; bigBlind: number };
  statusOverlay: string | null;
}) {
  const [showdownCardsReady, setShowdownCardsReady] = React.useState(false);
  const [showdownEffectActive, setShowdownEffectActive] = React.useState(false);
  const [showdownEffectKey, setShowdownEffectKey] = React.useState(0);
  const [humanCardsOpened, setHumanCardsOpened] = React.useState(false);
  const audioUnlocked = React.useRef(false);

  // 매 핸드 새로 받은 홀카드는 다시 "닫힌" 상태로 시작 — 탭해서 직접 열어야 보인다.
  const humanHoleKey = state.players[humanSeat]?.holeCards.map((c) => `${c.rank}${c.suit}`).join("") ?? "";
  const lastHumanHoleKey = React.useRef(humanHoleKey);
  if (lastHumanHoleKey.current !== humanHoleKey) {
    lastHumanHoleKey.current = humanHoleKey;
    if (humanCardsOpened) setHumanCardsOpened(false);
  }
  const openHumanCards = React.useCallback(() => {
    setHumanCardsOpened(true);
    void unlockSfx("ui_click");
    playSfx("card_flip");
  }, []);

  const unlockAudioOnce = React.useCallback(() => {
    if (audioUnlocked.current) return;
    audioUnlocked.current = true;
    void unlockSfx("ui_click");
  }, []);
  const lastLegal = React.useRef<LegalActions>({
    seat: humanSeat,
    canFold: true,
    canCheck: false,
    canCall: true,
    callAmount: stakes.bigBlind,
    canRaise: true,
    minRaiseTo: stakes.bigBlind * 2,
    maxRaiseTo: stakes.bigBlind * 10,
  });
  if (legal) lastLegal.current = legal;
  const actionBarLegal = legal ?? lastLegal.current;
  const wentToShowdown = handOver && state.result?.wentToShowdown === true;
  const showdownContenders =
    state.result?.showdown.filter((entry) => entry.hand !== null).length ?? 0;
  const hasAllInShowdownPlayer = state.players.some((player) => player.status === "allin");
  const shouldPlayShowdownEffect =
    wentToShowdown &&
    state.board.length === 5 &&
    showdownContenders >= 2 &&
    hasAllInShowdownPlayer;

  React.useEffect(() => {
    setShowdownCardsReady(false);
    setShowdownEffectActive(false);

    if (!shouldPlayShowdownEffect) {
      setShowdownCardsReady(wentToShowdown);
      return;
    }

    setShowdownEffectActive(true);
    setShowdownEffectKey((key) => key + 1);
    playSfx("hand_showdown");
    const revealTimer = setTimeout(() => {
      setShowdownCardsReady(true);
      setShowdownEffectActive(false);
      playSfx("card_flip");
    }, SHOWDOWN_CARD_REVEAL_DELAY_MS);

    return () => {
      clearTimeout(revealTimer);
    };
  }, [shouldPlayShowdownEffect, state.result, wentToShowdown]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden style="light" />
      <View style={styles.gameShell} onTouchStart={unlockAudioOnce}>
        <View style={styles.topbar}>
          <View style={styles.topLeft}>
            <Pressable style={styles.iconBtn} onPress={onExit}>
              <Text style={styles.iconTxt}>⎋</Text>
            </Pressable>
            <View style={styles.network}>
              <Text style={styles.wifi}>◉</Text>
              <Text style={styles.ping}>66ms</Text>
            </View>
          </View>
          <View style={styles.topRight}>
            <Text style={styles.stakeBadge}>
              {formatGameMoney(stakes.smallBlind)} / {formatGameMoney(stakes.bigBlind)}
            </Text>
            <View style={styles.moveBtn}>
              <Text style={styles.moveTxt}>테이블 이동</Text>
            </View>
          </View>
        </View>

        <PokerTable
          state={state}
          seatsMeta={seatsMeta}
          humanSeat={humanSeat}
          buttonIndex={buttonIndex}
          reveal={wentToShowdown && showdownCardsReady}
          showdownEffectActive={false}
          playerAvatarIndex={playerAvatarIndex}
          humanCardsOpened={humanCardsOpened}
          onOpenHumanCards={openHumanCards}
        />

        {showdownEffectActive && <ShowdownBurst key={showdownEffectKey} />}

        {statusOverlay ? (
          <View style={styles.statusOverlay}>
            <ActivityIndicator color={theme.gold} />
            <Text style={styles.statusOverlayTxt}>{statusOverlay}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          {handOver ? (
            <ResultPanel state={state} onNext={nextHand} />
          ) : (
            <ActionBar
              state={state}
              legal={actionBarLegal}
              onAction={act}
              disabled={!legal}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function ResultPanel({
  state,
  onNext,
}: {
  state: HandState;
  onNext: () => void;
}) {
  const result = state.result;
  const winners = result?.awards.filter((a) => a.amount > 0) ?? [];
  const summary = winners
    .map((a) => {
      const name = state.players[a.seat]?.id ?? `seat ${a.seat}`;
      const sd = result?.showdown.find((s) => s.seat === a.seat);
      const handName = sd?.hand ? ` · ${HAND_CATEGORY_NAMES[sd.hand.category]}` : "";
      return `${name} +${formatGameMoney(a.amount)}${handName}`;
    })
    .join("   ");

  return (
    <View style={styles.resultWrap}>
      <Text style={styles.resultText}>{summary || "핸드 종료"}</Text>
      <Pressable style={styles.nextBtn} onPress={onNext}>
        <Text style={styles.nextText}>다음 핸드 ▶</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#02050b", alignItems: "center" },
  gameShell: {
    position: "relative",
    flex: 1,
    width: "100%",
    maxWidth: 480,
    backgroundColor: theme.bg,
    overflow: "hidden",
  },
  topbar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: "transparent",
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 13 },
  iconBtn: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: "#353636",
    alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#77705c",
    shadowColor: "#000", shadowOpacity: 0.8, shadowRadius: 5,
  },
  iconTxt: { color: theme.text, fontSize: 25, fontWeight: "900" },
  network: { alignItems: "center", justifyContent: "center" },
  wifi: { color: "#2ef28a", fontWeight: "900", fontSize: 25, lineHeight: 25 },
  ping: { color: "#fff", fontWeight: "800", fontSize: 13 },
  topRight: {
    alignItems: "center", gap: 5, backgroundColor: "rgba(52,50,52,0.78)",
    padding: 7, borderRadius: 10,
  },
  stakeBadge: { color: "#e3dfdc", fontWeight: "900", fontSize: 13 },
  moveBtn: {
    backgroundColor: "#363632", paddingHorizontal: 13, paddingVertical: 7,
    borderRadius: 5, borderWidth: 1.5, borderColor: "#7c7561",
  },
  moveTxt: { color: "#ecd58d", fontWeight: "900", fontSize: 14 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 128,
    zIndex: 18,
    elevation: 18,
    justifyContent: "center", backgroundColor: "rgba(10,11,14,0.96)",
    borderTopWidth: 2, borderTopColor: "#363535",
    overflow: "hidden",
  },
  waiting: { color: theme.textMuted, textAlign: "center", fontStyle: "italic", paddingVertical: 24 },
  statusOverlay: {
    position: "absolute",
    top: "42%",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 8,
    zIndex: 19,
    elevation: 19,
  },
  statusOverlayTxt: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "800",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  resultWrap: { alignItems: "center", padding: 16, gap: 12 },
  resultText: { color: theme.text, fontSize: 15, fontWeight: "700", textAlign: "center" },
  nextBtn: { backgroundColor: theme.gold, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  nextText: { color: "#1a1a1a", fontWeight: "900", fontSize: 16 },
});
