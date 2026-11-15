import type { OwmForecastItem } from "@/lib/openweather";

export const JST = 9 * 3600;

/** 日本時間の "YYYY-MM-DDTHH:mm" → UNIX秒 */
export function jst(dateTime: string): number {
  return Date.parse(`${dateTime}:00+09:00`) / 1000;
}

export function item(
  dateTime: string,
  temp: number,
  opts: Partial<{ pop: number; humidity: number; id: number; desc: string; icon: string }> = {},
): OwmForecastItem {
  return {
    dt: jst(dateTime),
    main: { temp, temp_min: temp - 1, temp_max: temp + 1, humidity: opts.humidity ?? 60 },
    weather: [{ id: opts.id ?? 800, description: opts.desc ?? "晴天", icon: opts.icon ?? "01d" }],
    pop: opts.pop ?? 0,
  };
}

/** 2026-11-13（金）〜 11-14 の予報 */
export const forecastList: OwmForecastItem[] = [
  item("2026-11-13T09:00", 15, { pop: 0.1, humidity: 50 }),
  item("2026-11-13T12:00", 18, { pop: 0.2, humidity: 40, id: 801, desc: "薄い雲" }),
  item("2026-11-13T21:00", 12, { pop: 0, humidity: 60, icon: "01n" }),
  item("2026-11-14T00:00", 10, { pop: 0.5, humidity: 80, id: 500, desc: "小雨" }),
  item("2026-11-14T12:00", 14, { pop: 0.8, humidity: 90, id: 501, desc: "適度な雨" }),
];

export const geoTokyo = [{ name: "Tokyo", local_names: { ja: "東京都" }, lat: 35.68, lon: 139.76, country: "JP" }];

export const currentTokyo = {
  dt: jst("2026-11-13T10:00"),
  timezone: JST,
  weather: [{ id: 800, description: "晴天", icon: "01d" }],
  main: { temp: 16.24, feels_like: 15.1, humidity: 45 },
  wind: { speed: 3.26 },
};

export const forecastTokyo = {
  list: forecastList,
  city: { name: "Tokyo", country: "JP", timezone: JST },
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** OpenWeatherMap の URL ごとに返すデータを切り替える偽の fetch */
export function fakeOwmFetch(overrides: { geo?: unknown; status?: number } = {}) {
  return async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (overrides.status) return jsonResponse({ message: "error" }, overrides.status);
    if (url.pathname.startsWith("/geo/")) return jsonResponse(overrides.geo ?? geoTokyo);
    if (url.pathname === "/data/2.5/weather") return jsonResponse(currentTokyo);
    if (url.pathname === "/data/2.5/forecast") return jsonResponse(forecastTokyo);
    throw new Error(`unexpected url ${url}`);
  };
}
