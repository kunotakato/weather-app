import type { DailyForecast } from "./types";

export type ChartPoint = {
  /** "YYYY-MM-DD HH:mm"（重複しない識別子） */
  key: string;
  date: string;
  time: string;
  /** 日付が変わった最初の点だけ true（グラフに「16日」と出すため） */
  newDay: boolean;
  temp: number;
  pop: number;
  weatherId: number;
  description: string;
  isDay: boolean;
};

/** 無料枠の予報は 3 時間ごとなので、24 時間 = 8 点 */
export const POINTS_IN_24H = 8;

/**
 * 日ごとにまとめた予報を、時刻順の 1 本の列に戻して先頭から 24 時間分を取り出す。
 * OpenWeatherMap の予報は「次の 3 時間枠」から始まるので、先頭が「これから」になる。
 */
export function next24Hours(daily: DailyForecast[]): ChartPoint[] {
  const all = daily.flatMap((day) =>
    day.hours.map((h) => ({
      key: `${day.date} ${h.time}`,
      date: day.date,
      time: h.time,
      temp: h.temp,
      pop: h.pop,
      weatherId: h.weatherId,
      description: h.description,
      isDay: h.isDay,
    })),
  );
  return all.slice(0, POINTS_IN_24H).map((p, i, list) => ({
    ...p,
    newDay: i > 0 && p.date !== list[i - 1].date,
  }));
}

/** 気温の目盛り: 最低〜最高を少し広げ、きりのよい数字（2℃ / 5℃ 刻み）にする */
export function tempTicks(temps: number[]): number[] {
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const step = max - min > 12 ? 5 : 2;
  const lo = Math.floor((min - 1) / step) * step;
  const hi = Math.ceil((max + 1) / step) * step;
  const ticks: number[] = [];
  for (let t = lo; t <= hi; t += step) ticks.push(t);
  return ticks;
}
