import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWeather } from "@/lib/openweather";
import { fakeOwmFetch, jsonResponse } from "@/test/fixtures";
import { WeatherApp } from "./WeatherApp";

/** ブラウザ → 自分のサーバー（/api/...）の呼び出しを偽物にする */
async function stubApi(options: { rain?: boolean; weatherError?: string } = {}) {
  const weather = await fetchWeather({ city: "Tokyo" }, "k", fakeOwmFetch());
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("/api/weather")) {
      return options.weatherError
        ? jsonResponse({ error: options.weatherError }, 404)
        : jsonResponse(weather);
    }
    if (url.startsWith("/api/rain")) {
      return jsonResponse(
        options.rain
          ? { enabled: true, points: [{ time: "10:40", rainfall: 2, kind: "forecast" }] }
          : { enabled: false },
      );
    }
    throw new Error(url);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("WeatherApp", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("最初に東京の現在の天気（気温・湿度・降水確率）と今日の予報を表示する", async () => {
    await stubApi();
    render(<WeatherApp />);

    const current = await screen.findByRole("region", { name: /東京都.*現在の天気/ });
    expect(within(current).getByText("16°C")).toBeInTheDocument();
    expect(within(current).getByText("45%")).toBeInTheDocument();
    expect(within(current).getByText("20%")).toBeInTheDocument(); // 今日の降水確率

    expect(screen.getByRole("heading", { name: /11月13日（金）.*の予報/ })).toBeInTheDocument();
  });

  it("カレンダーで日付を選ぶと、その日の予報に切り替わる", async () => {
    await stubApi();
    const user = userEvent.setup();
    render(<WeatherApp />);

    const day14 = await screen.findByRole("button", { name: /11月14日（土）/ });
    expect(day14).toHaveAttribute("aria-pressed", "false");
    await user.click(day14);

    expect(day14).toHaveAttribute("aria-pressed", "true");
    const detail = screen.getByRole("region", { name: /11月14日（土）/ });
    expect(within(detail).getAllByText("適度な雨").length).toBeGreaterThan(0);
    // 降水確率（最大）の欄が 80%
    expect(within(detail).getByText("降水確率（最大）").nextElementSibling).toHaveTextContent("80%");
  });

  it("予報のない日は選べない", async () => {
    await stubApi();
    render(<WeatherApp />);
    await screen.findByRole("region", { name: /現在の天気/ });
    expect(screen.queryByRole("button", { name: /11月20日/ })).not.toBeInTheDocument();
  });

  it("都市名で検索すると city を付けて問い合わせる", async () => {
    const fetchMock = await stubApi();
    const user = userEvent.setup();
    render(<WeatherApp />);
    await screen.findByRole("region", { name: /現在の天気/ });

    await user.type(screen.getByLabelText("都市名"), "Kyoto");
    await user.click(screen.getByRole("button", { name: "検索" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/weather?city=Kyoto");
  });

  it("エラーをメッセージで知らせる", async () => {
    await stubApi({ weatherError: "「zzz」が見つかりませんでした。" });
    render(<WeatherApp />);
    expect(await screen.findByRole("alert")).toHaveTextContent("「zzz」が見つかりませんでした。");
  });

  it("Yahoo! の設定があれば、この先1時間の雨を表示する", async () => {
    await stubApi({ rain: true });
    render(<WeatherApp />);
    expect(await screen.findByText("☔ 1時間以内に雨が降る予報です")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Web Services by Yahoo! JAPAN" })).toBeInTheDocument();
  });
});
