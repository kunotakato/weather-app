/** UNIX秒 + タイムゾーンのずれ（秒）から、その土地の Date（UTC として読む）を作る */
function toLocal(unixSeconds: number, offsetSeconds: number): Date {
  return new Date((unixSeconds + offsetSeconds) * 1000);
}

/** その土地の日付 "YYYY-MM-DD" */
export function localDate(unixSeconds: number, offsetSeconds: number): string {
  return toLocal(unixSeconds, offsetSeconds).toISOString().slice(0, 10);
}

/** その土地の時刻 "HH:mm" */
export function localTime(unixSeconds: number, offsetSeconds: number): string {
  return toLocal(unixSeconds, offsetSeconds).toISOString().slice(11, 16);
}

/** その土地の「時」(0〜23) */
export function localHour(unixSeconds: number, offsetSeconds: number): number {
  return toLocal(unixSeconds, offsetSeconds).getUTCHours();
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** "2026-11-13" → "11月13日（金）" */
export function formatDateJa(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}月${d}日（${weekday}）`;
}
