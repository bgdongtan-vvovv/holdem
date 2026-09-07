# SSun Game Responsive Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SSun Game의 승인된 브랜드를 적용하고 Android·iOS·PC 웹에서 세로 로비와 가로·세로 2~9인 홀덤 테이블이 겹침 없이 동작하게 만든다.

**Architecture:** 게임 상태와 화면 배치를 분리한다. 순수 TypeScript 레이아웃 함수가 화면 크기·방향·좌석 수를 받아 좌석, 보드, 팟, 베팅, 딜러와 액션 영역의 정규화 좌표를 반환하고 React Native 컴포넌트는 이를 렌더링한다. 기존 로컬 테이블 훅과 권위 서버 계약은 변경하지 않는다.

**Tech Stack:** TypeScript, React 18, React Native 0.74, Expo SDK 51, expo-linear-gradient, expo-screen-orientation, Vitest

**Spec:** `docs/superpowers/specs/2026-09-03-ssun-game-platform-design.md`

## Global Constraints

- 브랜드명은 **SSun Game**이며 KPL, WSOP, GGPoker, Prime Poker 표기를 제품 UI에 사용하지 않는다.
- 승인된 2번 더블 S 포커칩 로고 방향을 사용한다.
- 초기 사용자 문구는 한국어이며 문자열은 화면 컴포넌트에서 분리한다.
- 게임은 텍사스 홀덤만 지원한다.
- 테이블은 2~9명 동적 좌석과 9-max 풀링 배치를 지원한다.
- 모바일 로비는 세로형, 모바일 테이블은 가로·세로형, PC 웹 테이블은 가로형이다.
- 참고 이미지의 상표·로고·캐릭터·원화를 복사하지 않고 독자 자산을 사용한다.
- 현재 사용자의 변경사항을 보존하고 관련 파일의 기존 동작을 먼저 테스트한다.
- 사용자가 명시적으로 커밋을 요청하기 전에는 커밋하지 않는다.

---

## Planned File Structure

- `apps/mobile/src/brand/tokens.ts`: SSun Game 색상, 간격, 깊이와 타이포그래피 토큰.
- `apps/mobile/src/brand/copy.ko.ts`: 이 단계에서 사용하는 한국어 문구.
- `apps/mobile/src/layout/tableLayout.ts`: 방향·크기·좌석 수를 화면 좌표로 변환하는 순수 함수.
- `apps/mobile/src/layout/tableLayout.test.ts`: 2·6·9인 및 가로·세로 배치 불변식.
- `apps/mobile/src/layout/orientationPolicy.ts`: 화면별 허용 방향 정책.
- `apps/mobile/src/layout/orientationPolicy.test.ts`: 로그인·로비·게임 방향 정책.
- `apps/mobile/src/components/GameChrome.tsx`: 게임 상단 정보와 메뉴.
- `apps/mobile/src/components/TableSurface.tsx`: 독자 배경·레일·펠트 표면.
- `apps/mobile/src/components/TableSeat.tsx`: 카드, 아바타, 이름표, 스택, 타이머.
- `apps/mobile/src/components/PokerTable.tsx`: 레이아웃 모델을 조합하는 테이블 컨테이너.
- `apps/mobile/src/components/ActionBar.tsx`: 가로·세로 반응형 액션과 빠른 레이즈.
- `apps/mobile/src/screens/GameScreen.tsx`: 방향 정책과 게임 셸.
- `apps/mobile/src/screens/LobbyScreen.tsx`: SSun Game 세로 로비 셸.
- `apps/mobile/App.tsx`: 화면 전환에 따른 방향 적용.
- `apps/mobile/app.json`: 앱 전체 방향 제한 해제와 SSun Game 메타데이터.
- `apps/mobile/assets/brand/ssun-mark.png`: 승인된 더블 S 심벌.
- `apps/mobile/assets/brand/ssun-wordmark.png`: SSun Game 워드마크.
- `apps/mobile/assets/images/ssun-table-landscape.png`: 독자 가로 테이블 배경.
- `apps/mobile/assets/images/ssun-table-portrait.png`: 독자 세로 테이블 배경.

