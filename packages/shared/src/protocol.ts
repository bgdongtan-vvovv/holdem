/**
 * 서버 ↔ 클라이언트 소켓 프로토콜 (연동 계약).
 *
 * 핵심 원칙: 서버가 권위(authoritative)를 갖는다.
 *  - 셔플/딜/족보 판정은 서버에서만. 클라이언트는 자기 홀카드만 받는다.
 *  - 클라이언트는 "의도(액션)"만 보내고, 서버가 검증 후 상태를 브로드캐스트.
 *
 * 형섭: 이 타입들을 그대로 구현하면 모바일 클라이언트가 붙습니다.
 */

import type { Action, Card, Street } from "@holdem/poker-engine";

export type { Action, Card, Street };

/** 다른 플레이어에게 노출되는 좌석 정보 (홀카드는 본인 것만). */
export interface PublicPlayer {
  seat: number;
  id: string;
  stack: number;
  committed: number; // 이번 라운드 베팅액
  status: "active" | "folded" | "allin" | "out" | "empty";
  /** 본인 좌석이면 실제 카드, 아니면 null. 쇼다운 공개 시에는 노출됨. */
  holeCards: Card[] | null;
  holeCardCount: number; // 뒷면 카드 장수 (0~2)
}

/** 뷰어(수신자) 관점으로 정제된 테이블 상태. */
export interface PublicTableState {
  tableId: string;
  stakes: { smallBlind: number; bigBlind: number };
  players: PublicPlayer[];
  board: Card[];
  street: Street;
  pot: number;
  currentBet: number;
  dealerSeat: number;
  actingSeat: number; // -1 = 없음
  /** 뷰어 차례일 때만 채워짐 (베팅 UI 활성화용). */
  legal: PublicLegalActions | null;
  /** 핸드 종료 시 결과. */
  result?: PublicHandResult;
}

export interface PublicLegalActions {
  canFold: boolean;
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canRaise: boolean;
  minRaiseTo: number;
  maxRaiseTo: number;
  /** 서버가 제시하는 액션 마감 시각(epoch ms). 타임뱅크 표시용. */
  deadline?: number;
}

export interface PublicHandResult {
  awards: { seat: number; amount: number }[];
  wentToShowdown: boolean;
  /** 쇼다운 시 공개된 핸드 (좌석 → 족보 카테고리 이름). */
  shownHands?: { seat: number; category: string; cards: Card[] }[];
}

// ─────────────────────────────────────────────────────────────────────────
// 소켓 이벤트 (Socket.IO 채널명 + 페이로드)
// ─────────────────────────────────────────────────────────────────────────

/** 클라이언트 → 서버 */
export interface ClientToServer {
  join: (p: { tableId: string; token: string }) => void; // 인증 토큰으로 입장(관전)
  sit: (p: { seat: number; buyIn: number }) => void; // 착석
  leave: () => void;
  action: (p: { action: Action }) => void; // 폴드/체크/콜/베팅
  chat: (p: { text: string }) => void;
}

/** 서버 → 클라이언트 */
export interface ServerToClient {
  state: (s: PublicTableState) => void; // 매 상태 변화마다 브로드캐스트
  handResult: (r: PublicHandResult) => void;
  error: (e: { code: string; message: string }) => void;
  chat: (m: { seat: number; id: string; text: string; ts: number }) => void;
}

/** 채널명 상수 (오타 방지). */
export const EVENTS = {
  join: "join",
  sit: "sit",
  leave: "leave",
  action: "action",
  chat: "chat",
  state: "state",
  handResult: "handResult",
  error: "error",
} as const;
