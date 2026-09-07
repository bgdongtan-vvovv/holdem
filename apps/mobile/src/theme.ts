import { brandTokens } from "./brand/tokens";

export const theme = {
  // Legacy aliases; new code should consume brandTokens directly.
  bg: brandTokens.color.surface,
  bgTop: brandTokens.color.surfaceRaised,

  feltTop: brandTokens.color.felt,
  felt: brandTokens.color.felt,
  feltBottom: brandTokens.color.feltEdge,
  rail: brandTokens.color.feltEdge,
  railHi: brandTokens.color.surfaceRaised,

  gold: brandTokens.color.gold,
  goldDeep: brandTokens.color.walnut,
  text: brandTokens.color.text,
  textMuted: brandTokens.color.textMuted,

  chipBubble: brandTokens.color.stack,
  chipBubbleEdge: brandTokens.color.surfaceRaised,
  callBubble: brandTokens.color.success,

  namePlate: brandTokens.color.surfaceOverlay,
  namePlateActive: brandTokens.color.gold,

  danger: brandTokens.color.red,
  callBtn: brandTokens.color.success,
  success: brandTokens.color.success,

  cardFace: brandTokens.color.text,
  cardBack: brandTokens.color.walnut,
  cardBackLine: brandTokens.color.gold,
  red: brandTokens.color.red,
  black: brandTokens.color.surface,

  buttonBg: brandTokens.color.surfaceRaised,
  seatEmpty: brandTokens.color.surfaceRaised,
} as const;

// 좌석용 자리표시 아바타 (실제 아트 애셋으로 교체 예정)
export const AVATAR_EMOJI = ["🧑", "🦍", "🐧", "🧑‍🦱", "👩", "🐵", "🤠", "🦊"] as const;
export const AVATAR_BG = ["#3b5bdb", "#2b8a3e", "#1098ad", "#e8590c", "#9c36b5", "#c2255c", "#5c940d", "#e67700"] as const;
