export type CalendarDay = {
  /** "YYYY-MM-DD" */
  date: string;
  day: number;
  /** 表示中の月に含まれる日か（前後の月のはみ出し分は false） */
  inMonth: boolean;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * 月カレンダー用に「日曜はじまりの週 × 7日」の配列を作る。
 * month は 1〜12。タイムゾーンの影響を受けないよう UTC で計算する。
 */
export function buildMonthGrid(year: number, month: number): CalendarDay[][] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const start = new Date(first);
  start.setUTCDate(1 - first.getUTCDay()); // その週の日曜日まで戻る

  const weeks: CalendarDay[][] = [];
  const cursor = new Date(start);
  do {
    const week: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({
        date: toKey(cursor),
        day: cursor.getUTCDate(),
        inMonth: cursor.getUTCMonth() === month - 1,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
  } while (cursor.getUTCMonth() === month - 1);

  return weeks;
}

/** "YYYY-MM-DD" → { year, month } */
export function yearMonthOf(date: string): { year: number; month: number } {
  const [year, month] = date.split("-").map(Number);
  return { year, month };
}

/** 月を delta だけずらす */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}
