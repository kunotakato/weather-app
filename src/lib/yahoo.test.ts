import { describe, expect, it, vi } from "vitest";
import { jsonResponse } from "@/test/fixtures";
import { fetchRainfall, parseYahooWeather } from "./yahoo";

const sample = {
  Feature: [
    {
      Property: {
        WeatherList: {
          Weather: [
            { Type: "observation", Date: "202611131030", Rainfall: 0 },
            { Type: "forecast", Date: "202611131040", Rainfall: 1.25 },
          ],
        },
      },
    },
  ],
};

describe("parseYahooWeather", () => {
  it("時刻・降水強度・実測/予報を取り出す", () => {
    expect(parseYahooWeather(sample)).toEqual([
      { time: "10:30", rainfall: 0, kind: "observation" },
      { time: "10:40", rainfall: 1.25, kind: "forecast" },
    ]);
  });

  it("想定外の形でも空配列を返す", () => {
    expect(parseYahooWeather({})).toEqual([]);
  });
});

describe("fetchRainfall", () => {
  it("経度,緯度 の順で座標を送る", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(sample));
    await fetchRainfall(35.68, 139.76, "client-id", fetchMock);
    const url = new URL(String((fetchMock.mock.calls[0] as unknown[])[0]));
    expect(url.searchParams.get("coordinates")).toBe("139.76,35.68");
    expect(url.searchParams.get("appid")).toBe("client-id");
  });
});
