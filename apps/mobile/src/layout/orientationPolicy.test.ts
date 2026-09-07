import { describe, expect, it, vi } from "vitest";
import {
  applyOrientationForScreen,
  lockNameForPolicy,
  orientationForScreen,
  type OrientationEnvironment,
} from "./orientationPolicy";

const native: OrientationEnvironment = { platform: "ios", isMobileWeb: false };
const mobileWeb: OrientationEnvironment = { platform: "web", isMobileWeb: true };
const desktopWeb: OrientationEnvironment = { platform: "web", isMobileWeb: false };

describe("orientationForScreen", () => {
  it("keeps account and lobby flows portrait while allowing both table orientations", () => {
    expect(orientationForScreen("login")).toBe("portrait");
    expect(orientationForScreen("lobby")).toBe("portrait");
    expect(orientationForScreen("game")).toBe("all");
  });

  it("treats mobile web like a native device", () => {
    expect(orientationForScreen("login", mobileWeb)).toBe("portrait");
    expect(orientationForScreen("lobby", mobileWeb)).toBe("portrait");
    expect(orientationForScreen("game", mobileWeb)).toBe("all");
  });

  it("defaults the table to landscape on PC web", () => {
    expect(orientationForScreen("login", desktopWeb)).toBe("portrait");
    expect(orientationForScreen("lobby", desktopWeb)).toBe("portrait");
    expect(orientationForScreen("game", desktopWeb)).toBe("landscape");
  });
});

describe("lockNameForPolicy", () => {
  it("maps policies to expo-screen-orientation lock names", () => {
    expect(lockNameForPolicy("portrait")).toBe("PORTRAIT_UP");
    expect(lockNameForPolicy("all")).toBe("ALL_BUT_UPSIDE_DOWN");
    expect(lockNameForPolicy("landscape")).toBe("LANDSCAPE");
  });
});

describe("applyOrientationForScreen", () => {
  function makeDeps(env: OrientationEnvironment) {
    return {
      ...env,
      lockAsync: vi.fn(async () => undefined),
      webLock: vi.fn(async () => undefined),
      webUnlock: vi.fn(() => undefined),
    };
  }

  it("locks native devices through expo-screen-orientation", async () => {
    const deps = makeDeps(native);
    await applyOrientationForScreen("lobby", deps);
    await applyOrientationForScreen("game", deps);
    expect(deps.lockAsync.mock.calls).toEqual([["PORTRAIT_UP"], ["ALL_BUT_UPSIDE_DOWN"]]);
    expect(deps.webLock).not.toHaveBeenCalled();
  });

  it("never calls expo lockAsync on web", async () => {
    const mobile = makeDeps(mobileWeb);
    await applyOrientationForScreen("login", mobile);
    await applyOrientationForScreen("game", mobile);
    expect(mobile.lockAsync).not.toHaveBeenCalled();
    // 모바일 웹은 브라우저 Screen Orientation API 로 잠금/해제
    expect(mobile.webLock).toHaveBeenCalledWith("portrait");
    expect(mobile.webUnlock).toHaveBeenCalledTimes(1);

    const desktop = makeDeps(desktopWeb);
    await applyOrientationForScreen("game", desktop);
    expect(desktop.lockAsync).not.toHaveBeenCalled();
    expect(desktop.webLock).not.toHaveBeenCalled();
    expect(desktop.webUnlock).not.toHaveBeenCalled();
  });

  it("swallows lock failures so navigation never breaks", async () => {
    const deps = makeDeps(native);
    deps.lockAsync.mockRejectedValueOnce(new Error("unsupported"));
    await expect(applyOrientationForScreen("game", deps)).resolves.toBeUndefined();

    const web = makeDeps(mobileWeb);
    web.webLock.mockRejectedValueOnce(new Error("not fullscreen"));
    await expect(applyOrientationForScreen("login", web)).resolves.toBeUndefined();
  });
});
