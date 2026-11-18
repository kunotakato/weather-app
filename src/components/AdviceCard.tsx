import { getAdvice, type UmbrellaLevel } from "@/lib/advice";
import { formatDateJa } from "@/lib/date";
import type { CurrentWeather, DailyForecast } from "@/lib/types";

const UMBRELLA_STYLE: Record<UmbrellaLevel, { icon: string; className: string }> = {
  needed: { icon: "☔", className: "border-sky-300 bg-sky-50 text-sky-900" },
  folding: { icon: "🌂", className: "border-amber-300 bg-amber-50 text-amber-900" },
  none: { icon: "🙆", className: "border-emerald-200 bg-emerald-50 text-emerald-900" },
};

type Props = {
  day: DailyForecast;
  /** 今日のときだけ渡す（体感温度・風速も判定に使う） */
  current?: CurrentWeather;
};

/** 選んだ日の服装・傘アドバイス */
export function AdviceCard({ day, current }: Props) {
  const advice = getAdvice(day, current);
  const umbrella = UMBRELLA_STYLE[advice.umbrella.level];

  return (
    <section aria-labelledby="advice-title" className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 id="advice-title" className="text-lg font-semibold">
        👕 {current ? "今日" : formatDateJa(day.date)}の服装・傘アドバイス
      </h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        <li className={`rounded-lg border px-3 py-2 ${umbrella.className}`}>
          <span aria-hidden="true" className="mr-1">{umbrella.icon}</span>
          {advice.umbrella.text}
        </li>
        <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <span aria-hidden="true" className="mr-1">🧥</span>
          {advice.clothing}
        </li>
      </ul>
      {advice.notes.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          {advice.notes.map((note) => (
            <li key={note}>
              <span aria-hidden="true" className="mr-1">⚠️</span>
              {note}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-slate-500">※ 予報の数値をもとにした目安です。</p>
    </section>
  );
}
