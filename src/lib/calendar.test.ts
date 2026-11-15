import { describe, expect, it } from "vitest";
import { buildMonthGrid, shiftMonth } from "./calendar";

describe("buildMonthGrid", () => {
  it("2026年11月は日曜はじまりで 5 週", () => {
    const weeks = buildMonthGrid(2026, 11);
    expect(weeks).toHaveLength(5);
    expect(weeks[0][0]).toEqual({ date: "2026-11-01", day: 1, inMonth: true });
    expect(weeks[4][6]).toEqual({ date: "2026-12-05", day: 5, inMonth: false });
  });

  it("前の月のはみ出しを含む", () => {
    const weeks = buildMonthGrid(2026, 12); // 12/1 は火曜
    expect(weeks[0][0]).toEqual({ date: "2026-11-29", day: 29, inMonth: false });
    expect(weeks[0][2].date).toBe("2026-12-01");
  });
});

describe("shiftMonth", () => {
  it("年をまたいで月を動かせる", () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });
});
