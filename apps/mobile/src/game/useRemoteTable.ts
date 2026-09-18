/**
 * 원격(온라인) 테이블 훅 — useLocalTable 과 "같은 모양"을 반환해 GameScreen 의
 * import 한 줄만 바꾸면 화면(PokerTable/ActionBar)·사운드를 그대로 재사용할 수 있다.
 *
 * 서버(@holdem/server, TableManager)에 Socket.IO 로 접속해 packages/shared/src/protocol.ts
 * 계약대로 통신한다:
 *   - EVENTS.join 으로 tableId 에 입장 → EVENTS.state(PublicTableState) 수신
 *   - act(action) → EVENTS.action 전송, 결과는 다음 state 브로드캐스트로 반영
 *   - sit(seat, buyIn) → EVENTS.sit 전송
 *
 * 서버 권위 원칙: PublicTableState 는 이미 뷰어 관점으로 홀카드가 가려져 있다.
 * 여기서는 그 위에 로컬 엔진(HandState)과 같은 "모양"을 재구성하는 얇은 어댑터만 수행하며,
 * 가려진 홀카드를 클라이언트가 추측/복원하지 않는다(빈 배열로 유지).
 *
 * 핸드 진행(다음 핸드 자동 시작, 쇼다운 정산)은 서버가 주도하므로 completeShowdown/nextHand 는
 * 로컬처럼 상태를 직접 굴리지 않고 no-op 이다 — 화면 코드가 호출해도 안전하도록 형태만 유지한다.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  evaluateHand,
  type Action,
  type HandState,
  type LegalActions,
  type PlayerState,
  type PlayerStatus,
} from "@holdem/poker-engine";
import { EVENTS, type PublicPlayer, type PublicTableState } from "@holdem/shared";
import type { SeatMeta } from "./useLocalTable";
import { initSfx, playSfx, type Sfx } from "../sound/sfx";

export interface RemoteTableOptions {
  serverUrl: string;
  token: string;
  tableId: string;
}

const NEW_HAND_LOCK_MS = 1200;
const BOARD_REVEAL_LOCK_MS = 700;

/** 액션 타입 → 효과음 (useLocalTable 과 동일 매핑). */
function actionSfx(type: Action["type"]): Sfx {
  switch (type) {
    case "fold":
      return "fold";
    case "check":
      return "check";
    case "call":
      return "call";
    case "bet":
      return "bet";
    case "raise":
      return "raise";
    case "allin":
      return "allin";
  }
}

function toPlayerStatus(s: PublicPlayer["status"]): PlayerStatus {
  return s === "empty" ? "out" : s;
}

const EMPTY_STATE: HandState = {
  players: [],
  buttonIndex: 0,
  smallBlind: 0,
  bigBlind: 0,
  deck: [],
  board: [],
  street: "complete",
  currentBet: 0,
  minRaise: 0,
  actingIndex: -1,
  pots: [],
  log: [],
};

/** PublicTableState → HandState 모양 어댑터. 빈 좌석은 제거해 좌석 배열을 촘촘하게 재색인한다. */
function adaptState(
  pub: PublicTableState,
  mySeat: number,
): { state: HandState; humanSeat: number; buttonIndex: number } {
  const occupied = pub.players.filter((p) => p.status !== "empty").sort((a, b) => a.seat - b.seat);
  const seatToIndex = new Map<number, number>();
  occupied.forEach((p, i) => seatToIndex.set(p.seat, i));

  const players: PlayerState[] = occupied.map((p, i) => ({
    id: p.id,
    seat: i,
    stack: p.stack,
    committed: p.committed,
    // 서버가 핸드 전체 누적액(totalCommitted)을 아직 브로드캐스트하지 않아 committed 로 근사한다.
    totalCommitted: p.committed,
    holeCards: p.holeCards ?? [],
    status: toPlayerStatus(p.status),
    hasActed: false,
  }));

  const actingIndex = pub.actingSeat >= 0 ? seatToIndex.get(pub.actingSeat) ?? -1 : -1;
  const buttonIndex = seatToIndex.get(pub.dealerSeat) ?? 0;
  const humanSeat = mySeat >= 0 ? seatToIndex.get(mySeat) ?? -1 : -1;

  const state: HandState = {
    players,
    buttonIndex,
    smallBlind: pub.stakes.smallBlind,
    bigBlind: pub.stakes.bigBlind,
    deck: [], // 서버 전용 — 클라이언트로 전달되지 않음
    board: pub.board,
    street: pub.street,
    currentBet: pub.currentBet,
    minRaise: pub.stakes.bigBlind, // 서버가 노출하지 않아 근사(화면에서 미사용)
    actingIndex,
    pots: [], // 사이드팟 상세는 서버 미브로드캐스트 (TODO(형섭))
    log: [],
    result: pub.result
      ? {
          wentToShowdown: pub.result.wentToShowdown,
          awards: pub.result.awards.map((a) => ({
            seat: seatToIndex.get(a.seat) ?? a.seat,
            amount: a.amount,
          })),
          showdown: (pub.result.shownHands ?? []).map((s) => {
            const seat = seatToIndex.get(s.seat) ?? s.seat;
            const canEvaluate = s.cards.length === 2 && pub.board.length === 5;
            return {
              seat,
              hand: canEvaluate ? evaluateHand([...s.cards, ...pub.board]) : null,
            };
          }),
        }
      : undefined,
  };

  return { state, humanSeat, buttonIndex };
}

