/**
 * Socket.IO 권위 서버 — 스켈레톤 (형섭 시작점).
 *
 * 실행:  npm run build   (packages 빌드 후)
 *        npm run dev -w @holdem/server
 *
 * 현재: 단일 테이블 "main" 하나. 접속하면 관전, sit 으로 착석.
 * 2명 이상 착석하면 핸드 시작. 핸드 종료 후 자동으로 다음 핸드 시작.
 * 액션 타임뱅크(TIMEBANK_MS) 마감 시 자동 체크/폴드. 액션마다 모든 접속자에게 정제된 상태 브로드캐스트.
 *
 * TODO(형섭) — 프로덕션까지 남은 것:
 *  1. 인증: join 의 token 검증 (JWT 등) → 유저 id/닉네임 확정
 *  2. 로비 + 다중 테이블/토너먼트, 매치메이킹
 *  3. 영속화(DB), 지갑/바이인, 레이크, 감사 로그(엔진 seed 저장)
 *  4. 서버 사이드 안티치트/레이트리밋
 *  5. 진짜 재접속(같은 유저로 복귀) — 인증 도입 후. 지금은 disconnect 시
 *     핸드 종료까지만 자리를 보존하고, 시간 내 재접속해도 같은 사람으로 알아보지 못한다.
 */
import { createServer } from "node:http";
import { Server } from "socket.io";
import type { Action } from "@holdem/poker-engine";
import { EVENTS } from "@holdem/shared";
import { Table } from "./table.js";

const PORT = Number(process.env.PORT ?? 4000);
const SHOWDOWN_DELAY_MS = 5000;
const NEXT_HAND_DELAY_MS = 3000;

const httpServer = createServer((_, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("holdem server ok\n");
});

const io = new Server(httpServer, { cors: { origin: "*" } });

// 단일 테이블 (TODO: 테이블 매니저로 확장)
const table = new Table("main", 10, 20);

/** 모든 접속자에게 각자 관점의 상태를 보낸다. */
function broadcastState(): void {
  for (const [, socket] of io.sockets.sockets) {
    socket.emit(EVENTS.state, table.publicState(socket.id));
  }
}

let nextHandTimer: NodeJS.Timeout | null = null;
let actionTimer: NodeJS.Timeout | null = null;

/** 핸드 종료 후 일정 시간 뒤 다음 핸드를 자동 시작한다. */
function scheduleNextHand(): void {
  if (nextHandTimer) clearTimeout(nextHandTimer);
  nextHandTimer = setTimeout(() => {
    nextHandTimer = null;
    if (table.maybeStartHand()) broadcastState();
    armActionTimer();
  }, NEXT_HAND_DELAY_MS);
}

/** 현재 액션 차례의 타임뱅크 마감에 맞춰 자동 체크/폴드 타이머를 (재)설정한다. */
function armActionTimer(): void {
  if (actionTimer) {
    clearTimeout(actionTimer);
    actionTimer = null;
  }
  const deadline = table.actionDeadline();
  if (deadline === null) return;
  actionTimer = setTimeout(() => {
    actionTimer = null;
    if (table.autoActTimedOutPlayer()) {
      broadcastState();
      handleHandProgress();
    }
  }, Math.max(0, deadline - Date.now()));
}

/** act() 이후 공통 처리: 쇼다운 대기면 지연 후 정산, 핸드가 끝났으면 다음 핸드 예약, 아니면 타임뱅크 재무장. */
function handleHandProgress(): void {
  if (table.isAwaitingShowdown()) {
    if (actionTimer) {
      clearTimeout(actionTimer);
      actionTimer = null;
    }
    setTimeout(() => {
      if (table.resolveShowdown()) {
        broadcastState();
        scheduleNextHand();
      }
    }, SHOWDOWN_DELAY_MS);
  } else if (!table.isActive()) {
    scheduleNextHand();
  } else {
    armActionTimer();
  }
}

io.on("connection", (socket) => {
  console.log(`[+] ${socket.id} connected`);
  // 접속 즉시 관전 상태 전송
  socket.emit(EVENTS.state, table.publicState(socket.id));

  socket.on(EVENTS.sit, (p: { seat: number; buyIn: number }) => {
    try {
      // TODO(형섭): buyIn 을 유저 지갑에서 검증/차감
      table.sit(p.seat, { seat: p.seat, id: shortId(socket.id), stack: p.buyIn, socketId: socket.id });
      if (table.maybeStartHand()) armActionTimer();
      broadcastState();
    } catch (e) {
      socket.emit(EVENTS.error, { code: "SIT_FAILED", message: msg(e) });
    }
  });

  socket.on(EVENTS.action, (p: { action: Action }) => {
    try {
      table.act(socket.id, p.action);
      broadcastState();
      handleHandProgress();
    } catch (e) {
      socket.emit(EVENTS.error, { code: "ACTION_FAILED", message: msg(e) });
    }
  });

  socket.on(EVENTS.leave, () => {
    table.leaveBySocket(socket.id);
    broadcastState();
  });

  socket.on("disconnect", () => {
    console.log(`[-] ${socket.id} disconnected`);
    table.leaveBySocket(socket.id);
    broadcastState();
  });
});

httpServer.listen(PORT, () => {
  console.log(`holdem server listening on :${PORT}`);
});

function shortId(s: string): string {
  return "guest" + s.slice(0, 5);
}
function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
