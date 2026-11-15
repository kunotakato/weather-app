import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "そらもよう | 天気予報",
  description: "OpenWeatherMap と連携した天気予報アプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
