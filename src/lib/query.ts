import type { WeatherQuery } from "./openweather";

/** URL のクエリ（?city= または ?lat=&lon=）を検証して取り出す。不正なら null */
export function parseWeatherQuery(params: URLSearchParams): WeatherQuery | null {
  const city = params.get("city")?.trim();
  if (city) return city.length <= 100 ? { city } : null;
  return parseLatLon(params);
}

export function parseLatLon(params: URLSearchParams): { lat: number; lon: number } | null {
  const latText = params.get("lat");
  const lonText = params.get("lon");
  if (!latText || !lonText) return null;
  const lat = Number(latText);
  const lon = Number(lonText);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}