### Task 1: Baseline and SSun Game Brand Foundation

**Files:**
- Create: `apps/mobile/src/brand/tokens.ts`
- Create: `apps/mobile/src/brand/copy.ko.ts`
- Create: `apps/mobile/src/brand/tokens.test.ts`
- Modify: `apps/mobile/src/theme.ts`
- Modify: `apps/mobile/app.json`
- Create: `apps/mobile/assets/brand/ssun-mark.png`
- Create: `apps/mobile/assets/brand/ssun-wordmark.png`

**Interfaces:**
- Consumes: the approved concept-2 logo source at `/Users/davidkingair/.codex/generated_images/01a060d4-82ab-70d0-99a8-7a2feda559f4/exec-92a9a1aa-d33b-40d1-9682-5fa573716383.png`.
- Produces: `brandTokens`, `koCopy`, and project-owned SSun Game raster assets.

- [ ] **Step 1: Record the existing verification baseline**

Run:

```bash
npm run test -w @holdem/mobile
npm run typecheck -w @holdem/mobile
```

Expected: both commands exit 0. If either fails, record the exact pre-existing failure before changing files.

- [ ] **Step 2: Write the failing brand-token test**

```ts
// apps/mobile/src/brand/tokens.test.ts
import { describe, expect, it } from "vitest";
import { brandTokens } from "./tokens";

describe("brandTokens", () => {
  it("keeps table text readable and the approved three-color identity stable", () => {
    expect(brandTokens.color).toMatchObject({
      gold: "#D7A83D",
      red: "#A61F2B",
      felt: "#242321",
      surface: "#111111",
      text: "#F5F0E6",
    });
    expect(brandTokens.radius.action).toBe(10);
  });
});
```

- [ ] **Step 3: Run the test and verify the missing module failure**

Run:

```bash
npm run test -w @holdem/mobile -- src/brand/tokens.test.ts
```

Expected: FAIL because `./tokens` does not exist.

- [ ] **Step 4: Implement the tokens and Korean copy**

```ts
// apps/mobile/src/brand/tokens.ts
export const brandTokens = {
  color: {
    gold: "#D7A83D",
    goldBright: "#F3D57A",
    red: "#A61F2B",
    redBright: "#CB3A45",
    felt: "#242321",
    feltEdge: "#151514",
    walnut: "#4A2817",
    surface: "#111111",
    surfaceRaised: "#252525",
    text: "#F5F0E6",
    textMuted: "#AAA49B",
    stack: "#54BCEB",
    success: "#61D13D",
  },
  radius: { card: 8, seat: 9, action: 10, sheet: 18 },
  depth: {
    panelBorder: "rgba(215,168,61,0.42)",
    panelShadow: "rgba(0,0,0,0.72)",
  },
} as const;
```

```ts
// apps/mobile/src/brand/copy.ko.ts
export const koCopy = {
  brandName: "SSun Game",
  lobby: { ring: "링게임", sitAndGo: "Sit & Go", tournament: "토너먼트" },
  action: { fold: "폴드", check: "체크", call: "콜", bet: "벳", raise: "레이즈", allIn: "올인" },
  table: { totalPot: "총 팟", move: "테이블 이동", sitOut: "자리비움", rules: "게임 규칙" },
} as const;
```

Update `theme.ts` to map legacy keys to `brandTokens.color` so existing components compile while later tasks migrate them. Set `app.json` name to `SSun Game`, slug to `ssun-game`, background to `#111111`, and orientation to `default`; add `assets/brand/**/*.png` to `assetBundlePatterns`. Do not change bundle identifiers in this task.

- [ ] **Step 5: Prepare project-owned logo files**

Use the approved concept as an image-generation reference to produce:

- a transparent square mark containing only the double S poker-chip medallion;
- a transparent horizontal lockup containing the mark and exact text `SSun Game`.

Copy the accepted results to:

```text
apps/mobile/assets/brand/ssun-mark.png
apps/mobile/assets/brand/ssun-wordmark.png
```

