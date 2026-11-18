import { describe, expect, it } from "vitest";
import { fetchWeather } from "./openweather";
import { viewAt } from "./freshness";
import { fakeOwmFetch } from "@/test/fixtures";

describe("viewAt", () => {
  it("今日以降の予報だけを残し、今の日時から「これから」を決める", async () => {
    const data = await fetchWeather({ city: "Tokyo" }, "k", fakeOwmFetch()); // 11/13〜14、観測 11/13 10:00
    const view = viewAt(data, Date.parse("2026-11-14T08:00:00+09:00"));
    expect(view.today).toBe("2026-11-14");
    expect(view.daily.map((d) => d.date)).toEqual(["2026-11-14"]);
    expect(view.fromSlot).toBe("2026-11-14 05:00");
    expect(view.currentIsToday).toBe(false);
  });

  it("取得した日に見るなら、すべてそのまま", async () => {
    const data = await fetchWeather({ city: "Tokyo" }, "k", fakeOwmFetch());
    const view = viewAt(data, Date.parse("2026-11-13T10:00:00+09:00"));
    expect(view.daily).toHaveLength(2);
    expect(view.currentIsToday).toBe(true);
  });
});
