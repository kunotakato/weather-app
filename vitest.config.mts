import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // tsconfig.json の "@/*" → "./src/*" という書き方をテストでも使えるようにする
    tsconfigPaths: true,
  },
  test: {
    // jsdom = Node.js の中に「ブラウザのふり」をする環境を作る道具
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
