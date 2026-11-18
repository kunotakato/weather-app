import { describe, expect, it } from "vitest";
import { toDailyForecasts } from "./openweather";
import { next24Hours, tempTicks } from "./next24h";
import { forecastList, item, JST } from "@/test/fixtures";

describe("next24Hours", () => {
  it("日をまたいで時刻順に並べ、日付が変わった点に印を付ける", () => {
    const points = next24Hours(toDailyForecasts(forecastList, JST));
    expect(points.map((p) => p.key)).toEqual([
      "2026-11-13 09:00",
      "2026-11-13 12:00",
      "2026-11-13 21:00",
      "2026-11-14 00:00",
      "2026-11-14 12:00",
    ]);
    expect(points.map((p) => p.newDay)).toEqual([false, false, false, true, false]);
    expect(points[4]).toMatchObject({ temp: 14, pop: 80, description: "適度な雨" });
  });

  it("24時間分（3時間ごとに 8 点）だけ取り出す", () => {
    const list = Array.from({ length: 16 }, (_, i) =>
      item(new Date(Date.UTC(2026, 10, 13, i * 3)).toISOString().slice(0, 16), 10),
    );
    expect(next24Hours(toDailyForecasts(list, JST))).toHaveLength(8);
  });
});

describe("tempTicks", () => {
  it("きりのよい数字で、最低〜最高を含む", () => {
    expect(tempTicks([9.4, 14.2])).toEqual([8, 10, 12, 14, 16]);
    expect(tempTicks([-3, 18])).toEqual([-5, 0, 5, 10, 15, 20]);
  });
});
