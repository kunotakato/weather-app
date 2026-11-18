import { localDate, localHour, localTime } from "./date";
import type { ErrorCode } from "./errors";
import type {
  CurrentWeather,
  DailyForecast,
  HourlyForecast,
  Place,
  WeatherResponse,
} from "./types";

/*
 * OpenWeatherMap（無料プラン）とのやり取りをまとめたファイル。
 * 使う API:
 *   - Geocoding API      … 都市名 → 緯度・経度
 *   - Current Weather    … 現在の天気
 *   - 5 day / 3 hour     … 5日先まで 3時間ごとの予報（降水確率 pop もここに入っている）
 * API キーはサーバー側（Route Handler）でだけ使い、ブラウザには渡さない。
 */

const BASE = "https://api.openweathermap.org";

/** 呼び出し側（Route Handler）で HTTP ステータスに変換するためのエラー */
export class WeatherApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: ErrorCode,
  ) {
    super(message);
    this.name = "WeatherApiError";
  }
}

// ---- OpenWeatherMap が返す JSON のうち、使う部分だけの型 ----

type OwmWeather = { id: number; description: string; icon: string };

type OwmGeo = {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
};

type OwmCurrent = {
  dt: number;
  timezone: number;
  weather: OwmWeather[];
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number };
};

export type OwmForecastItem = {
  dt: number;
  main: { temp: number; temp_min: number; temp_max: number; humidity: number };
  weather: OwmWeather[];
  pop: number;
};

type OwmForecast = {
  list: OwmForecastItem[];
  city: { name: string; country: string; timezone: number };
};

type Fetch = typeof fetch;

async function getJson<T>(url: URL, fetchImpl: Fetch): Promise<T> {
  let res: Response;
  try {
    // 8 秒待っても返事がなければあきらめる（画面がずっと「読み込み中」にならないように）
    res = await fetchImpl(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  } catch {
    throw new WeatherApiError("天気サービスに接続できませんでした。", 502, "UPSTREAM");
  }
  if (res.status === 401) {
    throw new WeatherApiError(
      "API キーが無効です。キー発行直後は有効になるまで最大 2 時間ほどかかります。",
      502,
      "INVALID_KEY",
    );
  }
  if (res.status === 429) {
    throw new WeatherApiError("API の呼び出し回数の上限に達しました。少し待ってから試してください。", 503, "RATE_LIMIT");
  }
  if (!res.ok) {
    throw new WeatherApiError(`天気サービスがエラーを返しました（${res.status}）。`, 502, "UPSTREAM");
  }
  return (await res.json()) as T;
}

function buildUrl(path: string, params: Record<string, string | number>, apiKey: string): URL {
  const url = new URL(path, BASE);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  url.searchParams.set("appid", apiKey);
  return url;
}

function toPlace(geo: OwmGeo): Place {
  return {
    name: geo.local_names?.ja ?? geo.name,
    country: geo.country,
    lat: geo.lat,
    lon: geo.lon,
  };
}

/** アイコン名の末尾 d / n で昼か夜かを判断する（例: "10d"） */
function isDayIcon(icon: string | undefined): boolean {
  return !icon?.endsWith("n");
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * 3時間ごとの予報を「その土地の日付」ごとにまとめ、1日分の予報にする。
 * - 最高/最低気温: その日の値の最大/最小
 * - 降水確率: その日の中で最も高い値（「その日のどこかで降るかも」の目安）
 * - 天気: 正午に最も近い時間帯の天気を代表にする
 */
export function toDailyForecasts(items: OwmForecastItem[], offsetSeconds: number): DailyForecast[] {
  const groups = new Map<string, OwmForecastItem[]>();
  for (const item of items) {
    const date = localDate(item.dt, offsetSeconds);
    const group = groups.get(date) ?? [];
    group.push(item);
    groups.set(date, group);
  }

  return [...groups.entries()].map(([date, group]) => {
    const representative = group.reduce((best, item) =>
      Math.abs(localHour(item.dt, offsetSeconds) - 12) < Math.abs(localHour(best.dt, offsetSeconds) - 12)
        ? item
        : best,
    );
    const hours: HourlyForecast[] = group.map((item) => ({
      time: localTime(item.dt, offsetSeconds),
      temp: round1(item.main.temp),
      humidity: item.main.humidity,
      pop: Math.round(item.pop * 100),
      weatherId: item.weather[0]?.id ?? 800,
      description: item.weather[0]?.description ?? "",
      isDay: isDayIcon(item.weather[0]?.icon),
    }));

    return {
      date,
      tempMin: round1(Math.min(...group.map((i) => i.main.temp_min))),
      tempMax: round1(Math.max(...group.map((i) => i.main.temp_max))),
      humidity: Math.round(group.reduce((sum, i) => sum + i.main.humidity, 0) / group.length),
      pop: Math.max(...hours.map((h) => h.pop)),
      weatherId: representative.weather[0]?.id ?? 800,
      description: representative.weather[0]?.description ?? "",
      hours,
    };
  });
}

function toCurrent(data: OwmCurrent): CurrentWeather {
  return {
    observedAt: data.dt,
    temp: round1(data.main.temp),
    feelsLike: round1(data.main.feels_like),
    humidity: data.main.humidity,
    windSpeed: round1(data.wind.speed),
    weatherId: data.weather[0]?.id ?? 800,
    description: data.weather[0]?.description ?? "",
    isDay: isDayIcon(data.weather[0]?.icon),
  };
}

export type WeatherQuery = { city: string } | { lat: number; lon: number };

/** 都市名 or 緯度経度から、現在の天気と日ごとの予報をまとめて取得する */
export async function fetchWeather(
  query: WeatherQuery,
  apiKey: string,
  fetchImpl: Fetch = fetch,
): Promise<WeatherResponse> {
  // 1. 場所を決める（都市名なら緯度経度に変換、緯度経度なら地名に変換）
  let place: Place;
  if ("city" in query) {
    const found = await getJson<OwmGeo[]>(
      buildUrl("/geo/1.0/direct", { q: query.city, limit: 1 }, apiKey),
      fetchImpl,
    );
    if (found.length === 0) {
      throw new WeatherApiError(`「${query.city}」が見つかりませんでした。`, 404, "NOT_FOUND");
    }
    place = toPlace(found[0]);
  } else {
    const found = await getJson<OwmGeo[]>(
      buildUrl("/geo/1.0/reverse", { lat: query.lat, lon: query.lon, limit: 1 }, apiKey),
      fetchImpl,
    );
    place = found[0]
      ? { ...toPlace(found[0]), lat: query.lat, lon: query.lon }
      : { name: "現在地", country: "", lat: query.lat, lon: query.lon };
  }

  // 2. 現在の天気と予報を「同時に」取りに行く（待ち時間を短くする）
  const common = { lat: place.lat, lon: place.lon, units: "metric", lang: "ja" };
  const [current, forecast] = await Promise.all([
    getJson<OwmCurrent>(buildUrl("/data/2.5/weather", common, apiKey), fetchImpl),
    getJson<OwmForecast>(buildUrl("/data/2.5/forecast", common, apiKey), fetchImpl),
  ]);

  const offset = forecast.city.timezone;
  return {
    place,
    timezoneOffset: offset,
    today: localDate(current.dt, offset),
    current: toCurrent(current),
    daily: toDailyForecasts(forecast.list, offset),
  };
}
