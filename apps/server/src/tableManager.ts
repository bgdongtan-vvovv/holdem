/**
 * TableManager — 로비 + 다중 테이블 / 간단한 매치메이킹 (형섭 TODO 2).
 *
 * 단일 Table 참조 구현(table.ts)을 여러 개 동시에 운영하도록 감싼다.
 *  - 테이블 생성/조회/목록(로비)
 *  - 소켓을 테이블(Socket.IO room)에 입장/퇴장시키고, 각자 관점의 상태를 전송
 *  - 매치메이킹: 원하는 스테이크에 빈자리 있는 테이블을 찾거나 없으면 새로 만든다
 *  - 테이블별 핸드 진행(자동 다음 핸드 시작, 액션 타임뱅크, 쇼다운 정산) 스케줄링
 *
 * 소켓 이벤트 라우팅(index.ts)이 이 클래스의 메서드를 호출하는 얇은 어댑터가 되도록 설계했다.
 *
 * TODO(형섭):
 *  - 토너먼트(레벨업 블라인드, 탈락자 정리, 상금 구조)는 아직 없음 — 링게임 매치메이킹만 구현.
 *  - join 의 token 검증은 여전히 TODO(형섭) #1 — 여기서는 그대로 통과시킨다.
 */
import type { Server, Socket } from "socket.io";
import type { Action } from "@holdem/poker-engine";
import { EVENTS, type TableSummary } from "@holdem/shared";
import { BOT_SOCKET_PREFIX, Table } from "./table.js";

const SHOWDOWN_DELAY_MS = 5000;
const NEXT_HAND_DELAY_MS = 3000;
const DEFAULT_SMALL_BLIND = 10;
const DEFAULT_BIG_BLIND = 20;
/** 사람이 혼자 접속해도 바로 테스트할 수 있도록 채워 넣을 최소 인원. */
const MIN_OCCUPANTS_FOR_TESTING = 2;
const BOT_ACT_DELAY_MIN_MS = 600;
const BOT_ACT_DELAY_MAX_MS = 1400;
const BOT_NAMES = ["봇영수", "봇하나", "봇두리", "봇세찌", "봇네모"];

interface ManagedTable {
  table: Table;
  nextHandTimer: NodeJS.Timeout | null;
  actionTimer: NodeJS.Timeout | null;
}

export class TableManager {
  private readonly io: Server;
  private readonly tables = new Map<string, ManagedTable>();
  /** socketId -> 현재 입장해 있는 tableId. */
  private readonly socketTable = new Map<string, string>();
  private tableSeq = 1;
  private botSeq = 1;

  constructor(io: Server) {
    this.io = io;
  }

  // ── 로비 ────────────────────────────────────────────────────────────────

  listTables(): TableSummary[] {
    return [...this.tables.values()].map(({ table }) => table.summary());
  }

  /** 새 테이블을 만든다 (id 미지정 시 자동 발급). 반환: tableId. */
  createTable(opts: { smallBlind?: number; bigBlind?: number; id?: string } = {}): string {
    const id = opts.id ?? `table-${this.tableSeq++}`;
    if (this.tables.has(id)) throw new Error("이미 존재하는 테이블 id");
    const table = new Table(id, opts.smallBlind ?? DEFAULT_SMALL_BLIND, opts.bigBlind ?? DEFAULT_BIG_BLIND);
    this.tables.set(id, { table, nextHandTimer: null, actionTimer: null });
    this.broadcastLobby();
    return id;
  }

  /**
   * 매치메이킹: 조건(스테이크)에 맞고 빈 자리가 있는 테이블을 찾아 반환.
   * 없으면 새로 만든다. 간단한 "가장 먼저 찾은 자리" 방식(FIFO)이며,
   * 토너먼트/좌석 밸런싱 등은 TODO.
   */
  findOrCreateTable(opts: { smallBlind?: number; bigBlind?: number } = {}): string {
    const smallBlind = opts.smallBlind ?? DEFAULT_SMALL_BLIND;
    const bigBlind = opts.bigBlind ?? DEFAULT_BIG_BLIND;
    for (const [id, mt] of this.tables) {
      if (mt.table.smallBlind === smallBlind && mt.table.bigBlind === bigBlind && !mt.table.isFull()) {
        return id;
      }
    }
    return this.createTable({ smallBlind, bigBlind });
  }

