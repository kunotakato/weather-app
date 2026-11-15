import { describe, expect, it, vi } from "vitest";
import { fakeOwmFetch, forecastList, JST } from "@/test/fixtures";
import { fetchWeather, toDailyForecasts, WeatherApiError } from "./openweather";

describe("toDailyForecasts", () => {
  const days = toDailyForecasts(forecastList, JST);

  it("その土地の日付ごとにまとめる（UTC ではなく日本時間で区切る）", () => {
    expect(days.map((d) => d.date)).toEqual(["2026-11-13", "2026-11-14"]);
    // 2026-11-14 00:00 JST は UTC だと 13日 15:00 だが、14日に入る
    expect(days[1].hours[0].time).toBe("00:00");
  });

  it("最高・最低気温、平均湿度、最大降水確率を計算する", () => {
    expect(days[0]).toMatchObject({ tempMin: 11, tempMax: 19, humidity: 50, pop: 20 });
    expect(days[1]).toMatchObject({ tempMin: 9, tempMax: 15, humidity: 85, pop: 80 });
  });

  it("正午に最も近い時間帯の天気を代表にする", () => {
    expect(days[0]).toMatchObject({ weatherId: 801, description: "薄い雲" });
    expect(days[1]).toMatchObject({ weatherId: 501, description: "適度な雨" });
  });

  it("夜のアイコンを夜として扱う", () => {
    expect(days[0].hours.find((h) => h.time === "21:00")?.isDay).toBe(false);
  });
});

describe("fetchWeather", () => {
  it("都市名から現在の天気と日ごとの予報を返す", async () => {
    const fetchMock = vi.fn(fakeOwmFetch());
    const result = await fetchWeather({ city: "Tokyo" }, "test-key", fetchMock);

    expect(result.place).toEqual({ name: "東京都", country: "JP", lat: 35.68, lon: 139.76 });
    expect(result.today).toBe("2026-11-13");
    expect(result.current).toMatchObject({ temp: 16.2, humidity: 45, windSpeed: 3.3 });
    expect(result.daily).toHaveLength(2);

    // すべてのリクエストにキーが付き、日本語・摂氏で問い合わせている
    for (const [input] of fetchMock.mock.calls) {
      expect(new URL(String(input)).searchParams.get("appid")).toBe("test-key");
    }
    const forecastUrl = new URL(String(fetchMock.mock.calls.at(-1)![0]));
    expect(forecastUrl.searchParams.get("units")).toBe("metric");
    expect(forecastUrl.searchParams.get("lang")).toBe("ja");
  });

  it("緯度経度のときは逆ジオコーディングで地名を付ける", async () => {
    const fetchMock = vi.fn(fakeOwmFetch());
    const result = await fetchWeather({ lat: 35.6, lon: 139.7 }, "k", fetchMock);
    expect(new URL(String(fetchMock.mock.calls[0][0])).pathname).toBe("/geo/1.0/reverse");
    expect(result.place).toMatchObject({ name: "東京都", lat: 35.6, lon: 139.7 });
  });

  it("都市が見つからないと 404 のエラーにする", async () => {
    await expect(fetchWeather({ city: "zzz" }, "k", fakeOwmFetch({ geo: [] }))).rejects.toMatchObject({
      status: 404,
      message: "「zzz」が見つかりませんでした。",
    });
  });

  it("キーが無効（401）だと分かりやすいメッセージにする", async () => {
    const promise = fetchWeather({ city: "Tokyo" }, "bad", fakeOwmFetch({ status: 401 }));
    await expect(promise).rejects.toBeInstanceOf(WeatherApiError);
    await expect(promise).rejects.toThrow(/API キーが無効/);
  });
});
