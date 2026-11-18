import { describe, expect, it, vi } from "vitest";
import { getWeather } from "./client";
import { jsonResponse } from "@/test/fixtures";

describe("getWeather のエラーの種類", () => {
  it("通信できなければ NETWORK", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(getWeather({ city: "Tokyo" })).rejects.toMatchObject({ code: "NETWORK" });
  });

  it("時間切れなら TIMEOUT", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("timeout", "TimeoutError")));
    await expect(getWeather({ city: "Tokyo" })).rejects.toMatchObject({ code: "TIMEOUT" });
  });

  it("オフラインなら問い合わせずに NETWORK", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    await expect(getWeather({ city: "Tokyo" })).rejects.toMatchObject({ code: "NETWORK" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("サーバーが返した code とメッセージを使う", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "上限です", code: "RATE_LIMIT" }, 503)));
    await expect(getWeather({ city: "Tokyo" })).rejects.toMatchObject({ code: "RATE_LIMIT", message: "上限です" });
  });

  it("知らない code や JSON でない応答は UNKNOWN", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>", { status: 500 })));
    await expect(getWeather({ city: "Tokyo" })).rejects.toMatchObject({ code: "UNKNOWN" });
  });
});
