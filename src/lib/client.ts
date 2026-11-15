import type { WeatherQuery } from "./openweather";
import type { RainResponse, WeatherResponse } from "./types";

/** ブラウザから自分のサーバー（/api/...）を呼ぶ関数。API キーはここには出てこない */

async function request<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const search = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  );
  let res: Response;
  try {
    res = await fetch(`${path}?${search}`);
  } catch {
    throw new Error("ネットワークに接続できませんでした。");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `エラーが発生しました（${res.status}）。`);
  }
  return body as T;
}

export function getWeather(query: WeatherQuery): Promise<WeatherResponse> {
  return request<WeatherResponse>("/api/weather", query);
}

export function getRain(lat: number, lon: number): Promise<RainResponse> {
  return request<RainResponse>("/api/rain", { lat, lon });
}
