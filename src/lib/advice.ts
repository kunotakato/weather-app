import type { CurrentWeather, DailyForecast } from "./types";

/*
 * 服装・傘アドバイスを「ルール」で決めるファイル。
 * 判定に使う数字（しきい値）はこの先頭にまとめてあるので、ここを変えれば基準を調整できる。
 * 使うデータはすべて OpenWeatherMap 無料枠の予報（気温・体感温度・降水確率・天気・風速）。
 * 体感温度は、今日は「今の値」と「予報の値」、明日以降は「予報の値」を使う。
 */

/** 傘の判定に使う降水確率（%） */
export const UMBRELLA_NEEDED = 50;
export const UMBRELLA_FOLDING = 30;

/** 最高気温（℃）ごとの服装の目安。上から順に「この温度以上なら」 */
const CLOTHING_RULES: { min: number; text: string }[] = [
  { min: 30, text: "半袖で過ごせる暑さ。帽子と水分補給で熱中症に注意しましょう。" },
  { min: 25, text: "半袖で快適に過ごせそうです。" },
  { min: 20, text: "長袖シャツ1枚くらいがちょうどよさそうです。" },
  { min: 16, text: "カーディガンやパーカーなど、薄手の上着があると安心です。" },
  { min: 12, text: "ジャケットなど、しっかりした上着を着ていきましょう。" },
  { min: 8, text: "コートが必要な寒さです。" },
  { min: 5, text: "厚手のコートとマフラーで暖かくしましょう。" },
  { min: -Infinity, text: "ダウンコート・手袋・マフラーでしっかり防寒を。" },
];

/** 朝晩と日中の気温差（℃）がこれ以上なら注意を出す */
const BIG_TEMP_GAP = 8;
/** 体感温度が実際の気温よりこれ以上低ければ注意を出す */
const FEELS_COLDER = 3;
/** 風が強いとみなす風速（m/s） */
const STRONG_WIND = 8;

export type UmbrellaLevel = "needed" | "folding" | "none";

export type Advice = {
  umbrella: { level: UmbrellaLevel; text: string };
  clothing: string;
  /** 追加の注意（寒暖差・風・雪など）。ない日は空配列 */
  notes: string[];
};

function isRainy(id: number) {
  return id >= 200 && id < 600; // 雷雨・霧雨・雨
}
function isSnowy(id: number) {
  return id >= 600 && id < 700;
}

/**
 * 選んだ日の予報からアドバイスを作る。
 * current を渡したとき（＝今日）は、体感温度と風速も判定に使う。
 */
export function getAdvice(day: DailyForecast, current?: CurrentWeather): Advice {
  // ---- 傘 ----
  const rainyHours = day.hours.filter((h) => isRainy(h.weatherId) || isSnowy(h.weatherId));
  let umbrella: Advice["umbrella"];
  if (day.pop >= UMBRELLA_NEEDED) {
    const from = rainyHours[0]?.time ?? day.hours.find((h) => h.pop >= UMBRELLA_NEEDED)?.time;
    umbrella = {
      level: "needed",
      text: `傘を持っていきましょう（降水確率 最大${day.pop}%${from ? `、${from}ごろから注意` : ""}）。`,
    };
  } else if (day.pop >= UMBRELLA_FOLDING) {
    umbrella = { level: "folding", text: `折りたたみ傘があると安心です（降水確率 最大${day.pop}%）。` };
  } else {
    umbrella = { level: "none", text: `傘はいらなそうです（降水確率 最大${day.pop}%）。` };
  }

  // ---- 服装 ----
  // 日中の最高気温で判断する。ただし体感温度の方が低ければ、そちらを優先する。
  //  - どの日も: 予報の「日中の体感温度（その日の最高）」
  //  - 今日は さらに: 今この瞬間の体感温度
  const dayFeels = day.feelsLikeMax ?? day.tempMax; // 古い保存データには体感温度が無いので気温で代用
  const base = Math.min(day.tempMax, dayFeels, current?.feelsLike ?? Infinity);
  const clothing = CLOTHING_RULES.find((r) => base >= r.min)!.text;

  // ---- 追加の注意 ----
  const notes: string[] = [];
  if (day.tempMax - day.tempMin >= BIG_TEMP_GAP) {
    notes.push(
      `朝晩と日中の気温差が${Math.round(day.tempMax - day.tempMin)}℃あります。脱ぎ着しやすい服がおすすめです。`,
    );
  }
  if (current && current.temp - current.feelsLike >= FEELS_COLDER) {
    notes.push(`体感温度は${Math.round(current.feelsLike)}℃。気温より寒く感じます。`);
  } else if (!current && day.tempMax - dayFeels >= FEELS_COLDER) {
    notes.push(`日中の体感温度は最高${Math.round(dayFeels)}℃ほど。気温より寒く感じます。`);
  }
  if (current && current.windSpeed >= STRONG_WIND) {
    notes.push(`風が強めです（${current.windSpeed}m/s）。傘より、フード付きの上着が便利かもしれません。`);
  }
  if (isSnowy(day.weatherId) || day.hours.some((h) => isSnowy(h.weatherId))) {
    notes.push("雪の予報です。滑りにくい靴で出かけましょう。");
  }

  return { umbrella, clothing, notes };
}
