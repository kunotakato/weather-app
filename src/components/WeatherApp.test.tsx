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
        ? jsonResponse({ error: options.weatherError, code: "NOT_FOUND" }, 404)
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
    const detail = screen.getByRole("region", { name: /11月14日（土）.*の予報/ });
    expect(within(detail).getAllByText("適度な雨").length).toBeGreaterThan(0);
    // 降水確率（最大）の欄が 80%
    expect(within(detail).getByText("降水確率（最大）").nextElementSibling).toHaveTextContent("80%");
  });

  it("服装・傘アドバイスを表示し、選んだ日に合わせて切り替える", async () => {
    await stubApi();
    const user = userEvent.setup();
    render(<WeatherApp />);

    const today = await screen.findByRole("region", { name: "👕 今日の服装・傘アドバイス" });
    expect(within(today).getByText("傘はいらなそうです（降水確率 最大20%）。")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /11月14日（土）/ }));
    const tomorrow = screen.getByRole("region", { name: "👕 11月14日（土）の服装・傘アドバイス" });
    expect(within(tomorrow).getByText(/傘を持っていきましょう/)).toBeInTheDocument();
  });

  it("これから24時間の気温・降水確率グラフと、その表を表示する", async () => {
    await stubApi();
    const user = userEvent.setup();
    render(<WeatherApp />);

    const chart = await screen.findByRole("region", { name: "📈 これから24時間の予報" });
    const rows = within(within(chart).getByRole("table")).getAllByRole("row");
    expect(rows).toHaveLength(1 + 5); // 見出し + 予報 5 件（テスト用データ）
    expect(within(chart).getByRole("rowheader", { name: "14日 12:00" })).toBeInTheDocument();

    // ← → キーで時刻を選ぶと、値が読み上げ用テキストに出る
    within(chart).getByRole("group", { name: /気温と降水確率のグラフ/ }).focus();
    await user.keyboard("{ArrowRight}");
    expect(within(chart).getByText("13日 09:00、晴天、気温15度、降水確率10%")).toBeInTheDocument();
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

    expect(fetchMock).toHaveBeenCalledWith("/api/weather?city=Kyoto", expect.anything());
  });

  it("都市が見つからないときは、原因と次にやることを案内する（再試行ボタンは出さない）", async () => {
    await stubApi({ weatherError: "「zzz」が見つかりませんでした。" });
    render(<WeatherApp />);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("都市が見つかりませんでした");
    expect(alert).toHaveTextContent("「zzz」が見つかりませんでした。");
    expect(alert).toHaveTextContent("英語表記（例: Kyoto、Sapporo）");
    expect(within(alert).queryByRole("button", { name: /再試行/ })).not.toBeInTheDocument();
  });

  it("Yahoo! の設定があれば、この先1時間の雨を表示する", async () => {
    await stubApi({ rain: true });
    render(<WeatherApp />);
    expect(await screen.findByText("☔ 1時間以内に雨が降る予報です")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Web Services by Yahoo! JAPAN" })).toBeInTheDocument();
  });
});

describe("エラー対応（機能3）", () => {
  it("データが届くまでは「読み込み中」を表示する", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {}))); // 返事が来ないまま
    render(<WeatherApp />);
    expect(await screen.findByRole("status", { name: "天気を読み込み中" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "検索" })).toBeDisabled();
  });

  it("通信に失敗したら案内と再試行ボタンを出し、再試行で表示できる", async () => {
    const weather = await fetchWeather({ city: "Tokyo" }, "k", fakeOwmFetch());
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockImplementation(async (input: RequestInfo | URL) =>
        String(input).startsWith("/api/rain") ? jsonResponse({ enabled: false }) : jsonResponse(weather),
      );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<WeatherApp />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("インターネットに接続できません");
    await user.click(within(alert).getByRole("button", { name: /再試行/ }));

    expect(await screen.findByRole("region", { name: /東京都.*現在の天気/ })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("成功したデータは保存され、次に開いて取得に失敗しても前回のデータと時刻を表示する", async () => {
    // 1回目: 成功 → 保存される
    await stubApi();
    const first = render(<WeatherApp />);
    await screen.findByRole("region", { name: /東京都.*現在の天気/ });
    first.unmount();

    // 2回目: サーバーが不調
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "天気サービスがエラーを返しました（500）。", code: "UPSTREAM" }, 502)),
    );
    render(<WeatherApp />);

    // 保存しておいたデータがすぐに表示される
    expect(screen.getByRole("region", { name: /東京都.*現在の天気/ })).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("天気サービスが一時的に使えません");
    expect(screen.getByText(/前回取得したデータ（.+ 時点）を表示しています/)).toBeInTheDocument();
  });
});