function toSeatsMeta(pub: PublicTableState): SeatMeta[] {
  return pub.players
    .filter((p) => p.status !== "empty")
    .sort((a, b) => a.seat - b.seat)
    .map((p) => ({ id: p.id, isBot: false, voice: p.seat % 2 === 1 ? "female" : "male" }));
}

function toLegalActions(pub: PublicTableState, humanSeat: number): LegalActions | null {
  if (!pub.legal) return null;
  return {
    seat: humanSeat,
    canFold: pub.legal.canFold,
    canCheck: pub.legal.canCheck,
    canCall: pub.legal.canCall,
    callAmount: pub.legal.callAmount,
    canRaise: pub.legal.canRaise,
    minRaiseTo: pub.legal.minRaiseTo,
    maxRaiseTo: pub.legal.maxRaiseTo,
  };
}

export function useRemoteTable(options: RemoteTableOptions) {
  const socketRef = useRef<Socket | null>(null);
  const mySeatRef = useRef<number>(-1);
  const prevPubRef = useRef<PublicTableState | null>(null);

  const [pub, setPub] = useState<PublicTableState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animationLocked, setAnimationLocked] = useState(true);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lockFor = useCallback((duration: number) => {
    setAnimationLocked(true);
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => setAnimationLocked(false), duration);
  }, []);

  useEffect(() => {
    const socket = io(options.serverUrl, {
      transports: ["websocket"],
      auth: { token: options.token },
    });
    socketRef.current = socket;
    void initSfx();

    socket.on("connect", () => {
      setConnected(true);
      socket.emit(EVENTS.join, { tableId: options.tableId, token: options.token });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on(EVENTS.state, (s: PublicTableState) => setPub(s));
    socket.on(EVENTS.error, (e: { code: string; message: string }) => {
      setError(`${e.code}: ${e.message}`);
      if (e.code === "SIT_FAILED") mySeatRef.current = -1;
    });

    return () => {
      socket.emit(EVENTS.leave);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [options.serverUrl, options.token, options.tableId]);

  // 상태 전이 기반 사운드 + 보드 리빌 애니메이션 락 (useLocalTable 과 동일한 스타일).
  useEffect(() => {
    const prevPub = prevPubRef.current;
    if (pub && prevPub) {
      const newHandStarted =
        prevPub.street !== "preflop" && pub.street === "preflop" && pub.board.length === 0;
      if (newHandStarted) {
        lockFor(NEW_HAND_LOCK_MS);
        playSfx("card_shuffle");
      } else if (pub.board.length > prevPub.board.length) {
        const opened = pub.board.length - prevPub.board.length;
        lockFor(BOARD_REVEAL_LOCK_MS);
        for (let i = 0; i < opened; i++) {
          setTimeout(() => playSfx("card_flip"), i * 150);
        }
      }

      const mySeat = mySeatRef.current;
      if (
        mySeat >= 0 &&
        pub.actingSeat === mySeat &&
        prevPub.actingSeat !== mySeat &&
        pub.street !== "complete"
      ) {
        playSfx("your_turn");
      }

      if (prevPub.street !== "complete" && pub.street === "complete") {
        const won = (pub.result?.awards.find((a) => a.seat === mySeat)?.amount ?? 0) > 0;
        const wentToShowdown = pub.result?.wentToShowdown ?? false;
        setTimeout(() => playSfx("pot_win"), wentToShowdown ? 500 : 0);
        setTimeout(() => playSfx(won ? "win" : "lose"), wentToShowdown ? 900 : 300);
      }
    }
    prevPubRef.current = pub;
  }, [pub, lockFor]);

  useEffect(() => {
    return () => {
      if (lockTimer.current) clearTimeout(lockTimer.current);
    };
  }, []);

  const sit = useCallback((seat: number, buyIn: number) => {
    mySeatRef.current = seat;
    socketRef.current?.emit(EVENTS.sit, { seat, buyIn });
  }, []);

  const act = useCallback((action: Action) => {
    playSfx(actionSfx(action.type));
    socketRef.current?.emit(EVENTS.action, { action });
  }, []);

  /** 서버가 쇼다운 정산을 자동으로 진행하므로 no-op (반환 모양 호환용). */
  const completeShowdown = useCallback(() => {}, []);
  /** 서버가 다음 핸드를 자동으로 시작하므로 no-op (반환 모양 호환용). */
  const nextHand = useCallback(() => {}, []);

  const adapted = useMemo(() => {
    if (!pub) return { state: EMPTY_STATE, humanSeat: -1, buttonIndex: 0, seatsMeta: [] as SeatMeta[], legal: null as LegalActions | null };
    const { state, humanSeat, buttonIndex } = adaptState(pub, mySeatRef.current);
    const legal = animationLocked ? null : toLegalActions(pub, humanSeat);
    return { state, humanSeat, buttonIndex, seatsMeta: toSeatsMeta(pub), legal };
  }, [pub, animationLocked]);

  return {
    state: adapted.state,
    seatsMeta: adapted.seatsMeta,
    humanSeat: adapted.humanSeat,
    buttonIndex: adapted.buttonIndex,
    legal: adapted.legal,
    act,
    completeShowdown,
    nextHand,
    handOver: adapted.state.street === "complete",
    animationLocked,
    // 원격 전용 (온라인 로비/연결 처리에 필요):
    sit,
    connected,
    error,
  };
}