Verify transparent edges, exact spelling, no external brand marks, and legibility at 48 px before accepting.

- [ ] **Step 6: Run focused and baseline verification**

Run:

```bash
npm run test -w @holdem/mobile -- src/brand/tokens.test.ts
npm run typecheck -w @holdem/mobile
```

Expected: PASS and exit 0.

- [ ] **Step 7: Commit only with explicit user authorization**

If and only if the user has explicitly requested a commit:

```bash
git add apps/mobile/src/brand apps/mobile/src/theme.ts apps/mobile/app.json apps/mobile/assets/brand
git commit -m "feat(mobile): establish SSun Game brand system"
```

Otherwise leave the verified changes uncommitted.

### Task 2: Pure Responsive Table Layout Model

**Files:**
- Create: `apps/mobile/src/layout/tableLayout.ts`
- Create: `apps/mobile/src/layout/tableLayout.test.ts`

**Interfaces:**
- Consumes: no UI framework state.
- Produces: `TableOrientation`, `Point`, `Rect`, `TableLayout`, and `createTableLayout(input)`.

- [ ] **Step 1: Write failing layout invariant tests**

```ts
import { describe, expect, it } from "vitest";
import { createTableLayout } from "./tableLayout";

describe("createTableLayout", () => {
  it.each([2, 6, 9])("places %i landscape seats inside the safe area without duplicates", (seatCount) => {
    const layout = createTableLayout({ width: 844, height: 390, seatCount, orientation: "landscape" });
    const keys = layout.seats.map(({ x, y }) => `${x.toFixed(3)}:${y.toFixed(3)}`);
    expect(new Set(keys).size).toBe(seatCount);
    expect(layout.seats.every(({ x, y }) => x >= 0.04 && x <= 0.96 && y >= 0.08 && y <= 0.9)).toBe(true);
    expect(layout.actionBar.width).toBeGreaterThan(0.3);
  });

  it("uses the long vertical axis for a 9-seat portrait table", () => {
    const layout = createTableLayout({ width: 390, height: 844, seatCount: 9, orientation: "portrait" });
    expect(layout.board.y).toBeLessThan(layout.hero.y);
    expect(layout.actionBar.y).toBeGreaterThan(layout.hero.y);
    expect(layout.seats).toHaveLength(9);
  });

  it("rejects unsupported seat counts", () => {
    expect(() => createTableLayout({ width: 390, height: 844, seatCount: 10, orientation: "portrait" })).toThrow(
      "seatCount must be between 2 and 9",
    );
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
npm run test -w @holdem/mobile -- src/layout/tableLayout.test.ts
```

Expected: FAIL because `createTableLayout` is not defined.

- [ ] **Step 3: Implement the public layout types and validation**

```ts
export type TableOrientation = "portrait" | "landscape";
export type Point = { x: number; y: number };
export type Rect = Point & { width: number; height: number };
export type TableLayout = {
  orientation: TableOrientation;
  scale: number;
  seats: Point[];
  hero: Point;
  board: Rect;
  pot: Point;
  actionBar: Rect;
};

export function createTableLayout(input: {
  width: number;
  height: number;
  seatCount: number;
  orientation: TableOrientation;
}): TableLayout {
  if (!Number.isInteger(input.seatCount) || input.seatCount < 2 || input.seatCount > 9) {
    throw new RangeError("seatCount must be between 2 and 9");
  }
  const source = input.orientation === "landscape" ? LANDSCAPE_SEATS : PORTRAIT_SEATS;
  const seats = sampleSeatRing(source, input.seatCount);
  return {
    orientation: input.orientation,
    scale: Math.min(input.width / 844, input.height / 390),
    seats,
    hero: seats[0]!,
    board: input.orientation === "landscape"
      ? { x: 0.34, y: 0.43, width: 0.32, height: 0.18 }
      : { x: 0.15, y: 0.42, width: 0.7, height: 0.13 },
    pot: input.orientation === "landscape" ? { x: 0.5, y: 0.36 } : { x: 0.5, y: 0.35 },
    actionBar: input.orientation === "landscape"
      ? { x: 0.61, y: 0.86, width: 0.38, height: 0.13 }
      : { x: 0.02, y: 0.88, width: 0.96, height: 0.1 },
  };
}
```

