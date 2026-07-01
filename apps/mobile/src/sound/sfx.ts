/**
 * 효과음 매니저 (expo-av). WAV 를 미리 로드해두고 이벤트에 맞춰 재생.
 * 자리표시 합성음 — 나중에 실제 사운드 파일로 교체만 하면 된다.
 */
import { Audio } from "expo-av";

const FILES = {
  click: require("../../assets/sounds/click.wav"),
  deal: require("../../assets/sounds/deal.wav"),
  chip: require("../../assets/sounds/chip.wav"),
  check: require("../../assets/sounds/check.wav"),
  fold: require("../../assets/sounds/fold.wav"),
  turn: require("../../assets/sounds/turn.wav"),
  win: require("../../assets/sounds/win.wav"),
} as const;

export type Sfx = keyof typeof FILES;

const sounds: Partial<Record<Sfx, Audio.Sound>> = {};
let enabled = true;
let initialized = false;

export async function initSfx(): Promise<void> {
  if (initialized) return;
  initialized = true;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true });
    await Promise.all(
      (Object.keys(FILES) as Sfx[]).map(async (k) => {
        const { sound } = await Audio.Sound.createAsync(FILES[k], { volume: 0.7 });
        sounds[k] = sound;
      }),
    );
  } catch {
    // 오디오 로드 실패는 조용히 무시 (사운드 없이 계속 플레이 가능)
  }
}

export function setSfxEnabled(v: boolean): void {
  enabled = v;
}

export function isSfxEnabled(): boolean {
  return enabled;
}

export function playSfx(name: Sfx): void {
  if (!enabled) return;
  const s = sounds[name];
  if (!s) return;
  s.replayAsync().catch(() => {});
}
