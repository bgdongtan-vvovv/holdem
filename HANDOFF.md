# 온라인 멀티플레이어 핸드오프 (담당: 형섭)

이 문서는 **온라인 실시간 멀티플레이어**를 이어받는 형섭님을 위한 안내입니다.
게임 자체(엔진 · 앱 UI · 디자인 · 사운드)는 데이비드가 만들었고, **서버 연동**만 남았습니다.

## 이미 되어 있는 것

| 영역 | 위치 | 상태 |
|------|------|------|
| 게임 룰 엔진 | `packages/poker-engine` | ✅ 완성 · 25 테스트 통과. 셔플/족보/베팅/사이드팟/쇼다운 |
| 소켓 프로토콜(계약) | `packages/shared` | ✅ 타입 정의 완료 |
| 서버 스켈레톤 | `apps/server` | 🟡 단일 테이블 참조 구현 (스모크 테스트 통과). 프로덕션 기능은 TODO |
| 모바일 앱 | `apps/mobile` | ✅ 로그인/로비/게임 화면 + 로컬 봇 데모 |

## 아키텍처 (권위 서버)

```
[모바일 앱] --(EVENTS.sit / EVENTS.action)--> [서버]
[모바일 앱] <--(EVENTS.state: 홀카드 가려진 PublicTableState)-- [서버]
                                                  |
                                          [poker-engine] (셔플·딜·판정은 서버에서만)
```

- **절대 원칙**: 카드는 서버만 안다. 클라이언트는 자기 홀카드만 수신 → 치팅 불가.
- 클라이언트는 "의도(Action)"만 보내고, 서버가 검증 후 상태를 브로드캐스트.

## 계약 (packages/shared/src/protocol.ts)

- `ClientToServer`: `join`, `sit`, `leave`, `action`, `chat`
- `ServerToClient`: `state`, `handResult`, `error`, `chat`
- `PublicTableState`: 뷰어 관점 상태. `players[].holeCards` 는 본인/쇼다운만 채워짐.
- `PublicLegalActions`: 뷰어 차례일 때만 채워짐(베팅 UI 활성화).

## 실행 & 검증

```bash
npm install
npm run build -w @holdem/poker-engine -w @holdem/shared   # 패키지 빌드
npm run dev -w @holdem/server                              # 서버 (:4000)
npx tsx apps/server/examples/smoke-client.ts              # 2인 접속 스모크 테스트
```

스모크 테스트는 두 클라이언트를 앉히고 프리플랍~쇼다운까지 자동 진행하며,
**각자 자기 홀카드만 보이는지**까지 확인합니다.

## 형섭 TODO (프로덕션까지)

서버(`apps/server/src/`)와 계약에 `TODO(형섭)` 주석으로 지점을 표시해 뒀습니다.

1. **인증** — `join` 의 `token` 검증(JWT 등), 유저 id/닉네임/지갑 연결
2. **로비 + 다중 테이블 / 토너먼트** — `Table` 을 `TableManager` 로 확장, 매치메이킹
3. **액션 타임뱅크** — 미행동 시 자동 폴드/체크 타이머, `PublicLegalActions.deadline` 채우기
4. **핸드 라이프사이클** — 종료 후 다음 핸드 자동 시작·버튼 이동·sit-out·재접속
5. **영속화/지갑** — DB, 바이인·정산, 레이크, 감사 로그(엔진 `seed` 저장으로 핸드 재현)
6. **안티치트/레이트리밋**

## 클라이언트 교체 지점

앱은 현재 `apps/mobile/src/game/useLocalTable.ts`(로컬 봇)로 돌아갑니다.
온라인은 같은 반환 모양의 `useRemoteTable.ts`(스텁 있음)를 구현해 `GameScreen` 의
import 만 바꾸면 됩니다. 화면·디자인·사운드는 그대로 재사용됩니다.
```

GameScreen.tsx:
-  import { useLocalTable } from "../game/useLocalTable";
+  import { useRemoteTable } from "../game/useRemoteTable";
```