Define `LANDSCAPE_SEATS` and `PORTRAIT_SEATS` as nine normalized positions with hero at index 0. Implement `sampleSeatRing` so 2·3·4·5·6·7·8-player tables retain the hero and choose evenly distributed opponent positions instead of taking the first N entries.

- [ ] **Step 4: Add pairwise overlap assertions**

Extend the parameterized test to calculate pixel distance between every seat pair using the input width and height. Require at least 86 px in landscape and 78 px in portrait at the reference sizes.

- [ ] **Step 5: Run layout tests**

Run:

```bash
npm run test -w @holdem/mobile -- src/layout/tableLayout.test.ts
```

Expected: all layout tests PASS.

- [ ] **Step 6: Commit only with explicit user authorization**

If authorized:

```bash
git add apps/mobile/src/layout/tableLayout.ts apps/mobile/src/layout/tableLayout.test.ts
git commit -m "feat(mobile): add responsive nine-seat layout model"
```

### Task 3: Screen Orientation Policy

**Files:**
- Create: `apps/mobile/src/layout/orientationPolicy.ts`
- Create: `apps/mobile/src/layout/orientationPolicy.test.ts`
- Modify: `apps/mobile/App.tsx`
- Modify: `apps/mobile/package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: application screen name `"login" | "lobby" | "game"`.
- Produces: `orientationForScreen(screen)` and `applyOrientationForScreen(screen)`.

- [ ] **Step 1: Install the Expo-compatible orientation module**

Run:

```bash
npx expo install expo-screen-orientation --workspace apps/mobile
```

Expected: Expo selects the SDK 51-compatible version and updates the mobile package and lockfile.

- [ ] **Step 2: Write the failing policy test**

```ts
import { describe, expect, it } from "vitest";
import { orientationForScreen } from "./orientationPolicy";

describe("orientationForScreen", () => {
  it("keeps account and lobby flows portrait while allowing both table orientations", () => {
    expect(orientationForScreen("login")).toBe("portrait");
    expect(orientationForScreen("lobby")).toBe("portrait");
    expect(orientationForScreen("game")).toBe("all");
  });
});
```

- [ ] **Step 3: Run the test and verify failure**

Run:

```bash
npm run test -w @holdem/mobile -- src/layout/orientationPolicy.test.ts
```

Expected: FAIL because the policy module does not exist.

- [ ] **Step 4: Implement and apply the policy**

```ts
export type AppScreen = "login" | "lobby" | "game";
export type OrientationPolicy = "portrait" | "all";

