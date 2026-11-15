import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { fakeOwmFetch } from "@/test/fixtures";
import { GET } from "./route";

const req = (q: string) => new NextRequest(`http://localhost/api/weather?${q}`);

describe("GET /api/weather", () => {
  it("API キーが未設定なら 500", async () => {
    vi.stubEnv("OPENWEATHER_API_KEY", "");
    const res = await GET(req("city=Tokyo"));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/OPENWEATHER_API_KEY/);
  });

  it("クエリが不正なら 400", async () => {
    vi.stubEnv("OPENWEATHER_API_KEY", "k");
    expect((await GET(req("lat=999&lon=0"))).status).toBe(400);
  });

  it("成功時は整形した天気を返し、キーはレスポンスに含めない", async () => {
    vi.stubEnv("OPENWEATHER_API_KEY", "secret-key");
    vi.stubGlobal("fetch", fakeOwmFetch());
    const res = await GET(req("city=Tokyo"));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain("secret-key");
    expect(JSON.parse(text).daily).toHaveLength(2);
  });
});
