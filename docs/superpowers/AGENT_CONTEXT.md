# SSun Game — 에이전트 공용 컨텍스트 (모든 작업 에이전트 필독)

프로젝트 루트: /Volumes/PROGRAM/Projects/holdem  (TypeScript npm workspaces 모노레포)
계획서: docs/superpowers/plans/2026-09-03-ssun-game-responsive-table.md  ← 담당 Task 섹션을 반드시 먼저 읽을 것
스펙:   docs/superpowers/specs/2026-09-03-ssun-game-platform-design.md
빠른 참조: CLAUDE.md, CONTEXT_COMPACT.md

## 절대 규칙
1. git commit / git push 금지. git stash, checkout, reset 등 작업트리를 바꾸는 git 명령도 금지. (사용자가 명시적으로 요청할 때만 커밋)
2. 계획서의 담당 Task 에 명시된 파일만 생성/수정한다. 다른 파일은 읽기만 한다. 다른 에이전트가 동시에 다른 파일을 수정 중이다.
3. 기존 사용자 변경사항(uncommitted diff)을 보존한다. 파일을 통째로 덮어쓰지 말고 targeted edit 을 사용한다.
4. TDD: 계획서에 테스트 파일이 있으면 테스트를 먼저 작성 → 실패 확인 → 구현 → 통과.
5. 브랜드명은 SSun Game. KPL, WSOP, GGPoker, Prime Poker 표기 금지. 외부 로고/캐릭터/원화 복사 금지.
6. 사용자 문구는 한국어, 문자열은 apps/mobile/src/brand/copy.ko.ts 에 모은다(필요하면 키 추가).
7. 모든 패키지는 ESM + TypeScript. React Native 0.74 / Expo SDK 51 / React 18.2.
8. .worktrees/ 디렉터리는 건드리지 않는다. 볼륨이 exFAT 이라 `._*` AppleDouble 파일이 생기는데 무시한다(테스트는 `--exclude '**/._*'` 로 이미 제외됨). 새 파일을 만든 뒤 `find <dir> -name '._*' -delete` 로 정리해도 좋다.
9. 작업 완료 전 반드시 실행하고 결과를 보고한다:
   npm run test -w @holdem/mobile
   npm run typecheck -w @holdem/mobile
   (엔진을 건드렸다면) npm run test:engine

## 핵심 파일
- 테이블 UI: apps/mobile/src/components/PokerTable.tsx, TableSeat.tsx, ActionBar.tsx, Avatar.tsx, PlayingCard.tsx, Chip.tsx
- 화면: apps/mobile/src/screens/GameScreen.tsx, LobbyScreen.tsx, LoginScreen.tsx, apps/mobile/App.tsx
- 브랜드: apps/mobile/src/brand/tokens.ts, copy.ko.ts (Task 1 완료됨)
- 게임 상태 훅: apps/mobile/src/game/useLocalTable.ts (변경 금지, 반환 모양 유지)
- 엔진: packages/poker-engine (변경 금지)
- 테마: apps/mobile/src/theme.ts

## 완료 보고 형식
- 생성/수정한 파일 목록(절대경로)
- 실행한 검증 명령과 실제 출력 요약(테스트 수, 통과/실패)
- 계획서 대비 미완료 항목 또는 의도적으로 벗어난 점과 이유
- 후속 Task 가 사용할 export 인터페이스 요약
