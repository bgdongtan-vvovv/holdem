/**
 * 로컬 테이블 훅: 서버 없이 엔진을 구동한다.
 * seat 0 = 사람(당신), 나머지는 봇. 봇 차례는 타이머로 자동 진행.
 * 나중에 이 훅을 서버 소켓 버전으로 교체하면 UI는 그대로 재사용된다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyAction,
  isHandOver,
  legalActions,
  startHand,
  type Action,
  type HandState,
  type LegalActions,
} from "@holdem/poker-engine";
import { decideBotAction } from "./bot";
import { initSfx, playSfx, playSfxAndWait, type Sfx } from "../sound/sfx";

/** 액션 타입 → 효과음. */
function actionSfx(type: Action["type"], voice: "male" | "female" = "male"): Sfx {
  switch (type) {
    case "fold":
      return voice === "female" ? "fold_female" : "fold";
    case "check":
      return voice === "female" ? "check_female" : "check";
    case "call":
      return voice === "female" ? "call_female" : "call";
    case "bet":
      return "bet";
    case "raise":
      return "raise";
    case "allin":
      return "allin";
  }
}

export interface SeatMeta {
  id: string;
  isBot: boolean;
  voice: "male" | "female";
}

export interface TableOptions {
  seats: { id: string; isBot: boolean; stack: number; voice?: "male" | "female" }[];
  smallBlind: number;
  bigBlind: number;
}

const BOT_DELAY_MS = 900;
const INITIAL_DEAL_ANIMATION_MS = 4100;
const BOARD_AFTER_BET_PAUSE_MS = 500;
const FLOP_ANIMATION_MS = BOARD_AFTER_BET_PAUSE_MS + 1520;
const SINGLE_BOARD_CARD_ANIMATION_MS = BOARD_AFTER_BET_PAUSE_MS + 1050;

export function useLocalTable(options: TableOptions) {
  const seatsMeta = useRef<SeatMeta[]>(
    options.seats.map((s) => ({ id: s.id, isBot: s.isBot, voice: s.voice ?? "male" })),
  );
  const stacks = useRef<number[]>(options.seats.map((s) => s.stack));
  const buttonIndex = useRef<number>(0);
  const [state, setState] = useState<HandState>(() =>
    startHand({
      seats: options.seats.map((s) => ({ id: s.id, stack: s.stack })),
      buttonIndex: 0,
      smallBlind: options.smallBlind,
      bigBlind: options.bigBlind,
    }),
  );
  const [animationLocked, setAnimationLocked] = useState(true);
  const [actionSoundPlaying, setActionSoundPlaying] = useState(false);
  const animationLockRef = useRef(true);
  const actionSoundRef = useRef(false);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lockFor = useCallback((duration: number) => {
    animationLockRef.current = true;
    setAnimationLocked(true);
    if (animationTimer.current) clearTimeout(animationTimer.current);
    animationTimer.current = setTimeout(() => {
      animationLockRef.current = false;
      setAnimationLocked(false);
      animationTimer.current = null;
    }, duration);
  }, []);

  const humanSeat = 0;
  const legal: LegalActions | null =
    !animationLocked &&
    !actionSoundPlaying &&
    !isHandOver(state) &&
    state.actingIndex === humanSeat
      ? legalActions(state)
      : null;

  const act = useCallback((action: Action) => {
    if (animationLockRef.current || actionSoundRef.current) return;
    const voice = seatsMeta.current[humanSeat]?.voice ?? "male";
    actionSoundRef.current = true;
    setActionSoundPlaying(true);

    void (async () => {
      await playSfxAndWait(actionSfx(action.type, voice));
      setState((s) => {
        if (isHandOver(s) || s.actingIndex !== humanSeat) return s;
        return applyAction(s, action);
      });
      actionSoundRef.current = false;
      setActionSoundPlaying(false);
    })();
  }, []);

  // 사운드 초기화 + 첫 핸드 셔플/딜 사운드
  useEffect(() => {
    lockFor(INITIAL_DEAL_ANIMATION_MS);
    initSfx().then(() => {
      playSfx("card_shuffle");
    });
    return () => {
      if (animationTimer.current) clearTimeout(animationTimer.current);
    };
  }, [lockFor]);

  // 봇 자동 진행
  useEffect(() => {
    if (animationLocked || actionSoundPlaying || isHandOver(state)) return;
    const actor = seatsMeta.current[state.actingIndex];
    if (!actor?.isBot) return;
    const actorIndex = state.actingIndex;
    const botAction = decideBotAction(state);
    const t = setTimeout(async () => {
      if (animationLockRef.current || actionSoundRef.current) return;
      actionSoundRef.current = true;
      setActionSoundPlaying(true);
      await playSfxAndWait(actionSfx(botAction.type, actor.voice));
      setState((s) => {
        if (isHandOver(s) || s.actingIndex !== actorIndex) return s;
        return applyAction(s, botAction);
      });
      actionSoundRef.current = false;
      setActionSoundPlaying(false);
    }, BOT_DELAY_MS);
    return () => clearTimeout(t);
  }, [actionSoundPlaying, animationLocked, state]);

  // 상태 전이 기반 사운드 (커뮤니티 카드 딜 / 내 차례 / 승리) + 스택 저장
  const prev = useRef<HandState | null>(null);
  useEffect(() => {
    const p = prev.current;
    if (p) {
      if (state.board.length > p.board.length) {
        const opened = state.board.length - p.board.length;
        lockFor(opened >= 3 ? FLOP_ANIMATION_MS : SINGLE_BOARD_CARD_ANIMATION_MS);
        for (let i = 0; i < opened; i++) {
          setTimeout(
            () => playSfx("card_flip"),
            BOARD_AFTER_BET_PAUSE_MS + (opened >= 3 ? i * 230 : 0),
          );
        }
      }
      if (state.actingIndex === humanSeat && p.actingIndex !== humanSeat && !isHandOver(state)) {
        playSfx("your_turn");
      }
      if (!isHandOver(p) && isHandOver(state)) {
        const won = (state.result?.awards.find((a) => a.seat === humanSeat)?.amount ?? 0) > 0;
        setTimeout(() => playSfx("pot_win"), state.result?.wentToShowdown ? 500 : 0);
        setTimeout(() => playSfx(won ? "win" : "lose"), state.result?.wentToShowdown ? 900 : 300);
      }
    }
    prev.current = state;
    if (isHandOver(state)) {
      stacks.current = state.players.map((pl) => pl.stack);
    }
  }, [lockFor, state]);

  const nextHand = useCallback(() => {
    // 스택 0 인 좌석은 이번 데모에서 재바이인(간단화)
    const rebuy = options.bigBlind * 100;
    const seatConfigs = seatsMeta.current.map((m, i) => ({
      id: m.id,
      stack: stacks.current[i]! > 0 ? stacks.current[i]! : rebuy,
    }));
    // 버튼 이동
    buttonIndex.current = (buttonIndex.current + 1) % seatConfigs.length;
    lockFor(INITIAL_DEAL_ANIMATION_MS);
    playSfx("card_shuffle");
    setState(
      startHand({
        seats: seatConfigs,
        buttonIndex: buttonIndex.current,
        smallBlind: options.smallBlind,
        bigBlind: options.bigBlind,
      }),
    );
  }, [lockFor, options.bigBlind, options.smallBlind]);

  return {
    state,
    seatsMeta: seatsMeta.current,
    humanSeat,
    buttonIndex: buttonIndex.current,
    legal,
    act,
    nextHand,
    handOver: isHandOver(state),
    animationLocked,
  };
}
