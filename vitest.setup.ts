import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  localStorage.clear(); // 前回データの保存（機能3）がテスト間で残らないように
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