  // ── 입장/퇴장 ────────────────────────────────────────────────────────────

  /** socket 을 tableId 방(room)에 입장시키고 상태를 전송한다. 기존 테이블에 있었으면 먼저 내보낸다. */
  join(socket: Socket, tableId: string): void {
    const managed = this.tables.get(tableId);
    if (!managed) throw new Error("존재하지 않는 테이블");
    if (this.socketTable.get(socket.id) === tableId) {
      socket.emit(EVENTS.joined, { tableId });
      this.broadcastStateTo(socket, managed);
      return;
    }
    this.leave(socket);
    socket.join(tableId);
    this.socketTable.set(socket.id, tableId);
    socket.emit(EVENTS.joined, { tableId });
    this.broadcastTableState(tableId);
  }

  /** 현재 입장해 있는 테이블에서 나간다 (착석 중이었으면 자리도 정리). */
  leave(socket: Socket): void {
    const tableId = this.socketTable.get(socket.id);
    if (!tableId) return;
    const managed = this.tables.get(tableId);
    socket.leave(tableId);
    this.socketTable.delete(socket.id);
    if (!managed) return;
    managed.table.leaveBySocket(socket.id);
    this.broadcastTableState(tableId);
    this.cleanupIfEmpty(tableId);
    this.broadcastLobby();
  }

  handleDisconnect(socket: Socket): void {
    this.leave(socket);
  }

  // ── 게임 액션 (현재 입장한 테이블로 라우팅) ─────────────────────────────────

  sit(socket: Socket, seat: number, buyIn: number): void {
    const managed = this.requireManaged(socket);
    // TODO(형섭): buyIn 을 유저 지갑에서 검증/차감
    managed.table.sit(seat, { seat, id: shortId(socket.id), stack: buyIn, socketId: socket.id });
    this.fillWithBotsForTesting(managed, buyIn);
    // 이미 핸드가 진행 중이면 여기서 다시 arm 하지 않는다 — 현재 액션 차례의
    // 타임뱅크를 다른 사람이 앉았다는 이유로 리셋해버리면 안 되기 때문.
    const startedFreshHand = managed.table.maybeStartHand();
    this.broadcastTableState(managed.table.id);
    this.broadcastLobby();
    if (startedFreshHand) this.handleHandProgress(managed);
  }

  /**
   * 사람이 혼자 앉아도 바로 핸드를 테스트할 수 있도록, 최소 인원이 될 때까지
   * 봇 occupant 를 빈 좌석에 채운다. 실제 토너먼트/매치메이킹 밸런싱과는 무관한
   * 개발/테스트 편의 기능이다.
   */
  private fillWithBotsForTesting(managed: ManagedTable, buyIn: number): void {
    while (managed.table.occupantCount() < MIN_OCCUPANTS_FOR_TESTING) {
      const seat = managed.table.firstOpenSeat();
      if (seat === null) break;
      const name = BOT_NAMES[(this.botSeq - 1) % BOT_NAMES.length]!;
      const socketId = `${BOT_SOCKET_PREFIX}${this.botSeq++}`;
      managed.table.sit(seat, { seat, id: name, stack: buyIn, socketId });
    }
  }

  act(socket: Socket, action: Action): void {
    const managed = this.requireManaged(socket);
    managed.table.act(socket.id, action);
    this.broadcastTableState(managed.table.id);
    this.handleHandProgress(managed);
  }

  private requireManaged(socket: Socket): ManagedTable {
    const tableId = this.socketTable.get(socket.id);
    const managed = tableId ? this.tables.get(tableId) : undefined;
    if (!managed) throw new Error("테이블에 입장하지 않음");
    return managed;
  }

  private cleanupIfEmpty(tableId: string): void {
    const managed = this.tables.get(tableId);
    if (!managed || managed.table.occupantCount() > 0) return;
    if (tableId === "main") return; // 기본 테이블은 항상 유지 (하위 호환)
    if (managed.nextHandTimer) clearTimeout(managed.nextHandTimer);
    if (managed.actionTimer) clearTimeout(managed.actionTimer);
    this.tables.delete(tableId);
  }

