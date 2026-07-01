# Holdem

AA Poker 스타일의 실시간 멀티플레이어 텍사스 홀덤 — 모바일 앱 우선.

## 구조 (npm 워크스페이스 모노레포)

```
packages/
  poker-engine/   순수 TypeScript 게임 룰 엔진 (카드, 족보 판정, 게임 상태 머신)
  shared/         서버 ↔ 클라이언트 공유 타입 / 소켓 프로토콜
apps/
  server/         Node.js + Socket.IO 권위 서버 (테이블/룸, 액션 검증)
  mobile/         Expo (React Native) 모바일 클라이언트
```

## 설계 원칙

- **권위 서버(authoritative server)**: 카드 셔플·딜·족보 판정은 전부 서버에서. 클라이언트는 자기 홀카드만 수신 → 치팅 방지.
- **엔진과 전송 분리**: `poker-engine`은 네트워크를 모르는 순수 로직 → 단위 테스트로 룰 검증.

## 개발

```bash
npm install
npm run test:engine   # 엔진 단위 테스트
npm run dev:server    # 서버 실행
npm run dev:mobile    # Expo 앱 실행
```

## 개발 로드맵

- [x] 모노레포 뼈대
- [x] 카드 / 덱 / 셔플 (시드 기반, 재현 가능)
- [x] 족보 판정 (7장 → 최고 5장)
- [x] 게임 상태 머신 (베팅 라운드, 사이드팟, 쇼다운) — 25개 테스트 통과
- [x] Expo 모바일 클라이언트 (로그인 · 로비 · 게임 3화면)
- [x] 디자인 폴리시 (펠트 그라데이션 · 카드 · 칩 · 그라데이션 버튼)
- [x] 사운드 (효과음 + expo-av)
- [x] 소켓 프로토콜 계약 (`packages/shared`) + 서버 스켈레톤 (`apps/server`)
- [ ] **온라인 멀티플레이어 서버 (담당: 형섭 → [HANDOFF.md](HANDOFF.md))**
- [ ] 애니메이션 (카드 딜, 칩 이동, 승자 연출) — 선택

## 모바일 앱 실행

```bash
cd apps/mobile
npx expo start        # QR 로 Expo Go 앱에서 열기 (iOS/Android)
npx expo start --web  # 브라우저에서 미리보기
```
