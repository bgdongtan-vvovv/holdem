import { Audio } from "expo-av";

export type MusicTrack = "lobby" | "table";

const TRACKS = {
  lobby: require("../../assets/sounds/mp3/music_lobby.mp3"),
  table: require("../../assets/sounds/mp3/ambience_table.mp3"),
} as const;

const BASE_VOLUME: Record<MusicTrack, number> = { lobby: 0.2, table: 0.12 };

let current: Audio.Sound | null = null;
let currentTrack: MusicTrack | null = null;
let enabled = true;
/** 배경음 배수(0~1) — 설정 화면의 슬라이더가 조절한다. */
let musicVolumeMul = 1;

export async function playMusic(track: MusicTrack): Promise<void> {
  if (!enabled || currentTrack === track) return;
  await stopMusic();
  try {
    const { sound } = await Audio.Sound.createAsync(TRACKS[track], {
      isLooping: true,
      shouldPlay: true,
      volume: BASE_VOLUME[track] * musicVolumeMul,
    });
    current = sound;
    currentTrack = track;
  } catch {
    current = null;
    currentTrack = null;
  }
}

/** 배경음 볼륨을 0~1 로 설정하고, 재생 중인 트랙에도 즉시 반영한다. */
export function setMusicVolume(v: number): void {
  musicVolumeMul = Math.max(0, Math.min(1, v));
  if (current && currentTrack) {
    void current.setVolumeAsync(BASE_VOLUME[currentTrack] * musicVolumeMul).catch(() => {});
  }
}

export function getMusicVolume(): number {
  return musicVolumeMul;
}

export async function stopMusic(): Promise<void> {
  const sound = current;
  current = null;
  currentTrack = null;
  if (!sound) return;
  try {
    await sound.stopAsync();
    await sound.unloadAsync();
  } catch {
    // 음악 실패가 게임 진행을 막지 않게 한다.
  }
}

export function setMusicEnabled(value: boolean): void {
  enabled = value;
  if (!value) void stopMusic();
}
