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
import { initSfx, playSfx, type Sfx } from "../sound/sfx";

/** 액션 타입 → 효과음. */
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

export interface SeatMeta {
  id: string;
  isBot: boolean;
}

export interface TableOptions {
  seats: { id: string; isBot: boolean; stack: number }[];
  smallBlind: number;
  bigBlind: number;
}

const BOT_DELAY_MS = 900;

export function useLocalTable(options: TableOptions) {
  const seatsMeta = useRef<SeatMeta[]>(options.seats.map((s) => ({ id: s.id, isBot: s.isBot })));
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

  const humanSeat = 0;
  const legal: LegalActions | null =
    !isHandOver(state) && state.actingIndex === humanSeat ? legalActions(state) : null;

  const act = useCallback((action: Action) => {
    playSfx(actionSfx(action.type));
    setState((s) => {
      if (isHandOver(s) || s.actingIndex !== humanSeat) return s;
      return applyAction(s, action);
    });
  }, []);

  // 사운드 초기화 + 첫 핸드 셔플/딜 사운드
  useEffect(() => {
    initSfx().then(() => {
      playSfx("card_shuffle");
      setTimeout(() => playSfx("card_deal"), 350);
    });
  }, []);

  // 봇 자동 진행
  useEffect(() => {
    if (isHandOver(state)) return;
    const actor = seatsMeta.current[state.actingIndex];
    if (!actor?.isBot) return;
    const botAction = decideBotAction(state);
    const t = setTimeout(() => {
      playSfx(actionSfx(botAction.type));
      setState((s) => {
        if (isHandOver(s)) return s;
        const meta = seatsMeta.current[s.actingIndex];
        if (!meta?.isBot) return s;
        return applyAction(s, botAction);
      });
    }, BOT_DELAY_MS);
    return () => clearTimeout(t);
  }, [state]);

  // 상태 전이 기반 사운드 (커뮤니티 카드 딜 / 내 차례 / 승리) + 스택 저장
  const prev = useRef<HandState | null>(null);
  useEffect(() => {
    const p = prev.current;
    if (p) {
      if (state.board.length > p.board.length) playSfx("card_deal");
      if (state.actingIndex === humanSeat && p.actingIndex !== humanSeat && !isHandOver(state)) {
        playSfx("your_turn");
      }
      if (!isHandOver(p) && isHandOver(state)) {
        const won = (state.result?.awards.find((a) => a.seat === humanSeat)?.amount ?? 0) > 0;
        if (state.result?.wentToShowdown) {
          playSfx("card_flip");
          playSfx("hand_showdown");
        }
        setTimeout(() => playSfx("pot_win"), state.result?.wentToShowdown ? 500 : 0);
        setTimeout(() => playSfx(won ? "win" : "lose"), state.result?.wentToShowdown ? 900 : 300);
      }
    }
    prev.current = state;
    if (isHandOver(state)) {
      stacks.current = state.players.map((pl) => pl.stack);
    }
  }, [state]);

  const nextHand = useCallback(() => {
    // 스택 0 인 좌석은 이번 데모에서 재바이인(간단화)
    const rebuy = options.bigBlind * 100;
    const seatConfigs = seatsMeta.current.map((m, i) => ({
      id: m.id,
      stack: stacks.current[i]! > 0 ? stacks.current[i]! : rebuy,
    }));
    // 버튼 이동
    buttonIndex.current = (buttonIndex.current + 1) % seatConfigs.length;
    playSfx("card_shuffle");
    setTimeout(() => playSfx("card_deal"), 350);
    setState(
      startHand({
        seats: seatConfigs,
        buttonIndex: buttonIndex.current,
        smallBlind: options.smallBlind,
        bigBlind: options.bigBlind,
      }),
    );
  }, [options.bigBlind, options.smallBlind]);

  return {
    state,
    seatsMeta: seatsMeta.current,
    humanSeat,
    buttonIndex: buttonIndex.current,
    legal,
    act,
    nextHand,
    handOver: isHandOver(state),
  };
}
