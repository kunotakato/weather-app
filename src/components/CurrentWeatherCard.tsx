import { weatherEmoji } from "@/lib/weatherIcon";
import type { WeatherResponse } from "@/lib/types";

type Props = {
  data: WeatherResponse;
  /** 本当の「今日」（古い保存データの today ではなく、今の日付） */
  today: string;
  /** 古いデータを表示しているときの観測時刻（例: "11月13日 10:00"）。最新なら null */
  observedLabel: string | null;
};

export function CurrentWeatherCard({ data, today, observedLabel }: Props) {
  const { place, current, daily } = data;
  // 今日の予報が無い（古すぎる保存データ）ときは「—」にする。別の日の値で代用しない
  const todayPop = daily.find((d) => d.date === today)?.pop;

  return (
    <section
      aria-labelledby="current-title"
      className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 p-5 text-white shadow-md"
    >
      <h2 id="current-title" className="text-lg font-semibold">
        {place.name}
        {place.country && <span className="ml-2 text-sm opacity-80">{place.country}</span>}
        <span className="ml-2 text-sm font-normal opacity-80">
          {observedLabel ? `の天気（${observedLabel} 時点）` : "の現在の天気"}
        </span>
      </h2>
      <div className="mt-2 flex items-center gap-4">
        <span className="text-6xl" aria-hidden="true">
          {weatherEmoji(current.weatherId, current.isDay)}
        </span>
        <div>
          <p className="text-5xl font-bold tabular-nums">{Math.round(current.temp)}°C</p>
          <p className="text-lg">{current.description}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="体感温度" value={`${Math.round(current.feelsLike)}°C`} />
        <Stat label="湿度" value={`${current.humidity}%`} />
        <Stat label="今日の降水確率" value={todayPop === undefined ? "—" : `${todayPop}%`} />
        <Stat label="風速" value={`${current.windSpeed} m/s`} />
      </dl>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/15 px-3 py-2">
      <dt className="text-xs opacity-90">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
