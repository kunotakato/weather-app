import { AppError, toErrorCode } from "./errors";
import type { WeatherQuery } from "./openweather";
import type { RainResponse, WeatherResponse } from "./types";

/** ブラウザから自分のサーバー（/api/...）を呼ぶ関数。API キーはここには出てこない */

/** これ以上待っても返事がなければ「時間切れ」にする（ミリ秒） */
const TIMEOUT_MS = 15000;

async function request<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const search = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new AppError("NETWORK");
  }

  let res: Response;
  try {
    res = await fetch(`${path}?${search}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    const timedOut = e instanceof DOMException && e.name === "TimeoutError";
    throw new AppError(timedOut ? "TIMEOUT" : "NETWORK");
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new AppError(toErrorCode(body?.code), body?.error);
  }
  return body as T;
}

export function getWeather(query: WeatherQuery): Promise<WeatherResponse> {
  return request<WeatherResponse>("/api/weather", query);
}

export function getRain(lat: number, lon: number): Promise<RainResponse> {
  return request<RainResponse>("/api/rain", { lat, lon });
}
