import { localDate, localDateTime } from "./date";
import type { DailyForecast, WeatherResponse } from "./types";

/*
 * 保存しておいた古いデータを表示するときに、「もう過ぎた日・時刻」を取り除くためのファイル。
 * 例: 11/13 に保存したデータを 11/18 に表示すると、11/13〜17 の予報は過去のもの。
 * それを「今日」「これから」と表示しないよう、本当の今の日時（その都市の時刻）で判断し直す。
 */

/** 予報は 3 時間ごと。「12:00」の枠は 12:00〜15:00 を表すので、3 時間前までの枠は「今」に含める */
const SLOT_SECONDS = 3 * 3600;

export type WeatherView = {
  /** その都市の本当の「今日」 "YYYY-MM-DD" */
  today: string;
  /** 今日以降の予報だけ */
  daily: DailyForecast[];
  /** この時刻 "YYYY-MM-DD HH:mm" 以降の枠が「これから」 */
  fromSlot: string;
  /** 「現在の天気」が今日観測したものか（違えば今日のアドバイスには使わない） */
  currentIsToday: boolean;
};

export function viewAt(data: WeatherResponse, nowMs: number): WeatherView {
  const nowSec = Math.floor(nowMs / 1000);
  const offset = data.timezoneOffset;
  const today = localDate(nowSec, offset);
  return {
    today,
    daily: data.daily.filter((d) => d.date >= today),
    fromSlot: localDateTime(nowSec - SLOT_SECONDS, offset),
    currentIsToday: localDate(data.current.observedAt, offset) === today,
  };
}
