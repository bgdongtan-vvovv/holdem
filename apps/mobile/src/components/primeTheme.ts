/**
 * Prime Poker 레퍼런스(샘플사진/ 폴더) 기반 비주얼 토큰.
 * 테이블·로그인·로비가 같은 톤(차콜/우드 + 골드 + 버건디 CTA)을 공유하도록 한 곳에 모은다.
 */
export const prime = {
  bg: "#0e0e0f",
  panel: "#1b1b1d",
  panelHi: "#262628",
  panelBorder: "#343437",
  hairline: "rgba(255,255,255,0.08)",

  text: "#f2f2f2",
  textDim: "#a9a9ad",
  textMuted: "#6f6f74",

  gold: "#f2c14e",
  goldSoft: "#d9b26a",
  goldTagTop: "#efe2b8",
  goldTagBottom: "#b99d61",
  goldTagText: "#2a2114",
  logoGold: "#b8955a",

  stackBlue: "#5fb2ff",
  heroName: "#ff9a2e",
  online: "#3fd36b",

  red: "#b8262f",
  redDeep: "#7a141b",
  redGlow: "#e0414a",
  green: "#1f7a39",
  levelBadge: "#3a1013",
  levelBadgeBorder: "#8f2c31",

  cardBack: "#7c2228",
  cardBackDeep: "#5a141a",
  cardBackLine: "#a8434a",

  dealer: "#f6c519",
  dealerText: "#7a5600",
} as const;

export type FeltId = "charcoal" | "burgundy" | "green" | "navy";

export const FELTS: { id: FeltId; swatch: string; source: number }[] = [
  { id: "charcoal", swatch: "#3a3530", source: require("../../assets/images/prime-table-charcoal.jpg") },
  { id: "burgundy", swatch: "#7a1a20", source: require("../../assets/images/prime-table-burgundy.jpg") },
  { id: "green", swatch: "#17582f", source: require("../../assets/images/prime-table-green.jpg") },
  { id: "navy", swatch: "#1a2c63", source: require("../../assets/images/prime-table-navy.jpg") },
];

export function feltSource(id: FeltId): number {
  return (FELTS.find((f) => f.id === id) ?? FELTS[0]!).source;
}
