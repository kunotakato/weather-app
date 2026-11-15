import type { RainPoint } from "./types";

/*
 * Yahoo! JAPAN「YOLP 気象情報 API」とのやり取り。
 * Yahoo!天気の週間予報そのものを返す公開 API はないため、
 * 公開されている「気象情報 API」で、指定地点の降水強度（実測 + 60分先までの予報）を取得する。
 * https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/weather.html
 * 日本国内の地点のみ対応。
 */

const ENDPOINT = "https://map.yahooapis.jp/weather/V1/place";

type YahooWeather = { Type: string; Date: string; Rainfall: number };

type YahooResponse = {
  Feature?: { Property?: { WeatherList?: { Weather?: YahooWeather[] } } }[];
};

/** "202611131030" → "10:30" */
function toTime(date: string): string {
  return `${date.slice(8, 10)}:${date.slice(10, 12)}`;
}

export function parseYahooWeather(data: YahooResponse): RainPoint[] {
  const list = data.Feature?.[0]?.Property?.WeatherList?.Weather ?? [];
  return list.map((w) => ({
    time: toTime(w.Date),
    rainfall: Number(w.Rainfall) || 0,
    kind: w.Type === "observation" ? "observation" : "forecast",
  }));
}

export async function fetchRainfall(
  lat: number,
  lon: number,
  clientId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RainPoint[]> {
  const url = new URL(ENDPOINT);
  url.searchParams.set("coordinates", `${lon},${lat}`); // 経度,緯度 の順番なので注意
  url.searchParams.set("output", "json");
  url.searchParams.set("interval", "10");
  url.searchParams.set("appid", clientId);

  const res = await fetchImpl(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Yahoo! API error: ${res.status}`);
  return parseYahooWeather((await res.json()) as YahooResponse);
}
