"use client";

import { useCallback, useEffect, useState } from "react";
import { getRain, getWeather } from "@/lib/client";
import type { WeatherQuery } from "@/lib/openweather";
import type { RainPoint, WeatherResponse } from "@/lib/types";
import { CurrentWeatherCard } from "./CurrentWeatherCard";
import { DayDetail } from "./DayDetail";
import { ForecastCalendar } from "./ForecastCalendar";
import { RainNowcast } from "./RainNowcast";
import { SearchBar } from "./SearchBar";

const DEFAULT_QUERY: WeatherQuery = { city: "Tokyo,JP" };

export function WeatherApp() {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [rain, setRain] = useState<RainPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** 取得に成功したとき: 画面の状態を更新し、日本国内なら Yahoo! の雨情報も取りに行く */
  const showWeather = useCallback((result: WeatherResponse) => {
    setData(result);
    setSelectedDate(result.today);
    setError(null);
    setRain(null);
    setLoading(false);
    // Yahoo! の降水情報は日本国内のみ。失敗しても本体の表示には影響させない
    if (result.place.country === "JP") {
      getRain(result.place.lat, result.place.lon)
        .then((r) => setRain(r.enabled ? r.points : null))
        .catch(() => setRain(null));
    }
  }, []);

  const showError = useCallback((e: unknown) => {
    setError(e instanceof Error ? e.message : "天気を取得できませんでした。");
    setLoading(false);
  }, []);

  const load = (query: WeatherQuery) => {
    setLoading(true);
    getWeather(query).then(showWeather, showError);
  };

  // 最初の表示: 東京の天気（画面を閉じた後に結果が届いても反映しない）
  useEffect(() => {
    let active = true;
    getWeather(DEFAULT_QUERY).then(
      (result) => active && showWeather(result),
      (e) => active && showError(e),
    );
    return () => {
      active = false;
    };
  }, [showWeather, showError]);

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setError("このブラウザは位置情報に対応していません。");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => load({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {
        setLoading(false);
        setError("現在地を取得できませんでした。ブラウザの位置情報の許可を確認してください。");
      },
      { timeout: 10000, maximumAge: 600000 },
    );
  };

  const selectedDay = data?.daily.find((d) => d.date === selectedDate) ?? data?.daily[0];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-5 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">☁️ そらもよう</h1>
        <p className="text-sm text-slate-600">都市名か現在地で、今の天気と5日先までの予報を確認できます。</p>
      </header>

      <SearchBar disabled={loading} onSearch={(city) => load({ city })} onLocate={locate} />

      <div aria-live="polite">
        {loading && <p className="text-sm text-slate-500">読み込み中…</p>}
        {error && (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        )}
      </div>

      {data && selectedDay && (
        <>
          <CurrentWeatherCard data={data} />
          {rain && <RainNowcast points={rain} />}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <ForecastCalendar
              // 場所が変わったらカレンダーの表示月をリセットする
              key={`${data.place.lat},${data.place.lon}`}
              daily={data.daily}
              today={data.today}
              selectedDate={selectedDay.date}
              onSelect={setSelectedDate}
            />
            <DayDetail day={selectedDay} isToday={selectedDay.date === data.today} />
          </div>
        </>
      )}

      <footer className="pt-4 text-xs text-slate-500">
        天気データ:{" "}
        <a className="underline" href="https://openweathermap.org/" target="_blank" rel="noreferrer">
          OpenWeather
        </a>
        {rain && (
          <>
            {" / "}
            <a className="underline" href="https://developer.yahoo.co.jp/sitemap/" target="_blank" rel="noreferrer">
              Web Services by Yahoo! JAPAN
            </a>
          </>
        )}
      </footer>
    </main>
  );
}
