import { describe, expect, it } from "vitest";
import { parseWeatherQuery } from "./query";

const q = (s: string) => parseWeatherQuery(new URLSearchParams(s));

describe("parseWeatherQuery", () => {
  it("都市名を受け付ける", () => expect(q("city=%20Tokyo%20")).toEqual({ city: "Tokyo" }));
  it("緯度経度を受け付ける", () => expect(q("lat=35.6&lon=139.7")).toEqual({ lat: 35.6, lon: 139.7 }));
  it("範囲外や空は null", () => {
    expect(q("lat=100&lon=0")).toBeNull();
    expect(q("lat=abc&lon=1")).toBeNull();
    expect(q("")).toBeNull();
    expect(q(`city=${"a".repeat(101)}`)).toBeNull();
  });
});
