import React from "react";
import { ActivityIndicator, Animated, Easing, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { HAND_CATEGORY_NAMES, type Action, type HandState, type LegalActions } from "@holdem/poker-engine";
import { prime, type FeltId } from "../components/primeTheme";
import { GameMenuSheet, GameTopBar, RoundDockButton } from "../components/GameChrome";
import { PokerTable, ShowdownBurst } from "../components/PokerTable";
import { CardBack } from "../components/PlayingCard";
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
const BOT_REACTION_EMOJIS = ["🤔", "😮", "😏", "🔥", "👍"];
const QUICK_REACTION_EMOJIS = ["😂", "😮", "🤔", "👍", "🔥"];

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

  // 좌석별 이모지 반응 말풍선. key 가 바뀌면 같은 이모지라도 애니메이션이 다시 트리거된다.
  const [reactions, setReactions] = React.useState<Record<number, { emoji: string; key: number }>>({});
  const reactionKeyRef = React.useRef(0);
  const sendReaction = React.useCallback((seat: number, emoji: string) => {
    reactionKeyRef.current += 1;
    setReactions((prev) => ({ ...prev, [seat]: { emoji, key: reactionKeyRef.current } }));
  }, []);

  // 봇이 액션할 때 가끔(약 15%) 알아서 리액션을 보내 테이블이 덜 썰렁하게 만든다.
  const lastActingSeatRef = React.useRef<number>(-1);
  React.useEffect(() => {
    if (state.actingIndex < 0 || state.actingIndex === lastActingSeatRef.current) return;
    lastActingSeatRef.current = state.actingIndex;
    const actingSeat = state.players[state.actingIndex]?.seat;
    if (actingSeat === undefined || actingSeat === humanSeat) return;
    if (!seatsMeta[actingSeat]?.isBot) return;
    if (Math.random() > 0.15) return;
    const emoji = BOT_REACTION_EMOJIS[Math.floor(Math.random() * BOT_REACTION_EMOJIS.length)]!;
    const timer = setTimeout(() => sendReaction(actingSeat, emoji), 300 + Math.random() * 500);
    return () => clearTimeout(timer);
  }, [state.actingIndex, state.players, seatsMeta, humanSeat, sendReaction]);

  const [reactionPickerOpen, setReactionPickerOpen] = React.useState(false);

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

  const [felt, setFelt] = React.useState<FeltId>("charcoal");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const hero = humanSeat >= 0 ? state.players[humanSeat] : undefined;
  const heroCards = hero && humanCardsOpened && hero.holeCards.length > 0 ? hero.holeCards : null;
  const stakesLabel = `NL Hold'em · ${formatGameMoney(stakes.smallBlind)} / ${formatGameMoney(stakes.bigBlind)}`;
  // 새 핸드를 받았는데 아직 직접 열어보지 않았으면, 액션바 대신 큰 카드 오픈 연출을 보여준다
  // (샘플사진의 "틸트된 큰 카드 + Open 버튼" 장면).
  const needsBigOpen = !!hero && !handOver && hero.holeCards.length > 0 && !humanCardsOpened;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar hidden style="light" />
      <View style={styles.gameShell} onTouchStart={unlockAudioOnce}>
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
          reactions={reactions}
          felt={felt}
        />

        <GameTopBar heroCards={heroCards} onOpenMenu={() => setMenuOpen(true)} />

        {showdownEffectActive && <ShowdownBurst key={showdownEffectKey} />}

        {statusOverlay ? (
          <View style={styles.statusOverlay}>
            <ActivityIndicator color={prime.gold} />
            <Text style={styles.statusOverlayTxt}>{statusOverlay}</Text>
          </View>
        ) : null}

        <View style={styles.dock} pointerEvents="box-none">
          {reactionPickerOpen && humanSeat >= 0 && (
            <View style={styles.reactionPicker}>
              {QUICK_REACTION_EMOJIS.map((emoji) => (
                <Pressable
                  key={emoji}
                  style={styles.reactionPickerItem}
                  onPress={() => {
                    sendReaction(humanSeat, emoji);
                    setReactionPickerOpen(false);
                    void unlockSfx("ui_click");
                    playSfx("ui_click");
                  }}
                >
                  <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <View style={styles.dockRow}>
            {humanSeat >= 0 && (
              <RoundDockButton
                glyph="☺"
                label="이모지 반응"
                onPress={() => {
                  setReactionPickerOpen((v) => !v);
                  playSfx("ui_click");
                }}
              />
            )}
            <RoundDockButton
              glyph="⌃"
              label="옵션 메뉴"
              onPress={() => {
                setMenuOpen(true);
                playSfx("ui_click");
              }}
            />
          </View>
        </View>

        <View style={styles.footer} pointerEvents="box-none">
          {needsBigOpen ? (
            <BigCardOpenPrompt onOpen={openHumanCards} />
          ) : handOver ? (
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

        {menuOpen && (
          <GameMenuSheet
            felt={felt}
            onChangeFelt={setFelt}
            onExit={() => {
              setMenuOpen(false);
              onExit();
            }}
            onClose={() => setMenuOpen(false)}
            stakesLabel={stakesLabel}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const BIG_OPEN_CARD_W = 128;
const BIG_OPEN_CARD_H = 180;

/**
 * 새 핸드가 배정됐을 때 액션바 자리에 뜨는 "큰 틸트 카드 + Open 버튼" 연출
 * (샘플사진의 해당 장면 참고). 카드나 버튼 아무 쪽을 눌러도 열린다.
 */
function BigCardOpenPrompt({ onOpen }: { onOpen: () => void }) {
  const enter = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  return (
    <View style={styles.bigOpenWrap} pointerEvents="box-none">
      <Pressable
        style={styles.bigOpenCardTouch}
        onPress={() => {
          playSfx("ui_click");
          onOpen();
        }}
      >
        <Animated.View
          style={[
            styles.bigOpenCard,
            {
              opacity: enter,
              transform: [
                { perspective: 800 },
                { rotateX: "18deg" },
                { rotate: enter.interpolate({ inputRange: [0, 1], outputRange: ["-18deg", "-8deg"] }) },
                { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
              ],
            },
          ]}
        >
          <CardBack width={BIG_OPEN_CARD_W} height={BIG_OPEN_CARD_H} radius={10} />
        </Animated.View>
      </Pressable>

      <Pressable
        style={styles.bigOpenBtn}
        onPress={() => {
          playSfx("ui_click");
          onOpen();
        }}
      >
        <Text style={styles.bigOpenBtnText}>Open</Text>
      </Pressable>
    </View>
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
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>Hand Result</Text>
        <Text style={styles.resultText} numberOfLines={2}>{summary || "핸드 종료"}</Text>
      </View>
      <Pressable testID="next-hand" style={styles.nextBtn} onPress={onNext}>
        <Text style={styles.nextText}>Next Hand</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000", alignItems: "center" },
  gameShell: {
    position: "relative",
    flex: 1,
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#140d09",
    overflow: "hidden",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 18,
    elevation: 18,
  },
  statusOverlay: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 8,
    paddingVertical: 18,
    backgroundColor: "rgba(12,12,12,0.72)",
    zIndex: 19,
    elevation: 19,
  },
  statusOverlayTxt: { color: "#f2f2f2", fontSize: 14, fontWeight: "600" },
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 74,
    zIndex: 17,
    elevation: 17,
    alignItems: "center",
    gap: 8,
  },
  dockRow: { flexDirection: "row", gap: 12 },
  reactionPicker: {
    flexDirection: "row",
    backgroundColor: "rgba(18,18,20,0.95)",
    borderRadius: 34,
    borderWidth: 1,
    borderColor: prime.panelBorder,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 2,
  },
  reactionPickerItem: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
  reactionPickerEmoji: { fontSize: 36, lineHeight: 44 },
  resultWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 8,
    marginBottom: 10,
    padding: 8,
    borderRadius: 10,
    backgroundColor: "rgba(20,20,22,0.95)",
    borderWidth: 1,
    borderColor: prime.panelBorder,
  },
  resultInfo: { flex: 1, paddingLeft: 4 },
  resultTitle: { color: prime.textDim, fontSize: 11, fontWeight: "600" },
  resultText: { color: prime.gold, fontSize: 14, fontWeight: "700" },
  nextBtn: {
    backgroundColor: prime.red,
    paddingHorizontal: 22,
    height: 44,
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: prime.redGlow,
  },
  nextText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  bigOpenWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "rgba(10,8,6,0.55)",
  },
  bigOpenCardTouch: { alignItems: "center", justifyContent: "center" },
  bigOpenCard: {
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  bigOpenBtn: {
    backgroundColor: "#2bc76a",
    borderWidth: 1,
    borderColor: "#7bf0a4",
    borderRadius: 24,
    paddingHorizontal: 30,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  bigOpenBtnText: { color: "#fff", fontWeight: "900", fontSize: 18 },
});
