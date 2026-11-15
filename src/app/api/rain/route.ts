import type { NextRequest } from "next/server";
import { parseLatLon } from "@/lib/query";
import { fetchRainfall } from "@/lib/yahoo";

/**
 * GET /api/rain?lat=35.68&lon=139.76
 * Yahoo! JAPAN の気象情報 API で「この先 1 時間の雨」を取得する（任意機能）。
 * YAHOO_CLIENT_ID が未設定なら { enabled: false } を返し、画面側は表示しない。
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.YAHOO_CLIENT_ID;
  if (!clientId) return Response.json({ enabled: false });

  const position = parseLatLon(request.nextUrl.searchParams);
  if (!position) {
    return Response.json({ error: "緯度・経度（lat, lon）を指定してください。" }, { status: 400 });
  }

  try {
    const points = await fetchRainfall(position.lat, position.lon, clientId);
    return Response.json(
      { enabled: true, points },
      { headers: { "Cache-Control": "public, s-maxage=300" } },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Yahoo! の降水情報を取得できませんでした。" }, { status: 502 });
  }
}
