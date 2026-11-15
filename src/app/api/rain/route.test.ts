import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/rain", () => {
  it("YAHOO_CLIENT_ID が未設定なら機能オフ", async () => {
    vi.stubEnv("YAHOO_CLIENT_ID", "");
    const res = await GET(new NextRequest("http://localhost/api/rain?lat=35&lon=139"));
    expect(await res.json()).toEqual({ enabled: false });
  });
});
