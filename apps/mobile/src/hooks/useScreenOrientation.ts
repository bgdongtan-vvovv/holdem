/**
 * Expo ScreenOrientation v57 API 추상화.
 *
 * 잠금 단위는 `OrientationLock` enum 이며, v57 에서는 lockAsync 가
 * Options 객체 대신 enum 값을 직접 받는다. 우리 정책에서는 세로 고정만
 * 사용하므로 `OrientationLock.PORTRAIT` 를 쓴다.
 *
 * 훅은 플랫폼·빌드가 방향 잠금을 지원하지 않는 경우 조용히 무시한다
 * (expo-screen-orientation 자체가 없거나 lockAsync 가 reject 하는 경우 포함).
 */

import { useEffect, useRef } from "react";
import {
  lockAsync,
  unlockAsync,
  getOrientationLockAsync,
  OrientationLock,
} from "expo-screen-orientation";
import { SCREEN_ORIENTATION_POLICY, type ScreenOrientationPolicy } from "./ScreenOrientationPolicy";

const PORTRAIT_LOCK: OrientationLock = OrientationLock.PORTRAIT;

/**
 * 화면 방향 정책을 앱 라이프사이클에 적용한다.
 *
 * - 컴포넌트 마운트/화면 전환 시 현재 화면에 맞는 방향으로 잠근다.
 * - 언마운트/화면 전환 시 잠금을 해제해 다음 화면이 다시 결정할 수 있게 한다.
 * - Expo SDK 바깥(웹·테스트)에서는 expo-screen-orientation 이 없어도 조용히 무시된다.
 */
export function useScreenOrientation(
  screenKey: keyof typeof SCREEN_ORIENTATION_POLICY,
  deps: React.DependencyList = [],
): void {
  const prevPolicyRef = useRef<ScreenOrientationPolicy | null>(null);
  const mountedRef = useRef(false);
  const applyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 화면 키 변경 감지 (의존성 배열 모니터링)
  useEffect(() => {
    mountedRef.current = true;
    prevPolicyRef.current = null;

    return () => {
      mountedRef.current = false;
      if (applyTimerRef.current) {
        clearTimeout(applyTimerRef.current);
        applyTimerRef.current = null;
      }
    };
  }, [screenKey, ...deps]);

  useEffect(() => {
    const policy = SCREEN_ORIENTATION_POLICY[screenKey] ?? "portrait";
    if (!mountedRef.current) return;

    const applyPolicy = async () => {
      if (prevPolicyRef.current === policy) return;

      // 이전 잠금을 먼저 풀면 방향 흔들림이 줄어든다
      if (prevPolicyRef.current !== null) {
        try {
          await unlockAsync();
        } catch {
          /* 잠금 지원이 없는 플랫폼이면 무시 */
        }
      }

      if (policy === "portrait-lock") {
        try {
          await lockAsync(PORTRAIT_LOCK);
        } catch {
          /* 플랫폼·빌드가 방향 잠금을 지원하지 않으면 조용히 넘어간다 */
        }
      }

      if (mountedRef.current) {
        prevPolicyRef.current = policy;
      }
    };

    // React StrictMode 의 이중 마운트에서도 안정적으로 동작하도록
    // 타이머로 한 박자 미뤄 실행한다.
    if (applyTimerRef.current) {
      clearTimeout(applyTimerRef.current);
    }
    applyTimerRef.current = setTimeout(() => {
      applyPolicy().catch(() => undefined);
    }, 0);

    return () => {
      // 화면 이탈 시 잠금 해제 (다음 화면이 다시 결정할 수 있도록)
      if (prevPolicyRef.current !== null) {
        try {
          unlockAsync();
        } catch {
          /* noop */
        }
        prevPolicyRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenKey, ...deps]);
}

/** 호출자가 현재 장치에 실제로 locked 된 방향을 읽어오고 싶을 때 사용 */
export async function readCurrentOrientationLock(): Promise<OrientationLock | null> {
  try {
    return await getOrientationLockAsync();
  } catch {
    return null;
  }
}
