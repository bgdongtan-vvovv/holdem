/**
 * 화면 방향 정책.
 *
 * 로그인·로비는 세로 고정이 자연스럽고, 게임 테이블은 화면이 어느 쪽으로
 * 기울든 강제로 세로로 잠근다. 전체화면 진입 시점(모바일 웹)에만 방향을
 * 한 번 잠그고, 네이티브 앱에서는 Expo ScreenOrientation API로 화면 단위로
 * 잠김/해제를 관리한다.
 */

export type ScreenOrientationPolicy =
  | "portrait-lock" // 항상 세로 고정 (로그인, 로비)
  | "portrait" // 세로 권장이지만 잠그진 않음 (공통 기본)
  | "any"; // 방향 자유 (현재 미사용)

export const SCREEN_ORIENTATION_POLICY: Record<string, ScreenOrientationPolicy> = {
  login: "portrait-lock",
  lobby: "portrait-lock",
  game: "portrait-lock",
};