  // ── 브로드캐스트 ─────────────────────────────────────────────────────────

  private broadcastStateTo(socket: Socket, managed: ManagedTable): void {
    socket.emit(EVENTS.state, managed.table.publicState(socket.id));
  }

  /** tableId 방에 있는 모든 소켓에게 각자 관점의 상태를 보낸다. */
  private broadcastTableState(tableId: string): void {
    const managed = this.tables.get(tableId);
    if (!managed) return;
    const room = this.io.sockets.adapter.rooms.get(tableId);
    if (!room) return;
    for (const socketId of room) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) this.broadcastStateTo(socket, managed);
    }
  }

  /** 접속한 모든 소켓에게 최신 로비 테이블 목록을 보낸다. */
  private broadcastLobby(): void {
    this.io.emit(EVENTS.tables, this.listTables());
  }

  // ── 핸드 진행 스케줄링 (테이블별) ────────────────────────────────────────

  private scheduleNextHand(managed: ManagedTable): void {
    if (managed.nextHandTimer) clearTimeout(managed.nextHandTimer);
    managed.nextHandTimer = setTimeout(() => {
      managed.nextHandTimer = null;
      if (managed.table.maybeStartHand()) this.broadcastTableState(managed.table.id);
      this.handleHandProgress(managed);
    }, NEXT_HAND_DELAY_MS);
  }

  private armActionTimer(managed: ManagedTable): void {
    if (managed.actionTimer) {
      clearTimeout(managed.actionTimer);
      managed.actionTimer = null;
    }
    const deadline = managed.table.actionDeadline();
    if (deadline === null) return;
    managed.actionTimer = setTimeout(() => {
      managed.actionTimer = null;
      if (managed.table.autoActTimedOutPlayer()) {
        this.broadcastTableState(managed.table.id);
        this.handleHandProgress(managed);
      }
    }, Math.max(0, deadline - Date.now()));
  }

  private handleHandProgress(managed: ManagedTable): void {
    if (managed.table.isAwaitingShowdown()) {
      if (managed.actionTimer) {
        clearTimeout(managed.actionTimer);
        managed.actionTimer = null;
      }
      setTimeout(() => {
        if (managed.table.resolveShowdown()) {
          this.broadcastTableState(managed.table.id);
          this.scheduleNextHand(managed);
        }
      }, SHOWDOWN_DELAY_MS);
    } else if (!managed.table.isActive()) {
      this.scheduleNextHand(managed);
    } else {
      this.armActionTimer(managed);
      this.maybeActBot(managed);
    }
  }

  // ── 테스트용 봇 자동 액션 ────────────────────────────────────────────────

  /**
   * 지금 액션 차례가 봇이면 잠시 뒤 대신 액션한다. 매 호출마다 실행 시점의
   * 실제 상태(actingIsBot/currentLegalActions)를 다시 읽으므로, 여러 경로에서
   * 중복 호출돼도 안전하다 — 그 사이 사람이 먼저 액션했으면 조용히 아무것도 안 한다.
   */
  private maybeActBot(managed: ManagedTable): void {
    if (!managed.table.actingIsBot()) return;
    const delay = BOT_ACT_DELAY_MIN_MS + Math.random() * (BOT_ACT_DELAY_MAX_MS - BOT_ACT_DELAY_MIN_MS);
    setTimeout(() => {
      if (!managed.table.actingIsBot()) return;
      const action = this.decideBotAction(managed.table);
      if (!action) return;
      managed.table.botAct(action);
      this.broadcastTableState(managed.table.id);
      this.handleHandProgress(managed);
    }, delay);
  }

  /** 아주 단순한 봇 정책: 체크 가능하면 체크, 아니면 콜. 레이즈/폴드는 하지 않아 핸드가 항상 끝까지 진행된다. */
  private decideBotAction(table: Table): Action | null {
    const la = table.currentLegalActions();
    if (!la) return null;
    if (la.canCheck) return { type: "check" };
    if (la.canCall) return { type: "call" };
    return { type: "fold" };
  }
}

function shortId(s: string): string {
  return "guest" + s.slice(0, 5);
}
