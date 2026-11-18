import { describe, expect, it } from "vitest";
import { getAdvice } from "./advice";
import type { CurrentWeather, DailyForecast } from "./types";

function day(overrides: Partial<DailyForecast> = {}): DailyForecast {
  return {
    date: "2026-11-15",
    tempMin: 15,
    tempMax: 21,
    humidity: 60,
    pop: 0,
    weatherId: 800,
    description: "晴天",
    hours: [
      { time: "09:00", temp: 17, humidity: 60, pop: 0, weatherId: 800, description: "晴天", isDay: true },
      { time: "12:00", temp: 21, humidity: 55, pop: 0, weatherId: 800, description: "晴天", isDay: true },
    ],
    ...overrides,
  };
}

const current: CurrentWeather = {
  observedAt: 0,
  temp: 20,
  feelsLike: 19.5,
  humidity: 60,
  windSpeed: 2,
  weatherId: 800,
  description: "晴天",
  isDay: true,
};

describe("傘のアドバイス", () => {
  it("降水確率 50% 以上なら傘が必要、降り始めの時刻も伝える", () => {
    const d = day({
      pop: 70,
      hours: [
        { time: "09:00", temp: 17, humidity: 60, pop: 10, weatherId: 803, description: "曇り", isDay: true },
        { time: "15:00", temp: 18, humidity: 80, pop: 70, weatherId: 500, description: "小雨", isDay: true },
      ],
    });
    expect(getAdvice(d).umbrella).toEqual({
      level: "needed",
      text: "傘を持っていきましょう（降水確率 最大70%、15:00ごろから注意）。",
    });
  });

  it("30〜49% なら折りたたみ傘", () => {
    expect(getAdvice(day({ pop: 30 })).umbrella.level).toBe("folding");
    expect(getAdvice(day({ pop: 49 })).umbrella.level).toBe("folding");
  });

  it("30% 未満なら傘はいらない", () => {
    expect(getAdvice(day({ pop: 29 })).umbrella.level).toBe("none");
  });
});

describe("服装のアドバイス", () => {
  it.each([
    [32, "熱中症"],
    [26, "半袖で快適"],
    [21, "長袖シャツ"],
    [17, "薄手の上着"],
    [13, "ジャケット"],
    [9, "コートが必要"],
    [6, "厚手のコート"],
    [2, "ダウンコート"],
  ])("最高気温 %i℃ → 「%s」", (tempMax, keyword) => {
    expect(getAdvice(day({ tempMax, tempMin: tempMax - 3 })).clothing).toContain(keyword);
  });

  it("今日は体感温度が低ければ、そちらで判断する", () => {
    // 最高気温は 21℃（長袖シャツ）だが、体感は 14℃ → ジャケット
    const advice = getAdvice(day(), { ...current, temp: 18, feelsLike: 14 });
    expect(advice.clothing).toContain("ジャケット");
    expect(advice.notes).toContain("体感温度は14℃。気温より寒く感じます。");
  });
});

describe("明日以降も体感温度を使う", () => {
  it("予報の体感温度が低ければ、そちらで服装を決めて注意も出す", () => {
    // 最高気温 21℃（長袖シャツ）だが、日中の体感は最高 15℃ → ジャケット
    const advice = getAdvice(day({ tempMax: 21, tempMin: 15, feelsLikeMax: 15 }));
    expect(advice.clothing).toContain("ジャケット");
    expect(advice.notes).toContain("日中の体感温度は最高15℃ほど。気温より寒く感じます。");
  });

  it("体感温度が無い古い保存データでは、気温で判断する", () => {
    expect(getAdvice(day({ tempMax: 21, feelsLikeMax: undefined })).clothing).toContain("長袖シャツ");
  });
});

describe("追加の注意", () => {
  it("寒暖差・強風・雪を知らせる", () => {
    const advice = getAdvice(day({ tempMin: 2, tempMax: 12, weatherId: 600 }), { ...current, windSpeed: 9.5 });
    expect(advice.notes).toEqual([
      "朝晩と日中の気温差が10℃あります。脱ぎ着しやすい服がおすすめです。",
      "風が強めです（9.5m/s）。傘より、フード付きの上着が便利かもしれません。",
      "雪の予報です。滑りにくい靴で出かけましょう。",
    ]);
  });

  it("穏やかな日は注意なし", () => {
    expect(getAdvice(day(), current).notes).toEqual([]);
  });
});
