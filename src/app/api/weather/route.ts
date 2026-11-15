import type { NextRequest } from "next/server";
import { fetchWeather, WeatherApiError } from "@/lib/openweather";
import { parseWeatherQuery } from "@/lib/query";

/**
 * GET /api/weather?city=Tokyo
 * GET /api/weather?lat=35.68&lon=139.76
 *
 * ブラウザから直接 OpenWeatherMap を呼ぶと API キーが丸見えになるため、
 * このサーバー側の窓口（Route Handler）を経由する。
 * キーは .env.local（本番は Vercel の Environment Variables）から読む。
 */
export async function GET(request: NextRequest) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "サーバーに OPENWEATHER_API_KEY が設定されていません。" },
      { status: 500 },
    );
  }

  const query = parseWeatherQuery(request.nextUrl.searchParams);
  if (!query) {
    return Response.json(
      { error: "都市名（city）か、緯度・経度（lat, lon）を指定してください。" },
      { status: 400 },
    );
  }

  try {
    const data = await fetchWeather(query, apiKey);
    return Response.json(data, {
      // 同じ問い合わせは 10 分間 CDN にキャッシュして、API の呼び出し回数を節約する
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300" },
    });
  } catch (error) {
    if (error instanceof WeatherApiError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return Response.json({ error: "天気の取得中に予期しないエラーが起きました。" }, { status: 500 });
  }
}
