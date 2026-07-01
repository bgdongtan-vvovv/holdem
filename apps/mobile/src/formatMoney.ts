export function formatGameMoney(amount: number): string {
  return `${Math.max(0, Math.round(amount)).toLocaleString("ko-KR")}만원`;
}
