/**
 * ⚠️ 스텁 (형섭 구현 지점) — 온라인 멀티플레이어용.
 *
 * 이 훅은 useLocalTable 과 "같은 모양"을 반환해야 한다. 그래야 화면(GameScreen,
 * PokerTable, ActionBar)을 하나도 안 고치고 로컬 → 온라인으로 교체할 수 있다.
 *
 * 구현 개요:
 *   - socket.io-client 로 서버(@holdem/server)에 접속
 *   - EVENTS.state 수신 → PublicTableState 를 화면이 쓰는 모양으로 매핑
 *   - act(action) → socket.emit(EVENTS.action, { action })
 *   - 서버가 홀카드를 가려서 주므로, 로컬 엔진처럼 전체 HandState 를 만들 필요 없음
 *
 * 교체 방법: GameScreen 에서 useLocalTable → useRemoteTable 로 import 만 바꾸면 됨.
 * (단, 반환 타입을 PublicTableState 기반으로 맞추는 얇은 어댑터가 필요할 수 있음)
 */
import type { PublicTableState } from "@holdem/shared";

export interface RemoteTableOptions {
  serverUrl: string;
  token: string;
  tableId: string;
}

export function useRemoteTable(_options: RemoteTableOptions): {
  state: PublicTableState | null;
  act: (action: import("@holdem/shared").Action) => void;
  sit: (seat: number, buyIn: number) => void;
} {
  // TODO(형섭):
  // const socketRef = useRef<Socket>();
  // useEffect(() => { const s = io(serverUrl, { auth: { token } }); ... }, []);
  // socket.on(EVENTS.state, setState);
  throw new Error("useRemoteTable 미구현 — 형섭 담당 (온라인 멀티플레이어)");
}