export function orientationForScreen(screen: AppScreen): OrientationPolicy {
  return screen === "game" ? "all" : "portrait";
}
```

Implement `applyOrientationForScreen` with `expo-screen-orientation`: use `PORTRAIT_UP` for login/lobby and `ALL_BUT_UPSIDE_DOWN` for game. In `App.tsx`, call it from an effect when `screen` changes. Remove the existing browser-only unconditional portrait lock from `enterMobileWebFullscreen`; keep fullscreen behavior.

- [ ] **Step 5: Run policy, type and web export verification**

Run:

```bash
npm run test -w @holdem/mobile -- src/layout/orientationPolicy.test.ts
npm run typecheck -w @holdem/mobile
CI=1 EXPO_NO_DOCTOR=1 npx expo export --platform web --output-dir apps/mobile/dist
```

Expected: tests and typecheck PASS; web export completes without module-resolution errors.

- [ ] **Step 6: Commit only with explicit user authorization**

If authorized:

```bash
git add apps/mobile/src/layout/orientationPolicy.ts apps/mobile/src/layout/orientationPolicy.test.ts apps/mobile/App.tsx apps/mobile/package.json package-lock.json
git commit -m "feat(mobile): apply screen-specific orientation policy"
```

### Task 4: Original Table Surfaces and Game Chrome

**Files:**
- Create: `apps/mobile/assets/images/ssun-table-landscape.png`
- Create: `apps/mobile/assets/images/ssun-table-portrait.png`
- Create: `apps/mobile/src/components/TableSurface.tsx`
- Create: `apps/mobile/src/components/GameChrome.tsx`
- Modify: `apps/mobile/src/screens/GameScreen.tsx`

**Interfaces:**
- Consumes: `brandTokens`, screen dimensions, stakes and optional tournament summary.
- Produces: `TableSurface({ orientation })` and `GameChrome({ mode, blinds, tournament })`.

- [ ] **Step 1: Generate two independent table background assets**

Use the supplied mobile examples only as mood and composition references. Generate one 16:9 landscape and one 9:16 portrait original scene with:

- dark charcoal felt;
- substantial walnut rail;
- warm blurred card-room background;
- no seats, cards, chips, text, logos, watermarks, or embedded controls;
- matching lighting and material identity across both orientations.

Save the accepted files at the exact asset paths above and inspect both at original resolution.

- [ ] **Step 2: Implement the surface component**

```tsx
export function TableSurface({ orientation }: { orientation: TableOrientation }) {
  const source = orientation === "landscape"
    ? require("../../assets/images/ssun-table-landscape.png")
    : require("../../assets/images/ssun-table-portrait.png");
  return <Image source={source} resizeMode="cover" style={StyleSheet.absoluteFill} />;
}
```

- [ ] **Step 3: Implement the game chrome**

The chrome must render Korean labels and accept this interface:

```ts
export type TournamentSummary = {
  level: number;
  levelEndsAt: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  rank: number;
  remainingPlayers: number;
};
```

In ring mode show stakes and table menu. In tournament mode show level, remaining time, blinds·ante, rank, remaining players and table menu. Keep all values as props; do not invent client-side tournament state.

- [ ] **Step 4: Replace the embedded PokerTable background**

Modify `GameScreen.tsx` to derive orientation with `useWindowDimensions()`, render `TableSurface` behind `PokerTable`, and render `GameChrome` above it. Remove only the superseded topbar markup. Preserve exit, audio unlock, showdown and local table behavior.

- [ ] **Step 5: Verify type safety and exports**

Run:

```bash
npm run typecheck -w @holdem/mobile
CI=1 EXPO_NO_DOCTOR=1 npx expo export --platform web --output-dir apps/mobile/dist
```

Expected: exit 0 with both new background files included in the asset bundle.

- [ ] **Step 6: Commit only with explicit user authorization**

If authorized, add only the five files in this task and commit with:

```bash
git commit -m "feat(mobile): add SSun Game table surfaces and chrome"
```

### Task 5: Migrate PokerTable to the Layout Model

**Files:**
- Modify: `apps/mobile/src/components/PokerTable.tsx`
- Modify: `apps/mobile/src/components/TableSeat.tsx`
- Create: `apps/mobile/src/components/seatPresentation.ts`
- Create: `apps/mobile/src/components/seatPresentation.test.ts`

**Interfaces:**
- Consumes: `createTableLayout`, existing `HandState`, `SeatMeta[]`, human seat and dealer index.
- Produces: `seatPresentation(player, context)` and a responsive `PokerTable`.

- [ ] **Step 1: Write failing seat-presentation tests**

```ts
import { describe, expect, it } from "vitest";
import { seatPresentation } from "./seatPresentation";

