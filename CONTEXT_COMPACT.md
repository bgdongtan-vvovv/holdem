# Holdem Game 압축 컨텍스트

최종 갱신: 2026-07-22

## 현재 목표

모바일 앱용 홀덤 게임을 세로 화면 기준으로 고도화 중입니다.  
웹 브라우저 테스트는 가능하지만 최종 방향은 Android APK / 앱 실행 환경입니다.

## 사용자 선호 / 작업 원칙

- 사용자는 한국어 존댓말을 원합니다.
- 테스트 중에는 커밋/푸시 금지.
- 사용자가 명확히 “커밋”, “푸시”라고 말하기 전까지 GitHub에 올리지 않습니다.
- UI는 한게임/피망/풀팟류 모바일 포커 테이블처럼 세로형 테이블을 꽉 쓰는 방향입니다.
- 브라우저 주소창 때문에 모바일 웹은 화면이 좁아지므로 APK 또는 PWA/앱 래핑 방향을 검토 중입니다.

## 주요 프로젝트 경로

- 프로젝트 루트: `/Users/davidkingair/Documents/New project/holdem-game`
- 모바일 앱: `/Users/davidkingair/Documents/New project/holdem-game/apps/mobile`
- 핵심 테이블 컴포넌트: `/Users/davidkingair/Documents/New project/holdem-game/apps/mobile/src/components/PokerTable.tsx`
- 좌석 컴포넌트: `/Users/davidkingair/Documents/New project/holdem-game/apps/mobile/src/components/TableSeat.tsx`
- 아바타: `/Users/davidkingair/Documents/New project/holdem-game/apps/mobile/src/components/Avatar.tsx`
- 게임 화면: `/Users/davidkingair/Documents/New project/holdem-game/apps/mobile/src/screens/GameScreen.tsx`
- 금액 포맷: `/Users/davidkingair/Documents/New project/holdem-game/apps/mobile/src/formatMoney.ts`

## 최근 반영된 주요 사항

- 9인 테이블 기준으로 좌석 배치 변경.
- 금액 표기에서 `만원` 제거, 숫자만 표시.
- 테이블 배경은 `fanal_table.png` 사용.
- 카드 이미지는 사용자가 제공한 52장 + 뒷면 PNG 사용.
- 신규 아바타 3종 추가.
- 팟 배경 그림자는 제거하고 칩만 돋보이게 조정.
- 공용 카드는 새 카드가 열릴 때 기존 카드가 좌우로 밀리지 않게 고정 시작 위치로 변경.
- 최근 조정:
  - 공용 카드 위치를 위로 올려 로얄킹 카드와 충돌을 줄임.
  - 데이비드 개인 카드는 살짝 아래로 내려 아바타와 너무 멀어 보이지 않게 조정.

## 현재 사용 중인 빌드/검증 명령

프로젝트 루트에서:

```bash
npm run typecheck -w @holdem/mobile
```

모바일 앱 폴더에서:

```bash
CI=1 EXPO_NO_DOCTOR=1 npx expo export --platform web --output-dir dist
```

정적 로컬 서버 예시:

```bash
python3 -m http.server 8082 --bind 127.0.0.1
```

실행 위치:

```bash
/Users/davidkingair/Documents/New project/holdem-game/apps/mobile/dist
```

외부 공유용 임시 터널 예시:

```bash
npx cloudflared tunnel --url http://127.0.0.1:8082
```

## 최근 검증 상태

- `npm run typecheck -w @holdem/mobile` 통과.
- `CI=1 EXPO_NO_DOCTOR=1 npx expo export --platform web --output-dir dist` 완료.
- 커밋/푸시는 하지 않음.

## 현재 남아있는 UI 이슈

- 9인 테이블에서 좌우 플레이어 카드와 공용 카드/플레이어 패널 간 간섭을 계속 미세 조정 중.
- 하단 데이비드 좌석이 액션바와 겹치지 않도록 계속 확인 필요.
- 모바일 브라우저에서는 주소창/하단바 때문에 화면이 줄어들어 실제 앱/APK 테스트가 필요.
- 칩 스택은 “같은 금액/같은 색은 같은 스택에 쌓고, 다른 금액은 새 스택” 방향이지만 자연스러운 물리 배치가 아직 고도화 대상.
- 사운드는 브라우저 자동재생 정책 때문에 모바일 웹에서 안 날 수 있음. 앱 환경에서는 사용자 터치 후 오디오 unlock 또는 네이티브 오디오 처리가 필요.

## 현재 사용자 요구의 흐름

마지막 UI 요구:

- 공용 카드가 너무 낮아 로얄킹과 부딪히는 문제 수정.
- 데이비드 개인 카드가 아바타와 너무 떨어져 있어 살짝 낮춤.

이 내용은 반영 후 타입체크와 웹 export까지 완료했습니다.

## 주의

사용자가 명령하기 전에는 절대 커밋/푸시하지 마세요.

