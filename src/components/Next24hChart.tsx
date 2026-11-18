"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { next24Hours, tempTicks, type ChartPoint } from "@/lib/next24h";
import { weatherEmoji } from "@/lib/weatherIcon";
import type { DailyForecast } from "@/lib/types";

/*
 * これから 24 時間の「気温」と「降水確率」のグラフ。
 * 単位の違う 2 つを 1 つのグラフに重ねると読み違えやすいので、
 * 横軸（時刻）をそろえた 2 段のグラフにしている。ライブラリは使わず SVG で描く。
 */

const TEMP_COLOR = "#eb6834"; // 気温: オレンジ
const POP_COLOR = "#2a78d6"; // 降水確率: 青
const GRID = "#e2e8f0";
const TEXT_MUTED = "#64748b";
const TEXT = "#0f172a";

const PAD_LEFT = 40;
const PAD_RIGHT = 12;
const TEMP_H = 170;
const POP_H = 90;
const AXIS_H = 34; // 時刻ラベルの高さ
const GAP = 16; // 2 段の間

type Props = {
  daily: DailyForecast[];
  /** この日時より前の枠は過ぎているので表示しない（古い保存データ用） */
  fromSlot?: string;
};

export function Next24hChart({ daily, fromSlot }: Props) {
  const points = next24Hours(daily, fromSlot);
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);

  // 画面幅に合わせてグラフの横幅を変える（文字が縮んで読めなくならないように）
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (points.length === 0) return null;

  const plotW = width - PAD_LEFT - PAD_RIGHT;
  const band = plotW / points.length;
  const xOf = (i: number) => PAD_LEFT + band * (i + 0.5);

  // 気温の縦方向
  const ticks = tempTicks(points.map((p) => p.temp));
  const tLo = ticks[0];
  const tHi = ticks.at(-1)!;
  const tempTop = 26; // 上に「気温（℃）」の見出しを置く余白
  const yTemp = (t: number) => tempTop + (1 - (t - tLo) / (tHi - tLo)) * (TEMP_H - tempTop);

  // 降水確率の縦方向（0〜100%）
  const popTop = TEMP_H + GAP + 30; // 上に「降水確率（%）」の見出しを置く余白
  const popBase = popTop + POP_H;
  const yPop = (p: number) => popBase - (p / 100) * POP_H;
  const barW = Math.min(24, band * 0.5);

  const height = popBase + AXIS_H;
  const maxIdx = points.reduce((b, p, i) => (p.temp > points[b].temp ? i : b), 0);
  const minIdx = points.reduce((b, p, i) => (p.temp < points[b].temp ? i : b), 0);
  const popMaxIdx = points.reduce((b, p, i) => (p.pop > points[b].pop ? i : b), 0);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${xOf(i)},${yTemp(p.temp)}`).join(" ");

  /** ポインターの位置から一番近い時刻を選ぶ（線ではなく「時刻」を狙えばよい） */
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const i = Math.floor((x - PAD_LEFT) / band);
    setActive(Math.min(points.length - 1, Math.max(0, i)));
  };

  /** キーボードの ← → でも 1 つずつ動かせる */
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    setActive((cur) => Math.min(points.length - 1, Math.max(0, (cur ?? -delta) + delta)));
  };

  const activePoint = active === null ? null : points[active];

  return (
    <section aria-labelledby="chart-title" className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 id="chart-title" className="text-lg font-semibold">
        📈 これから24時間の予報
      </h2>
      <p className="text-xs text-slate-500">
        3時間ごと（無料プランの予報の細かさ）。グラフに触れる・← → キーで各時刻の値を表示します。
      </p>

      <div
        ref={boxRef}
        className="relative mt-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        tabIndex={0}
        role="group"
        aria-label="気温と降水確率のグラフ。左右の矢印キーで時刻を移動できます"
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block max-w-full touch-pan-y select-none"
          aria-hidden="true"
          onPointerMove={onPointerMove}
          onPointerDown={onPointerMove}
          onPointerLeave={() => setActive(null)}
        >
          {/* ---- 上段: 気温 ---- */}
          <text x={0} y={2} fontSize={11} fill={TEXT_MUTED} dominantBaseline="hanging">
            気温（℃）
          </text>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD_LEFT} x2={width - PAD_RIGHT} y1={yTemp(t)} y2={yTemp(t)} stroke={GRID} />
              <text x={PAD_LEFT - 6} y={yTemp(t)} fontSize={11} fill={TEXT_MUTED} textAnchor="end" dominantBaseline="middle">
                {t}
              </text>
            </g>
          ))}
          <path d={linePath} fill="none" stroke={TEMP_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <circle key={p.key} cx={xOf(i)} cy={yTemp(p.temp)} r={active === i ? 6 : 4} fill={TEMP_COLOR} stroke="#fff" strokeWidth={2} />
          ))}
          {/* 数字は「最高」と「最低」の 2 か所だけ（全部に付けると読めなくなる） */}
          {/* 時刻を選んでいる間は吹き出しに値が出るので、重ならないよう隠す */}
          {active === null && (
            <PointLabel x={xOf(maxIdx)} y={yTemp(points[maxIdx].temp) - 10} text={`${Math.round(points[maxIdx].temp)}℃`} />
          )}
          {active === null && minIdx !== maxIdx && (
            <PointLabel x={xOf(minIdx)} y={yTemp(points[minIdx].temp) + 20} text={`${Math.round(points[minIdx].temp)}℃`} />
          )}

          {/* ---- 下段: 降水確率 ---- */}
          <text x={0} y={popTop - 26} fontSize={11} fill={TEXT_MUTED} dominantBaseline="hanging">
            降水確率（%）
          </text>
          {[0, 50, 100].map((t) => (
            <g key={t}>
              <line x1={PAD_LEFT} x2={width - PAD_RIGHT} y1={yPop(t)} y2={yPop(t)} stroke={GRID} />
              <text x={PAD_LEFT - 6} y={yPop(t)} fontSize={11} fill={TEXT_MUTED} textAnchor="end" dominantBaseline="middle">
                {t}
              </text>
            </g>
          ))}
          {points.map((p, i) => (
            <path key={p.key} d={columnPath(xOf(i) - barW / 2, yPop(p.pop), barW, popBase - yPop(p.pop))} fill={POP_COLOR} opacity={active === null || active === i ? 1 : 0.55} />
          ))}
          {active === null && points[popMaxIdx].pop > 0 && (
            <PointLabel x={xOf(popMaxIdx)} y={yPop(points[popMaxIdx].pop) - 6} text={`${points[popMaxIdx].pop}%`} />
          )}

          {/* ---- 時刻の目盛り（2 段共通） ---- */}
          {points.map((p, i) => (
            <g key={p.key}>
              <text x={xOf(i)} y={popBase + 14} fontSize={11} fill={TEXT_MUTED} textAnchor="middle">
                {Number(p.time.slice(0, 2))}時
              </text>
              {(i === 0 || p.newDay) && (
                <text x={xOf(i)} y={popBase + 28} fontSize={10} fill={TEXT_MUTED} textAnchor="middle">
                  {Number(p.date.slice(8))}日
                </text>
              )}
            </g>
          ))}

          {/* ---- 選んでいる時刻の縦線 ---- */}
          {active !== null && (
            <line x1={xOf(active)} x2={xOf(active)} y1={tempTop} y2={popBase} stroke={TEXT_MUTED} strokeWidth={1} />
          )}
        </svg>

        {activePoint && active !== null && (
          <Tooltip point={activePoint} left={xOf(active)} width={width} />
        )}
        {/* 画面読み上げ用: 選んでいる時刻を読み上げる */}
        <p className="sr-only" aria-live="polite">
          {activePoint && describe(activePoint)}
        </p>
      </div>

      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-slate-600">表で見る</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              <th scope="col" className="py-1">日時</th>
              <th scope="col" className="py-1">天気</th>
              <th scope="col" className="py-1 text-right">気温</th>
              <th scope="col" className="py-1 text-right">降水確率</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.key} className="border-b border-slate-100 last:border-0">
                <th scope="row" className="py-1 font-medium tabular-nums">
                  {Number(p.date.slice(8))}日 {p.time}
                </th>
                <td className="py-1">{p.description}</td>
                <td className="py-1 text-right tabular-nums">{Math.round(p.temp)}℃</td>
                <td className="py-1 text-right tabular-nums">{p.pop}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

function describe(p: ChartPoint) {
  return `${Number(p.date.slice(8))}日 ${p.time}、${p.description}、気温${Math.round(p.temp)}度、降水確率${p.pop}%`;
}

function PointLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y} fontSize={12} fontWeight={600} fill={TEXT} textAnchor="middle" stroke="#fff" strokeWidth={3} paintOrder="stroke">
      {text}
    </text>
  );
}

/** 上の角だけ丸い棒（下は基準線にぴったり付ける） */
function columnPath(x: number, y: number, w: number, h: number) {
  if (h <= 0) return "";
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

function Tooltip({ point, left, width }: { point: ChartPoint; left: number; width: number }) {
  // 端で切れないよう、右半分では左側に出す
  const onRight = left > width / 2;
  return (
    <div
      className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md"
      style={onRight ? { right: width - left + 10 } : { left: left + 10 }}
    >
      <p className="text-xs text-slate-500">
        {Number(point.date.slice(8))}日 {point.time} {weatherEmoji(point.weatherId, point.isDay)} {point.description}
      </p>
      <p className="mt-1 flex items-center gap-2">
        <span aria-hidden="true" className="inline-block h-0.5 w-3" style={{ background: TEMP_COLOR }} />
        <strong className="tabular-nums">{Math.round(point.temp)}℃</strong>
        <span className="text-xs text-slate-500">気温</span>
      </p>
      <p className="flex items-center gap-2">
        <span aria-hidden="true" className="inline-block h-2 w-2 rounded-sm" style={{ background: POP_COLOR }} />
        <strong className="tabular-nums">{point.pop}%</strong>
        <span className="text-xs text-slate-500">降水確率</span>
      </p>
    </div>
  );
}
