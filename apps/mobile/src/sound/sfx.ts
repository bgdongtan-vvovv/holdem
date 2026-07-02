/** 효과음 매니저. 사용자 제공 MP3를 우선 사용하고 누락 항목만 기존 WAV로 대체한다. */
import { Audio } from "expo-av";

const FILES = {
  ui_click: require("../../assets/sounds/mp3/ui_click.mp3"),
  ui_confirm: require("../../assets/sounds/mp3/ui_confirm.mp3"),
  ui_back: require("../../assets/sounds/mp3/ui_back.mp3"),
  card_deal: require("../../assets/sounds/mp3/card_deal.mp3"),
  card_shuffle: require("../../assets/sounds/mp3/card_shuffle.mp3"),
  card_flip: require("../../assets/sounds/mp3/card_flip.mp3"),
  check: require("../../assets/sounds/mp3/action_check.mp3"),
  call: require("../../assets/sounds/mp3/action_call.mp3"),
  call_female: require("../../assets/sounds/mp3/action_call_female.mp3"),
  bet: require("../../assets/sounds/mp3/action_bet.mp3"),
  raise: require("../../assets/sounds/mp3/action_raise.mp3"),
  fold: require("../../assets/sounds/mp3/fold.mp3"),
  fold_female: require("../../assets/sounds/mp3/action_fold_female.mp3"),
  allin: require("../../assets/sounds/mp3/action_allin.mp3"),
  check_female: require("../../assets/sounds/mp3/action_check_female.mp3"),
  blind_post: require("../../assets/sounds/mp3/chip_single.mp3"),
  chips_drop: require("../../assets/sounds/mp3/chip_stack.mp3"),
  chips_collect: require("../../assets/sounds/mp3/chips_collect.mp3"),
  pot_win: require("../../assets/sounds/mp3/pot_push.mp3"),
  hand_showdown: require("../../assets/sounds/mp3/hand_showdown.mp3"),
  win: require("../../assets/sounds/win.wav"),
  lose: require("../../assets/sounds/lose.wav"),
  your_turn: require("../../assets/sounds/mp3/turn_start.mp3"),
  time_warning: require("../../assets/sounds/time_warning.wav"),
  notify: require("../../assets/sounds/mp3/notification.mp3"),
  chat: require("../../assets/sounds/chat.wav"),
} as const;

export type Sfx = keyof typeof FILES;

const sounds: Partial<Record<Sfx, Audio.Sound>> = {};
const VOLUME: Partial<Record<Sfx, number>> = {
  card_shuffle: 0.48,
  check: 0.61,
  call: 0.61,
  bet: 0.61,
  raise: 0.61,
  allin: 0.7,
  fold: 1,
  fold_female: 1,
  pot_win: 0.76,
  hand_showdown: 0.56,
  your_turn: 0.52,
  ui_click: 0.48,
  ui_confirm: 0.55,
  ui_back: 0.5,
};
const END_SILENCE_TRIM_MS: Partial<Record<Sfx, number>> = {
  check: 120,
  call: 120,
  bet: 120,
  raise: 120,
  allin: 120,
  fold: 120,
  check_female: 350,
  call_female: 350,
  fold_female: 350,
};
const ACTION_VOICES: Sfx[] = [
  "check",
  "check_female",
  "call",
  "call_female",
  "bet",
  "raise",
  "allin",
  "fold",
  "fold_female",
];
const ACTION_ADVANCE_DELAY_MS = 100;
let enabled = true;
let initialized = false;

export async function initSfx(): Promise<void> {
  if (initialized) return;
  initialized = true;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true });
    await Promise.all(
      (Object.keys(FILES) as Sfx[]).map(async (k) => {
        const { sound } = await Audio.Sound.createAsync(FILES[k], { volume: VOLUME[k] ?? 0.68 });
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

/** 효과음을 시작하고 해당 파일의 재생 시간이 끝날 때까지 기다린다. */
export async function playSfxAndWait(name: Sfx): Promise<void> {
  if (!enabled) return;
  const sound = sounds[name];
  if (!sound) return;

  try {
    if (ACTION_VOICES.includes(name)) {
      await Promise.all(
        ACTION_VOICES
          .filter((voice) => voice !== name)
          .map(async (voice) => {
            const other = sounds[voice];
            if (other) await other.stopAsync().catch(() => {});
          }),
      );
    }
    const status = await sound.getStatusAsync();
    const duration =
      status.isLoaded && typeof status.durationMillis === "number"
        ? status.durationMillis
        : 550;
    await sound.replayAsync();
    const audibleDuration = ACTION_VOICES.includes(name)
      ? ACTION_ADVANCE_DELAY_MS
      : Math.max(80, duration - (END_SILENCE_TRIM_MS[name] ?? 0));
    await new Promise<void>((resolve) => setTimeout(resolve, audibleDuration));
  } catch {
    // 재생 실패 시 게임 진행은 막지 않는다.
  }
}
