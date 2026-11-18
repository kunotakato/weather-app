import { describe, expect, it } from "vitest";
import { CACHE_KEY, loadWeatherCache, saveWeatherCache } from "./cache";
import { fetchWeather } from "./openweather";
import { fakeOwmFetch } from "@/test/fixtures";

describe("前回データの保存", () => {
  it("保存したものを読み戻せる", async () => {
    const data = await fetchWeather({ city: "Tokyo" }, "k", fakeOwmFetch());
    saveWeatherCache({ query: { city: "Tokyo" }, data, savedAt: 123 });
    expect(loadWeatherCache()).toEqual({ query: { city: "Tokyo" }, data, savedAt: 123 });
  });

  it("API キーは保存されない", async () => {
    const data = await fetchWeather({ city: "Tokyo" }, "secret-key", fakeOwmFetch());
    saveWeatherCache({ query: { city: "Tokyo" }, data, savedAt: 1 });
    expect(localStorage.getItem(CACHE_KEY)).not.toContain("secret-key");
  });

  it("無い・壊れている・形が違うときは null", () => {
    expect(loadWeatherCache()).toBeNull();
    localStorage.setItem(CACHE_KEY, "{壊れたJSON");
    expect(loadWeatherCache()).toBeNull();
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: 1, query: {}, data: {} }));
    expect(loadWeatherCache()).toBeNull();
  });
});
