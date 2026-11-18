"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import { loadWeatherCache, saveWeatherCache } from "@/lib/cache";
import { getRain, getWeather } from "@/lib/client";
import { AppError, isFetchFailure } from "@/lib/errors";
import type { WeatherQuery } from "@/lib/openweather";
import type { RainPoint, WeatherResponse } from "@/lib/types";
import { AdviceCard } from "./AdviceCard";
import { CurrentWeatherCard } from "./CurrentWeatherCard";
import { DayDetail } from "./DayDetail";
import { ForecastCalendar } from "./ForecastCalendar";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { Next24hChart } from "./Next24hChart";
import { RainNowcast } from "./RainNowcast";
import { SearchBar } from "./SearchBar";
import { StatusPanel } from "./StatusPanel";

const DEFAULT_QUERY: WeatherQuery = { city: "Tokyo,JP" };

/**
 * 画面全体。保存データ（localStorage）はブラウザにしかないので、
 * サーバーで HTML を作る段階では「読み込み中」だけを出し、ブラウザで動き始めてから本体を表示する。
 */
export function WeatherApp() {
  const isClient = useIsClient();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-5 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">☁️ そらもよう</h1>
        <p className="text-sm text-slate-600">都市名か現在地で、今の天気と5日先までの予報を確認できます。</p>
      </header>
      {isClient ? <WeatherScreen /> : <LoadingSkeleton />}
    </main>
  );
}

/** 最後に行った操作（再試行で同じことをやり直すため） */
type LastAction = { type: "query"; query: WeatherQuery } | { type: "locate" };

function WeatherScreen() {
  // 前回保存したデータがあれば、最初からそれを表示しておく（lazy initializer = 最初の 1 回だけ実行）
  const [initial] = useState(loadWeatherCache);

  const [data, setData] = useState<WeatherResponse | null>(initial?.data ?? null);
  const [savedAt, setSavedAt] = useState<number | null>(initial?.savedAt ?? null);
  /** 表示中のデータが「前回保存したもの」で、まだ最新を取れていない */
  const [fromCache, setFromCache] = useState(initial !== null);
  const [selectedDate, setSelectedDate] = useState<string | null>(initial?.data.today ?? null);
  const [rain, setRain] = useState<RainPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [lastAction, setLastAction] = useState<LastAction>({
    type: "query",
    query: initial?.query ?? DEFAULT_QUERY,
  });

  /** 取得に成功したとき: 画面を更新して保存。日本国内なら Yahoo! の雨情報も取りに行く */
  const showWeather = useCallback((query: WeatherQuery, result: WeatherResponse) => {
    const now = Date.now();
    setData(result);
    setSavedAt(now);
    setFromCache(false);
    setSelectedDate(result.today);
    setError(null);
    setRain(null);
    setLoading(false);
    saveWeatherCache({ query, data: result, savedAt: now });
    // Yahoo! の降水情報は日本国内のみ。失敗しても本体の表示には影響させない
    if (result.place.country === "JP") {
      getRain(result.place.lat, result.place.lon)
        .then((r) => setRain(r.enabled ? r.points : null))
        .catch(() => setRain(null));
    }
  }, []);

  /** 失敗したとき: 表示中のデータは消さずに残し、エラーの案内だけ出す */
  const showError = useCallback((e: unknown) => {
    setError(e instanceof AppError ? e : new AppError("UNKNOWN"));
    setLoading(false);
  }, []);

  const load = (query: WeatherQuery) => {
    setLastAction({ type: "query", query });
    setLoading(true);
    getWeather(query).then((result) => showWeather(query, result), showError);
  };

  const locate = () => {
    setLastAction({ type: "locate" });
    if (!("geolocation" in navigator)) {
      showError(new AppError("GEO_UNAVAILABLE", "このブラウザは位置情報に対応していません。"));
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const query = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        getWeather(query).then((result) => showWeather(query, result), showError);
      },
      (err) => showError(new AppError(err.code === err.PERMISSION_DENIED ? "GEO_DENIED" : "GEO_UNAVAILABLE")),
      { timeout: 10000, maximumAge: 600000 },
    );
  };

  const retry = () => (lastAction.type === "locate" ? locate() : load(lastAction.query));

  // 最初の表示: 前回の場所（なければ東京）の最新の天気を取りに行く
  useEffect(() => {
    let active = true;
    const query = initial?.query ?? DEFAULT_QUERY;
    getWeather(query).then(
      (result) => active && showWeather(query, result),
      (e) => active && showError(e),
    );
    return () => {
      active = false;
    };
  }, [initial, showWeather, showError]);

  // 通信が切れて失敗していたら、つながった瞬間に自動で再試行する
  const onOnline = useEffectEvent(() => {
    if (error?.code === "NETWORK" && !loading) retry();
  });
  useEffect(() => {
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const selectedDay = data?.daily.find((d) => d.date === selectedDate) ?? data?.daily[0];
  const isStale = data !== null && (fromCache || (error !== null && isFetchFailure(error.code)));

  return (
    <>
      <SearchBar disabled={loading} onSearch={(city) => load({ city })} onLocate={locate} />

      <StatusPanel
        refreshing={loading && data !== null}
        error={error}
        staleSavedAt={isStale ? savedAt : null}
        onRetry={retry}
      />

      {/* 表示できるデータがまだ無いときだけ、全体の「読み込み中」を出す */}
      {!data && loading && <LoadingSkeleton />}

      {data && selectedDay && (
        <div aria-busy={loading} className={`space-y-5 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <CurrentWeatherCard data={data} />
          {rain && <RainNowcast points={rain} />}
          <AdviceCard
            day={selectedDay}
            current={selectedDay.date === data.today ? data.current : undefined}
          />
          <Next24hChart daily={data.daily} />
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
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
        </div>
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
    </>
  );
}
