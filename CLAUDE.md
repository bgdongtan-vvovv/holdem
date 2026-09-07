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
