import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // 親フォルダ（Todo アプリ）ではなく、このフォルダをプロジェクトのルートとして扱う
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
