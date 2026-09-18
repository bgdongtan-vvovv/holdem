/**
 * Socket.IO 권위 서버 — 스켈레톤 (형섭 시작점).
 *
 * 실행:  npm run build   (packages 빌드 후)
 *        npm run dev -w @holdem/server
 *
 * 현재: TableManager 가 다중 테이블 + 로비/매치메이킹을 담당한다.
 * 접속하면 기본 테이블("main")에 자동 입장(하위 호환)해 관전, sit 으로 착석.
 * listTables/createTable/quickJoin 으로 로비에서 다른 테이블을 만들거나 옮겨 탈 수 있다.
 * 2명 이상 착석하면 핸드 시작. 핸드 종료 후 자동으로 다음 핸드 시작.
 * 액션 타임뱅크(TIMEBANK_MS) 마감 시 자동 체크/폴드. 액션마다 해당 테이블 접속자에게 정제된 상태 브로드캐스트.
 *
 * TODO(형섭) — 프로덕션까지 남은 것:
 *  1. 인증: join 의 token 검증 (JWT 등) → 유저 id/닉네임 확정
 *  2. ~~로비 + 다중 테이블/토너먼트, 매치메이킹~~ → TableManager 로 구현 (tableManager.ts).
 *     토너먼트(블라인드 레벨업/상금 구조)는 아직 미구현.
 *  3. 영속화(DB), 지갑/바이인, 레이크, 감사 로그(엔진 seed 저장)
 *  4. 서버 사이드 안티치트/레이트리밋
 *  5. 진짜 재접속(같은 유저로 복귀) — 인증 도입 후. 지금은 disconnect 시
 *     핸드 종료까지만 자리를 보존하고, 시간 내 재접속해도 같은 사람으로 알아보지 못한다.
 */
import { createServer } from "node:http";
import { Server } from "socket.io";
import type { Action } from "@holdem/poker-engine";
import { EVENTS } from "@holdem/shared";
import { TableManager } from "./tableManager.js";

const PORT = Number(process.env.PORT ?? 4000);
const MAIN_TABLE_ID = "main";

const httpServer = createServer((_, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("holdem server ok\n");
});

const io = new Server(httpServer, { cors: { origin: "*" } });

const tableManager = new TableManager(io);
// 기본 테이블 (하위 호환: 기존 클라이언트/스모크 테스트는 join 없이 바로 sit 해도 동작해야 함)
tableManager.createTable({ id: MAIN_TABLE_ID, smallBlind: 10, bigBlind: 20 });

io.on("connection", (socket) => {
  console.log(`[+] ${socket.id} connected`);
  // 접속 즉시 기본 테이블에 관전 입장
  tableManager.join(socket, MAIN_TABLE_ID);

  socket.on(EVENTS.listTables, () => {
    socket.emit(EVENTS.tables, tableManager.listTables());
  });

  socket.on(EVENTS.createTable, (p: { smallBlind: number; bigBlind: number }) => {
    try {
      const tableId = tableManager.createTable({ smallBlind: p.smallBlind, bigBlind: p.bigBlind });
      tableManager.join(socket, tableId);
    } catch (e) {
      socket.emit(EVENTS.error, { code: "CREATE_TABLE_FAILED", message: msg(e) });
    }
  });

  socket.on(EVENTS.quickJoin, (p: { smallBlind?: number; bigBlind?: number } = {}) => {
    try {
      const tableId = tableManager.findOrCreateTable(p);
      tableManager.join(socket, tableId);
    } catch (e) {
      socket.emit(EVENTS.error, { code: "QUICK_JOIN_FAILED", message: msg(e) });
    }
  });

  socket.on(EVENTS.join, (p: { tableId: string; token: string }) => {
    // TODO(형섭): p.token 검증(JWT 등) → 유저 id 확정
    try {
      tableManager.join(socket, p.tableId);
    } catch (e) {
      socket.emit(EVENTS.error, { code: "JOIN_FAILED", message: msg(e) });
    }
  });

  socket.on(EVENTS.sit, (p: { seat: number; buyIn: number }) => {
    try {
      tableManager.sit(socket, p.seat, p.buyIn);
    } catch (e) {
      socket.emit(EVENTS.error, { code: "SIT_FAILED", message: msg(e) });
    }
  });

  socket.on(EVENTS.action, (p: { action: Action }) => {
    try {
      tableManager.act(socket, p.action);
    } catch (e) {
      socket.emit(EVENTS.error, { code: "ACTION_FAILED", message: msg(e) });
    }
  });

  socket.on(EVENTS.leave, () => {
    tableManager.leave(socket);
  });

  socket.on("disconnect", () => {
    console.log(`[-] ${socket.id} disconnected`);
    tableManager.handleDisconnect(socket);
  });
});

httpServer.listen(PORT, () => {
  console.log(`holdem server listening on :${PORT}`);
});

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
