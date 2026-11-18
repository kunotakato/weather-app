import type { WeatherQuery } from "./openweather";
import type { WeatherResponse } from "./types";

/*
 * 「前回取得した天気」をブラウザ（localStorage）に 1 件だけ保存する。
 * 通信できないときや API が失敗したときに、何も表示されないのを防ぐため。
 * 保存するのは天気のデータだけで、API キーは保存しない（そもそもブラウザは知らない）。
 */

export const CACHE_KEY = "weather-app:last";

export type WeatherCache = {
  query: WeatherQuery;
  data: WeatherResponse;
  /** 取得した時刻（ミリ秒） */
  savedAt: number;
};

export function saveWeatherCache(cache: WeatherCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // 容量オーバーやプライベートモードで保存できなくても、アプリはそのまま動かす
  }
}

/** 保存データを読む。無い・壊れている・形が違うときは null */
export function loadWeatherCache(): WeatherCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WeatherCache>;
    const ok =
      typeof parsed.savedAt === "number" &&
      parsed.query !== null &&
      typeof parsed.query === "object" &&
      typeof parsed.data?.today === "string" &&
      Array.isArray(parsed.data?.daily) &&
      typeof parsed.data?.current?.temp === "number";
    return ok ? (parsed as WeatherCache) : null;
  } catch {
    return null;
  }
}

/** 1713... → "11月16日 9:05" */
export function formatSavedAt(savedAt: number): string {
  const d = new Date(savedAt);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}
