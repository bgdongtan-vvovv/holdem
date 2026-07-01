import { Audio } from "expo-av";

export type MusicTrack = "lobby" | "table";

const TRACKS = {
  lobby: require("../../assets/sounds/mp3/music_lobby.mp3"),
  table: require("../../assets/sounds/mp3/ambience_table.mp3"),
} as const;

let current: Audio.Sound | null = null;
let currentTrack: MusicTrack | null = null;
let enabled = true;

export async function playMusic(track: MusicTrack): Promise<void> {
  if (!enabled || currentTrack === track) return;
  await stopMusic();
  try {
    const { sound } = await Audio.Sound.createAsync(TRACKS[track], {
      isLooping: true,
      shouldPlay: true,
      volume: track === "lobby" ? 0.2 : 0.12,
    });
    current = sound;
    currentTrack = track;
  } catch {
    current = null;
    currentTrack = null;
  }
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
