/**
 * 로비 / 다중 테이블 / 매치메이킹 스모크 테스트 (TableManager 검증용).
 *
 * 시나리오:
 *  1) A 접속 → listTables (기본 "main" 테이블이 보여야 함)
 *  2) A 가 createTable 로 새 테이블을 만들고 자동 입장
 *  3) B, C 가 같은 스테이크로 quickJoin → A 가 만든 테이블에 매치메이킹되어야 함
 *     (원한다면 seat 로 착석까지 확인)
 *  4) D 가 quickJoin (A/B/C 테이블이 가득 차지 않았으면 합류, 가득 찼으면 새 테이블 자동 생성)
 *  5) A 가 leave 후 listTables 로 좌석 수 갱신 확인
 *
 * 실행:  npm run dev -w @holdem/server   (다른 터미널에서 서버 먼저)
 *        npx tsx apps/server/examples/lobby-smoke-client.ts
 */
import { io } from "socket.io-client";
import { EVENTS, type PublicTableState, type TableSummary } from "@holdem/shared";

const URL = process.env.URL ?? "http://localhost:4000";

function log(name: string, ...args: unknown[]) {
  console.log(`[${name}]`, ...args);
}

const a = io(URL, { transports: ["websocket"] });

a.on("connect", () => {
  log("A", "connected", a.id);
  a.emit(EVENTS.listTables);
});

a.on(EVENTS.tables, (list: TableSummary[]) => {
  log("A", "tables:", list.map((t) => `${t.tableId}(${t.occupiedSeats}/${t.seatCount})`).join(", "));
});

a.on(EVENTS.joined, (p: { tableId: string }) => log("A", "joined", p.tableId));

let createdTableId: string | null = null;

setTimeout(() => {
  log("A", "createTable smallBlind=25 bigBlind=50");
  a.emit(EVENTS.createTable, { smallBlind: 25, bigBlind: 50 });
}, 300);

a.on(EVENTS.state, (s: PublicTableState) => {
  if (s.tableId !== "main" && createdTableId === null) {
    createdTableId = s.tableId;
    log("A", "now seeing state for created table", s.tableId, "stakes", s.stakes);
    a.emit(EVENTS.sit, { seat: 0, buyIn: 2500 });
  }
});

function connectAndQuickJoin(name: string, delayMs: number, seat: number) {
  setTimeout(() => {
    const socket = io(URL, { transports: ["websocket"] });
    let seated = false;
    socket.on("connect", () => {
      log(name, "connected", socket.id, "-> quickJoin(25/50)");
      // 접속 시 서버가 기본("main") 테이블에 자동 입장시키므로, quickJoin 이 실제
      // 매치메이킹한 테이블로 다시 입장할 때까지는 착석하지 않는다.
      socket.emit(EVENTS.quickJoin, { smallBlind: 25, bigBlind: 50 });
    });
    socket.on(EVENTS.joined, (p: { tableId: string }) => {
      if (p.tableId === "main" || seated) return;
      seated = true;
      log(name, "matchmade into", p.tableId, p.tableId === createdTableId ? "(= A의 테이블, 매치메이킹 성공)" : "(다른 테이블)");
      socket.emit(EVENTS.sit, { seat, buyIn: 2500 });
    });
    socket.on(EVENTS.state, (s: PublicTableState) => {
      const me = s.players.find((p) => p.holeCards);
      if (me) {
        log(
          name,
          `street=${s.street} pot=${s.pot} acting=${s.actingSeat} myCards=${me.holeCards!.map((c) => c.rank + c.suit).join(",")}` +
            (s.legal ? "  <-- 내 차례" : ""),
        );
        if (s.legal) {
          const action = s.legal.canCheck ? { type: "check" as const } : { type: "call" as const };
          setTimeout(() => socket.emit(EVENTS.action, { action }), 150);
        }
      }
    });
    socket.on(EVENTS.error, (e) => log(name, "ERROR", e));
  }, delayMs);
}

connectAndQuickJoin("B", 800, 1);
connectAndQuickJoin("C", 1200, 2);

setTimeout(() => {
  log("A", "leave");
  a.emit(EVENTS.leave);
  a.emit(EVENTS.listTables);
}, 4000);

setTimeout(() => {
  console.log("lobby smoke test done");
  process.exit(0);
}, 9000);
