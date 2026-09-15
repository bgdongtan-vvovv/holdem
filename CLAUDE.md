# CLAUDE.md — holdem

실시간 멀티플레이어 텍사스 홀덤(AA Poker 스타일), 모바일 우선. TypeScript 모노레포.

> 배경·설계·로드맵은 [README.md](README.md), 온라인 서버 작업 인수인계는
> [HANDOFF.md](HANDOFF.md) 에 상세히 있음. 이 문서는 작업 시 빠른 참조용.

## 구조 (npm workspaces)

```
packages/
  poker-engine/  순수 TS 룰 엔진 (셔플·족보·베팅·사이드팟·쇼다운). vitest 25 테스트
  shared/        서버↔클라 공유 타입 / 소켓 프로토콜 (src/protocol.ts)
apps/
  server/        Node + Socket.IO 권위 서버 (ESM, tsx). 포트 :4000
  mobile/        Expo(React Native 0.74) 클라이언트. 로그인/로비/게임 3화면
```

의존: `shared`·`server`·`mobile` → `poker-engine`.
`@holdem/*` 워크스페이스는 서로 `dist/` 를 참조하므로 **패키지 먼저 빌드**해야 함.

## 필수 명령

```bash
npm install                 # 루트에서 1회 (워크스페이스 전체 설치)
npm run test:engine         # 엔진 테스트 (vitest)
npm run build               # 전체 워크스페이스 빌드
npm run dev:server          # 서버 (tsx watch)
npm run dev:mobile          # Expo 앱  (= cd apps/mobile && expo start)
```

로컬 개발/검증 (HANDOFF 기준):
```bash
npm run build -w @holdem/poker-engine -w @holdem/shared   # 먼저 패키지 빌드
npm run dev -w @holdem/server                             # 서버 실행
npx tsx apps/server/examples/smoke-client.ts              # 2인 접속 스모크 테스트
```

## 요구 환경

- **Node.js ≥ 20** (`engines`)
- 모바일 실행엔 **Expo** — 실기기는 Expo Go 앱(QR), 웹 미리보기는 `expo start --web`
- 별도 DB/환경변수 없음(현재). 온라인 영속화는 미구현(HANDOFF TODO)

## 핵심 규칙 / 컨벤션

- **권위 서버 원칙**: 셔플·딜·족보 판정은 **서버에서만**. 클라는 자기 홀카드만 수신 →
  치팅 방지. 카드 정보를 클라로 새어보내지 말 것.
- **엔진/전송 분리**: `poker-engine` 은 네트워크를 몰라야 함(순수 로직 + 단위 테스트).
- 전 패키지 **ESM**(`"type":"module"`) + **TypeScript**. import 확장자·tsconfig 주의.
- 워크스페이스 간 의존은 버전 `"*"` 로 링크됨.

## 자주 건드리는 지점

- 소켓 계약: `packages/shared/src/protocol.ts`
  (`ClientToServer`, `ServerToClient`, `PublicTableState`, `PublicLegalActions`)
- 서버 로직·미완성 지점: `apps/server/src/` 의 `TODO(형섭)` 주석
- 클라 데이터 소스 교체: `apps/mobile/src/game/useLocalTable.ts`(로컬 봇) ↔
  `useRemoteTable.ts`(온라인 스텁). `GameScreen` 의 import 만 교체하면 화면·사운드 재사용

## 현재 상태

게임(엔진·앱·디자인·사운드)·소켓 계약·서버 스켈레톤 완료.
**남은 것: 온라인 멀티플레이어 서버 프로덕션화** (인증·다중테이블·타임뱅크·핸드
라이프사이클·영속화/지갑·안티치트) — 자세한 TODO는 HANDOFF.md 참조.

## 멀티에이전트 워크플로우 (Orca)

작업 배분(에이전트 호출) 전에 반드시 읽을 것:

- [`ORCA_DEV_WORKFLOW.md`](ORCA_DEV_WORKFLOW.md) — 프로젝트 운영 규칙 (Astra=비주얼 / Claude=프론트 아키텍처 / Codex=구현, 에스컬레이션·크레딧 절약)
- [`.claude/skills/visual-first-multi-agent-development/SKILL.md`](.claude/skills/visual-first-multi-agent-development/SKILL.md) — 재사용 스킬 (에이전트 역할·에스컬레이션 규칙)
- 팩 설명: [`docs/ORCA_SKILLPACK_README.md`](docs/ORCA_SKILLPACK_README.md)

정책: **Codex가 기본 구현 에이전트.** Astra는 비주얼 생성/리뷰, Claude는 복잡한 프론트 아키텍처/인터랙션, Gemini는 대용량 컨텍스트 리서치/분석(코드베이스 전체 서베이, 긴 문서·로그 요약)에만 호출 — 결과는 리서치 브리프로 Claude/Codex에 전달.
Astra/Claude 에스컬레이션 전에 확정된 결정 로그(`docs/DESIGN_SYSTEM.md`, `docs/FRONTEND_ARCHITECTURE.md`)를 먼저 확인해 재사용.
(위 두 결정 로그는 아직 이 모바일 코드 기준으로는 미작성 — 필요 시 생성.)
