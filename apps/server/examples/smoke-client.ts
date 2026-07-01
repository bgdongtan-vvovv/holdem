/**
 * 스모크 테스트 겸 클라이언트 예제 (형섭 참고용).
 * 두 클라이언트를 접속시켜 착석 → 핸드 시작 → 상태 수신을 확인한다.
 *
 * 실행:  npm run dev -w @holdem/server   (다른 터미널에서 서버 먼저)
 *        npx tsx apps/server/examples/smoke-client.ts
 */
import { io } from "socket.io-client";
import { EVENTS, type PublicTableState } from "@holdem/shared";

const URL = process.env.URL ?? "http://localhost:4000";

function connect(name: string, seat: number) {
  const socket = io(URL, { transports: ["websocket"] });
  socket.on("connect", () => {
    console.log(`[${name}] connected ${socket.id}`);
    socket.emit(EVENTS.sit, { seat, buyIn: 2000 });
  });
  socket.on(EVENTS.state, (s: PublicTableState) => {
    const me = s.players.find((p) => p.holeCards);
    console.log(
      `[${name}] street=${s.street} pot=${s.pot} acting=${s.actingSeat}` +
        (me ? ` myCards=${me.holeCards!.map((c) => c.rank + c.suit).join(",")}` : "") +
        (s.legal ? `  <-- 내 차례 (call=${s.legal.callAmount})` : ""),
    );
    // 내 차례면 콜/체크로 자동 진행
    if (s.legal) {
      const action = s.legal.canCheck ? { type: "check" as const } : { type: "call" as const };
      setTimeout(() => socket.emit(EVENTS.action, { action }), 200);
    }
  });
  socket.on(EVENTS.error, (e) => console.log(`[${name}] ERROR`, e));
  return socket;
}

connect("A", 0);
setTimeout(() => connect("B", 3), 400);

setTimeout(() => {
  console.log("smoke test done");
  process.exit(0);
}, 6000);
