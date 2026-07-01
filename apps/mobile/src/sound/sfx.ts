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
  bet: require("../../assets/sounds/mp3/action_bet.mp3"),
  raise: require("../../assets/sounds/mp3/action_raise.mp3"),
  fold: require("../../assets/sounds/mp3/fold.mp3"),
  allin: require("../../assets/sounds/mp3/action_allin.mp3"),
  blind_post: require("../../assets/sounds/mp3/chip_single.mp3"),
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
  pot_win: 0.76,
  hand_showdown: 0.56,
  your_turn: 0.52,
  ui_click: 0.48,
  ui_confirm: 0.55,
  ui_back: 0.5,
};
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
