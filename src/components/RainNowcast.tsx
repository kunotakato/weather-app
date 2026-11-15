import type { RainPoint } from "@/lib/types";

/** Yahoo! JAPAN 気象情報 API の「この先1時間の雨」 */
export function RainNowcast({ points }: { points: RainPoint[] }) {
  const forecast = points.filter((p) => p.kind === "forecast");
  const willRain = forecast.some((p) => p.rainfall > 0);
  const max = Math.max(1, ...points.map((p) => p.rainfall));

  return (
    <section aria-labelledby="rain-title" className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 id="rain-title" className="text-lg font-semibold">
        この先1時間の雨 <span className="text-xs font-normal text-slate-500">（Yahoo! JAPAN 気象情報）</span>
      </h2>
      <p className={`mt-1 font-medium ${willRain ? "text-sky-700" : "text-slate-600"}`}>
        {willRain ? "☔ 1時間以内に雨が降る予報です" : "🌂 1時間以内に雨の予報はありません"}
      </p>
      <ol className="mt-3 flex h-24 items-end gap-1" aria-label="10分ごとの降水強度">
        {points.map((p) => (
          <li key={`${p.kind}-${p.time}`} className="flex flex-1 flex-col items-center gap-1">
            <span className="sr-only">
              {p.time} {p.kind === "observation" ? "実測" : "予報"} {p.rainfall}mm/h
            </span>
            <span
              aria-hidden="true"
              className={`w-full rounded-t ${p.kind === "observation" ? "bg-slate-400" : "bg-sky-500"}`}
              style={{ height: `${Math.max(2, (p.rainfall / max) * 64)}px` }}
            />
            <span aria-hidden="true" className="text-[10px] text-slate-500 tabular-nums">{p.time}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-slate-500">灰色: 実測 / 青: 予報（mm/h）</p>
    </section>
  );
}
