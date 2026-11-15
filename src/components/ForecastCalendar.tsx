"use client";

import { useState } from "react";
import { buildMonthGrid, shiftMonth, yearMonthOf } from "@/lib/calendar";
import { formatDateJa } from "@/lib/date";
import { weatherEmoji } from "@/lib/weatherIcon";
import type { DailyForecast } from "@/lib/types";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

type Props = {
  daily: DailyForecast[];
  today: string;
  selectedDate: string;
  onSelect: (date: string) => void;
};

/**
 * 月カレンダー。予報がある日（今日から約5日先まで）だけ選べる。
 * 予報が月をまたぐときは「‹ ›」で月を切り替えられる。
 */
export function ForecastCalendar({ daily, today, selectedDate, onSelect }: Props) {
  // 表示中の月（初期値は選択中の日付の月）
  const [shown, setShown] = useState(() => yearMonthOf(selectedDate));
  const byDate = new Map(daily.map((d) => [d.date, d]));
  const weeks = buildMonthGrid(shown.year, shown.month);

  const first = daily[0]?.date ?? today;
  const last = daily.at(-1)?.date ?? today;
  const firstMonth = yearMonthOf(first);
  const lastMonth = yearMonthOf(last);
  const canPrev = shown.year * 12 + shown.month > firstMonth.year * 12 + firstMonth.month;
  const canNext = shown.year * 12 + shown.month < lastMonth.year * 12 + lastMonth.month;

  return (
    <section aria-labelledby="calendar-title" className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShown(shiftMonth(shown.year, shown.month, -1))}
          disabled={!canPrev}
          aria-label="前の月"
          className="rounded-md px-3 py-1 text-xl hover:bg-slate-100 disabled:invisible"
        >
          ‹
        </button>
        <h2 id="calendar-title" className="text-lg font-semibold" aria-live="polite">
          {shown.year}年{shown.month}月
        </h2>
        <button
          type="button"
          onClick={() => setShown(shiftMonth(shown.year, shown.month, 1))}
          disabled={!canNext}
          aria-label="次の月"
          className="rounded-md px-3 py-1 text-xl hover:bg-slate-100 disabled:invisible"
        >
          ›
        </button>
      </div>

      <table className="w-full table-fixed border-separate border-spacing-1 text-center">
        <thead>
          <tr>
            {WEEKDAYS.map((w, i) => (
              <th
                key={w}
                scope="col"
                className={`text-xs font-medium ${i === 0 ? "text-rose-600" : i === 6 ? "text-sky-700" : "text-slate-500"}`}
              >
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0].date}>
              {week.map((cell) => {
                const forecast = cell.inMonth ? byDate.get(cell.date) : undefined;
                if (!cell.inMonth) return <td key={cell.date} />;
                if (!forecast) {
                  return (
                    <td key={cell.date} className="h-16 rounded-lg align-top text-sm text-slate-300">
                      <span className="block pt-1">{cell.day}</span>
                    </td>
                  );
                }
                const selected = cell.date === selectedDate;
                return (
                  <td key={cell.date} className="h-16 p-0">
                    <button
                      type="button"
                      onClick={() => onSelect(cell.date)}
                      aria-pressed={selected}
                      aria-label={`${formatDateJa(cell.date)} ${forecast.description} 最高${Math.round(forecast.tempMax)}度 最低${Math.round(forecast.tempMin)}度`}
                      className={`flex h-full w-full flex-col items-center justify-start rounded-lg border pt-1 text-sm transition ${
                        selected
                          ? "border-sky-600 bg-sky-600 text-white"
                          : "border-sky-200 bg-sky-50 hover:border-sky-400"
                      }`}
                    >
                      <span className={cell.date === today ? "font-bold underline" : ""}>{cell.day}</span>
                      <span aria-hidden="true" className="text-lg leading-tight">
                        {weatherEmoji(forecast.weatherId)}
                      </span>
                      <span aria-hidden="true" className="text-[10px] leading-tight tabular-nums sm:text-xs">
                        {Math.round(forecast.tempMax)}/{Math.round(forecast.tempMin)}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">
        色のついた日（今日から約5日先まで）を選ぶと、その日の予報に切り替わります。
      </p>
    </section>
  );
}
