/**
 * 화면별 방향 정책.
 *
 * - login / lobby : 세로(portrait) 고정
 * - game          : 모바일(네이티브·모바일 웹)은 가로·세로 모두 허용, PC 웹은 가로(landscape) 기본
 *
 * 이 모듈은 React Native / expo 모듈을 정적으로 import 하지 않는다(vitest 가 node 에서 실행되기 때문).
 * 실제 잠금은 `applyOrientationForScreen` 에 주입된 deps 가 수행하며, 기본 deps 는
 * expo-screen-orientation 을 네이티브에서만 지연 로드한다(web 에서는 lockAsync 미지원).
 */

export type AppScreen = "login" | "lobby" | "game";
export type OrientationPolicy = "portrait" | "all" | "landscape";

/** expo-screen-orientation `OrientationLock` enum 의 키 이름(값 대신 이름을 써서 모듈 의존을 끊는다). */
export type OrientationLockName = "PORTRAIT_UP" | "ALL_BUT_UPSIDE_DOWN" | "LANDSCAPE";

/** 브라우저 Screen Orientation API 의 lock 인자. */
export type WebOrientationLockType = "portrait" | "landscape" | "any";

export interface OrientationEnvironment {
  /** `Platform.OS` 값 */
  platform: string;
  /** 터치 기반 모바일 브라우저 여부(web 이 아닐 때는 무시) */
  isMobileWeb: boolean;
}

export interface OrientationDeps extends OrientationEnvironment {
  /** 네이티브: expo-screen-orientation lockAsync 래퍼 */
  lockAsync: (lock: OrientationLockName) => Promise<void>;
  /** 웹: `screen.orientation.lock` 래퍼 */
  webLock: (lock: WebOrientationLockType) => Promise<void>;
  /** 웹: `screen.orientation.unlock` 래퍼 */
  webUnlock: () => void;
}

const NATIVE_ENVIRONMENT: OrientationEnvironment = { platform: "ios", isMobileWeb: false };

export function isPcWeb(env: OrientationEnvironment): boolean {
  return env.platform === "web" && !env.isMobileWeb;
}

export function orientationForScreen(
  screen: AppScreen,
  env: OrientationEnvironment = NATIVE_ENVIRONMENT,
): OrientationPolicy {
  if (screen !== "game") return "portrait";
  return isPcWeb(env) ? "landscape" : "all";
}

export function lockNameForPolicy(policy: OrientationPolicy): OrientationLockName {
  switch (policy) {
    case "portrait":
      return "PORTRAIT_UP";
    case "landscape":
      return "LANDSCAPE";
    case "all":
      return "ALL_BUT_UPSIDE_DOWN";
  }
}

/**
 * 화면 전환 시 방향 정책을 적용한다. 실패해도 절대 throw 하지 않는다.
 *
 * - 네이티브: expo-screen-orientation `lockAsync`
 * - 모바일 웹: `screen.orientation.lock/unlock` (전체화면이 아닐 때 등 실패는 무시)
 * - PC 웹: 아무것도 하지 않는다(브라우저 창은 잠글 수 없음; "landscape" 는 레이아웃 기본값 의미)
 */
export async function applyOrientationForScreen(
  screen: AppScreen,
  deps: OrientationDeps,
): Promise<void> {
  const policy = orientationForScreen(screen, deps);

  try {
    if (deps.platform === "web") {
      if (!deps.isMobileWeb) return;
      if (policy === "all") {
        deps.webUnlock();
      } else {
        await deps.webLock(policy);
      }
      return;
    }

    await deps.lockAsync(lockNameForPolicy(policy));
  } catch {
    // 방향 잠금 미지원(웹, 일부 기기, 인앱 브라우저)은 조용히 무시한다.
  }
}

/**
 * 런타임용 기본 deps. `platform` 은 호출측에서 `Platform.OS` 를 넘긴다.
 * expo-screen-orientation 은 네이티브에서 처음 필요할 때만 로드한다.
 */
export function createRuntimeOrientationDeps(env: OrientationEnvironment): OrientationDeps {
  return {
    ...env,
    lockAsync: async (lock) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ScreenOrientation = require("expo-screen-orientation");
      const lockMap: Record<OrientationLockName, unknown> = ScreenOrientation.OrientationLock;
      if (lockMap && lockMap[lock] !== undefined) {
        await ScreenOrientation.lockAsync(lockMap[lock]);
      }
    },
    webLock: async (lock) => {
      const orientation = globalThis.screen?.orientation as
        | { lock?: (type: WebOrientationLockType) => Promise<void> }
        | undefined;
      await orientation?.lock?.(lock);
    },
    webUnlock: () => {
      const orientation = globalThis.screen?.orientation as
        | { unlock?: () => void }
        | undefined;
      orientation?.unlock?.();
    },
  };
}
