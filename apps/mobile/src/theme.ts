export const theme = {
  // 배경 (게임 테이블 화면 = 딥 네이비)
  bg: "#0a1020",
  bgTop: "#111a30",

  // 오벌 펠트 (블루)
  feltTop: "#1f6fb2",
  felt: "#12508c",
  feltBottom: "#0d3f70",
  rail: "#101418",
  railHi: "#2a2f36",

  gold: "#f2c14e",
  goldDeep: "#c9962b",
  text: "#f5f5f0",
  textMuted: "#9aa4b2",

  // 칩 베팅 말풍선
  chipBubble: "#8fd6a8",
  chipBubbleEdge: "#5fae7c",
  callBubble: "#7fd0b0",

  namePlate: "rgba(6,10,18,0.82)",
  namePlateActive: "#f2c14e",

  danger: "#c0392b",
  callBtn: "#2e7d5b",
  success: "#2ecc71",

  cardFace: "#fdfdf7",
  cardBack: "#20335c",
  cardBackLine: "#3a5591",
  red: "#d63030",
  black: "#1a1a1a",

  buttonBg: "#182238",
  seatEmpty: "rgba(255,255,255,0.06)",
} as const;

// 좌석용 자리표시 아바타 (실제 아트 애셋으로 교체 예정)
export const AVATAR_EMOJI = ["🧑", "🦍", "🐧", "🧑‍🦱", "👩", "🐵", "🤠", "🦊"] as const;
export const AVATAR_BG = ["#3b5bdb", "#2b8a3e", "#1098ad", "#e8590c", "#9c36b5", "#c2255c", "#5c940d", "#e67700"] as const;