describe("seatPresentation", () => {
  it("marks folded, active, winner and out states without hiding the stack", () => {
    expect(seatPresentation({ status: "folded", stack: 900 }, { active: false, winner: false })).toMatchObject({
      dimmed: true, actionLabel: "폴드", stackLabel: "900",
    });
    expect(seatPresentation({ status: "out", stack: 0 }, { active: false, winner: false }).stackLabel).toBe("탈락");
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
npm run test -w @holdem/mobile -- src/components/seatPresentation.test.ts
```

Expected: FAIL because the presentation module does not exist.

- [ ] **Step 3: Implement the pure presentation mapper**

Return `dimmed`, `actionLabel`, `stackLabel`, `showTimer`, and `showWinner`. Use `formatGameMoney`; return `폴드` for folded, `탈락` for out, and no action label otherwise.

- [ ] **Step 4: Replace fixed seat arrays with the layout result**

In `PokerTable.tsx`:

- delete `SEAT_POS_6`, `SEAT_POS_9`, `BET_POS_6`, `BET_POS_9`, `DEALER_POS_6`, and `DEALER_POS_9`;
- call `createTableLayout` from measured width, height, player count and derived orientation;
- convert normalized points to absolute pixel positions at the render boundary;
- retain human-seat rotation so the local player remains the hero;
- retain chip-flight and showdown animation behavior;
- place board, pot, bets and dealer using the returned layout.

- [ ] **Step 5: Apply premium seat presentation**

In `TableSeat.tsx`, use the pure mapper and brand tokens. Preserve the existing card deal and winner animations while changing the panel to:

- circular avatar with metallic rim;
- black beveled nameplate;
- cyan stack text;
- gold active border and green time track;
- visible fold, all-in and winner labels;
- compact landscape and portrait scale passed as a prop.

- [ ] **Step 6: Run focused and full mobile tests**

Run:

```bash
npm run test -w @holdem/mobile -- src/layout/tableLayout.test.ts src/components/seatPresentation.test.ts
npm run test -w @holdem/mobile
npm run typecheck -w @holdem/mobile
```

Expected: all commands PASS.

- [ ] **Step 7: Commit only with explicit user authorization**

If authorized:

```bash
git add apps/mobile/src/components/PokerTable.tsx apps/mobile/src/components/TableSeat.tsx apps/mobile/src/components/seatPresentation.ts apps/mobile/src/components/seatPresentation.test.ts
git commit -m "feat(mobile): render responsive premium poker table"
```

### Task 6: Responsive Action Controls

**Files:**
- Create: `apps/mobile/src/components/actionPresets.ts`
- Create: `apps/mobile/src/components/actionPresets.test.ts`
- Modify: `apps/mobile/src/components/ActionBar.tsx`
- Modify: `apps/mobile/src/screens/GameScreen.tsx`

**Interfaces:**
- Consumes: `HandState`, `LegalActions`, orientation.
- Produces: `buildActionPresets(legal, state)` and a responsive action bar.

- [ ] **Step 1: Write failing preset tests**

```ts
import { describe, expect, it } from "vitest";
import { buildActionPresets } from "./actionPresets";

it("builds legal 2BB, 3BB, 4BB and pot presets without exceeding all-in", () => {
  const values = buildActionPresets(
    { canRaise: true, minRaiseTo: 400, maxRaiseTo: 900, callAmount: 200 },
    { bigBlind: 200, pot: 700 },
  );
  expect(values.map((item) => item.label)).toEqual(["2BB", "3BB", "4BB", "팟"]);
  expect(values.every((item) => item.to >= 400 && item.to <= 900)).toBe(true);
});
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
npm run test -w @holdem/mobile -- src/components/actionPresets.test.ts
```

Expected: FAIL because `buildActionPresets` does not exist.

- [ ] **Step 3: Implement legal preset clamping**

Export:

```ts
export function buildActionPresets(
  legal: Pick<LegalActions, "canRaise" | "minRaiseTo" | "maxRaiseTo" | "callAmount">,
  state: { bigBlind: number; pot: number },
): Array<{ label: "2BB" | "3BB" | "4BB" | "팟"; to: number }>
```

Clamp every amount between `minRaiseTo` and `maxRaiseTo`, remove duplicate resulting amounts while preserving label order, and return an empty array when raising is illegal.

- [ ] **Step 4: Build separate landscape and portrait compositions**

- Landscape: preset row immediately above three right-aligned red action buttons.
- Portrait: preset stack on the right and Fold·Check/Call·Bet/Raise row pinned to the bottom safe area.
- Both: minus, amount, plus controls; disabled state; all-in label; at least 48 dp touch targets.

Use Korean copy from `koCopy` and keep `onAction(Action)` unchanged.

- [ ] **Step 5: Run tests, typecheck and web export**

Run:

```bash
npm run test -w @holdem/mobile -- src/components/actionPresets.test.ts
npm run typecheck -w @holdem/mobile
CI=1 EXPO_NO_DOCTOR=1 npx expo export --platform web --output-dir apps/mobile/dist
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit only with explicit user authorization**

If authorized:

```bash
git add apps/mobile/src/components/actionPresets.ts apps/mobile/src/components/actionPresets.test.ts apps/mobile/src/components/ActionBar.tsx apps/mobile/src/screens/GameScreen.tsx
git commit -m "feat(mobile): add responsive betting controls"
```

### Task 7: Table Menus and Player Detail Sheets

**Files:**
- Create: `apps/mobile/src/components/TableMenuSheet.tsx`
- Create: `apps/mobile/src/components/PlayerDetailSheet.tsx`
- Create: `apps/mobile/src/components/playerStats.ts`
- Create: `apps/mobile/src/components/playerStats.test.ts`
- Modify: `apps/mobile/src/components/PokerTable.tsx`
- Modify: `apps/mobile/src/screens/GameScreen.tsx`

**Interfaces:**
- Consumes: selected public player data and server-provided aggregate counters.
- Produces: `calculatePlayerStats(counters)`, table settings sheet and player detail sheet.

- [ ] **Step 1: Write failing player-stat tests**

```ts
import { expect, it } from "vitest";
import { calculatePlayerStats } from "./playerStats";

it("calculates poker percentages and handles zero opportunities", () => {
  expect(calculatePlayerStats({ hands: 25, vpip: 4, pfr: 2, stealAttempts: 0, steals: 0, threeBetChances: 8, threeBets: 1 }))
    .toEqual({ hands: 25, vpip: 16, pfr: 8, ats: 0, threeBet: 13 });
});
```

- [ ] **Step 2: Run and verify failure**

Run:

```bash
npm run test -w @holdem/mobile -- src/components/playerStats.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the stat calculator**

Round percentages to whole numbers and return zero when the denominator is zero. Do not calculate from hidden cards or infer unavailable actions.

- [ ] **Step 4: Implement the player sheet**

Show avatar, nickname, hands, VPIP, PFR, ATS, 3BET, total winnings filter, colored label and private note. Treat label and note as local-only until the account API plan defines persistence.

- [ ] **Step 5: Implement the table menu sheet**

Include game rules, sound, vibration, squeeze-card preference, BB display, sit out next hand and exit table. Long-press on empty felt and the top-right menu both open the sheet. Do not implement roulette, prop betting, staking or external-brand features in this phase.

- [ ] **Step 6: Run verification**

Run:

```bash
npm run test -w @holdem/mobile -- src/components/playerStats.test.ts
npm run typecheck -w @holdem/mobile
```

Expected: PASS.

- [ ] **Step 7: Commit only with explicit user authorization**

If authorized, add the six files and commit with:

```bash
git commit -m "feat(mobile): add table and player detail sheets"
```

### Task 8: SSun Game Korean Lobby Shell

**Files:**
- Modify: `apps/mobile/src/screens/LobbyScreen.tsx`
- Create: `apps/mobile/src/components/LobbyEventBanner.tsx`
- Create: `apps/mobile/src/components/LobbyGameCard.tsx`
- Create: `apps/mobile/src/components/LobbyBottomNav.tsx`

**Interfaces:**
- Consumes: player summary, event cards and existing `onStartGame`.
- Produces: a portrait SSun Game lobby whose ring-game card enters the existing local table.

- [ ] **Step 1: Define static preview data at the screen boundary**

Use typed local preview data:

```ts
type LobbyEvent = { id: string; title: string; subtitle: string; startsAtLabel: string; art: ImageSourcePropType };
type LobbyGame = { id: "ring" | "sit-and-go" | "mtt"; title: string; subtitle: string; enabled: boolean };
```

Set ring game enabled and route it through `onStartGame`. Mark Sit & Go and MTT as `준비 중` until their server plans are implemented; do not pretend they are playable.

- [ ] **Step 2: Implement the vertical lobby hierarchy**

Render:

- SSun Game mark, profile and chip balance header;
- large event carousel area;
- `추천 게임` cards;
- ring game, Sit & Go and tournament entries;
- optional poker-content row using only project-owned placeholder art;
- home, game, tournament, season and profile bottom navigation.

Use `FlatList` for horizontal rows, safe-area padding, Korean copy and brand tokens. Remove the existing OFC, Omaha, blackjack and baccarat tiles because SSun Game is holdem-only.

- [ ] **Step 3: Verify portrait sizes**

Run web export, serve `apps/mobile/dist`, and inspect at:

- 390 × 844 phone;
- 430 × 932 large phone;
- 768 × 1024 tablet.

Acceptance: no horizontal page overflow, bottom navigation remains reachable, event art is not cropped across its text-safe area, and only the ring-game card starts a game.

- [ ] **Step 4: Run typecheck**

Run:

```bash
npm run typecheck -w @holdem/mobile
```

Expected: PASS.

- [ ] **Step 5: Commit only with explicit user authorization**

If authorized:

```bash
git add apps/mobile/src/screens/LobbyScreen.tsx apps/mobile/src/components/LobbyEventBanner.tsx apps/mobile/src/components/LobbyGameCard.tsx apps/mobile/src/components/LobbyBottomNav.tsx
git commit -m "feat(mobile): build SSun Game Korean lobby shell"
```

### Task 9: Cross-Platform Visual and Regression Acceptance

**Files:**
- Modify only files from Tasks 1–8 when a verified defect requires correction.
- Create: `docs/qa/ssun-responsive-table-checklist.md`

**Interfaces:**
- Consumes: all deliverables in this plan.
- Produces: verified acceptance evidence and a reusable device checklist.

- [ ] **Step 1: Run the complete automated suite**

Run:

```bash
npm run test
npm run build
npm run typecheck -w @holdem/mobile
CI=1 EXPO_NO_DOCTOR=1 npx expo export --platform web --output-dir apps/mobile/dist
```

Expected: every command exits 0. Fix only regressions introduced by this plan.

- [ ] **Step 2: Verify landscape table breakpoints**

Inspect 844 × 390, 932 × 430, 1024 × 768 and 1440 × 900. For each size, play at least one hand through river and one fold-ending hand.

Acceptance:

- all 9 seats remain visible;
- hero cards do not touch the action bar;
- community cards do not move when later streets appear;
- chip flights end at the visible pot;
- menu and action touch targets remain at least 48 dp;
- no external product logo or copied character appears.

- [ ] **Step 3: Verify portrait table breakpoints**

Inspect 390 × 844, 430 × 932 and 768 × 1024. Repeat the two hand flows and rotate during an active betting turn.

Acceptance:

- current hand and raise amount survive rotation;
- board, pot, tournament text and seats do not overlap;
- the bottom action row stays inside the safe area;
- sheets open, close and scroll without moving the table state.

- [ ] **Step 4: Verify native devices**

Run one Android emulator/device and one iOS simulator/device. Confirm orientation policy, audio unlock, status/navigation bars, background assets and touch response. Record device model, OS, build identifier and result in the checklist.

- [ ] **Step 5: Write the QA checklist**

Create `docs/qa/ssun-responsive-table-checklist.md` with one row per tested viewport/device and columns:

```text
환경 | 크기 | 방향 | 9좌석 | 액션바 | 회전 보존 | 애니메이션 | 사운드 | 결과 | 비고
```

Enter actual observed results; do not pre-fill PASS.

- [ ] **Step 6: Review the final diff**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors, no generated `dist` files tracked, and no unrelated user changes included in any proposed commit set.

- [ ] **Step 7: Commit only with explicit user authorization**

If authorized:

```bash
git add docs/qa/ssun-responsive-table-checklist.md
git commit -m "test(mobile): verify responsive SSun Game experience"
```

Otherwise report verification results and leave all changes uncommitted.
