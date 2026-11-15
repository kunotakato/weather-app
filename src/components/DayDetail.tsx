import { formatDateJa } from "@/lib/date";
import { weatherEmoji } from "@/lib/weatherIcon";
import type { DailyForecast } from "@/lib/types";

export function DayDetail({ day, isToday }: { day: DailyForecast; isToday: boolean }) {
  return (
    <section aria-labelledby="day-title" className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 id="day-title" className="text-lg font-semibold">
        {formatDateJa(day.date)}
        {isToday && <span className="ml-2 rounded bg-sky-100 px-2 py-0.5 text-xs text-sky-800">今日</span>}
        <span className="ml-1 text-sm font-normal text-slate-500">の予報</span>
      </h2>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-5xl" aria-hidden="true">
          {weatherEmoji(day.weatherId)}
        </span>
        <p className="text-xl font-medium">{day.description}</p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="最高気温" value={`${Math.round(day.tempMax)}°C`} tone="text-rose-600" />
        <Stat label="最低気温" value={`${Math.round(day.tempMin)}°C`} tone="text-sky-700" />
        <Stat label="湿度（平均）" value={`${day.humidity}%`} />
        <Stat label="降水確率（最大）" value={`${day.pop}%`} />
      </dl>

      <h3 className="mt-5 text-sm font-semibold text-slate-600">3時間ごとの予報</h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[22rem] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th scope="col" className="py-1 pr-2">時刻</th>
              <th scope="col" className="py-1 pr-2">天気</th>
              <th scope="col" className="py-1 pr-2 text-right">気温</th>
              <th scope="col" className="py-1 pr-2 text-right">湿度</th>
              <th scope="col" className="py-1 text-right">降水確率</th>
            </tr>
          </thead>
          <tbody>
            {day.hours.map((h) => (
              <tr key={h.time} className="border-b border-slate-100 last:border-0">
                <th scope="row" className="py-1.5 pr-2 text-left font-medium tabular-nums">{h.time}</th>
                <td className="py-1.5 pr-2">
                  <span aria-hidden="true" className="mr-1">{weatherEmoji(h.weatherId, h.isDay)}</span>
                  {h.description}
                </td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{Math.round(h.temp)}°C</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{h.humidity}%</td>
                <td className="py-1.5 text-right tabular-nums">
                  <PopBar pop={h.pop} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Stat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`text-xl font-semibold tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
}

function PopBar({ pop }: { pop: number }) {
  return (
    <span className="inline-flex items-center justify-end gap-2">
      <span aria-hidden="true" className="hidden h-1.5 w-12 overflow-hidden rounded bg-slate-100 sm:inline-block">
        <span className="block h-full bg-sky-500" style={{ width: `${pop}%` }} />
      </span>
      {pop}%
    </span>
  );
}
