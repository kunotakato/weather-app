import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { fakeOwmFetch } from "@/test/fixtures";
import { GET } from "./route";

const req = (q: string) => new NextRequest(`http://localhost/api/weather?${q}`);

describe("GET /api/weather", () => {
  it("都市が見つからなければ 404 と NOT_FOUND", async () => {
    vi.stubEnv("OPENWEATHER_API_KEY", "k");
    vi.stubGlobal("fetch", fakeOwmFetch({ geo: [] }));
    const res = await GET(req("city=zzz"));
    expect(res.status).toBe(404);
    expect((await res.json()).code).toBe("NOT_FOUND");
  });

  it("回数制限（429）なら 503 と RATE_LIMIT", async () => {
    vi.stubEnv("OPENWEATHER_API_KEY", "k");
    vi.stubGlobal("fetch", fakeOwmFetch({ status: 429 }));
    const res = await GET(req("city=Tokyo"));
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("RATE_LIMIT");
  });

  it("API キーが未設定なら 500", async () => {
    vi.stubEnv("OPENWEATHER_API_KEY", "");
    const res = await GET(req("city=Tokyo"));
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ code: "NO_KEY", error: expect.stringMatching(/OPENWEATHER_API_KEY/) });
  });

  it("クエリが不正なら 400", async () => {
    vi.stubEnv("OPENWEATHER_API_KEY", "k");
    const res = await GET(req("lat=999&lon=0"));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("BAD_QUERY");
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
