/** 画面とAPI（Route Handler）の間でやり取りするデータの形 */

export type Place = {
  name: string;
  country: string;
  lat: number;
  lon: number;
};

export type CurrentWeather = {
  /** 観測時刻（UNIX秒） */
  observedAt: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherId: number;
  description: string;
  isDay: boolean;
};

export type HourlyForecast = {
  /** その土地の時刻で "HH:mm" */
  time: string;
  temp: number;
  humidity: number;
  /** 降水確率（0〜100 の整数） */
  pop: number;
  weatherId: number;
  description: string;
  isDay: boolean;
};

export type DailyForecast = {
  /** その土地の日付で "YYYY-MM-DD" */
  date: string;
  tempMin: number;
  tempMax: number;
  /** 1日の平均湿度（%） */
  humidity: number;
  /** 1日の中で最も高い降水確率（%） */
  pop: number;
  weatherId: number;
  description: string;
  hours: HourlyForecast[];
};

export type WeatherResponse = {
  place: Place;
  /** UTC からのずれ（秒）。日本なら 32400 */
  timezoneOffset: number;
  /** その土地の「今日」 "YYYY-MM-DD" */
  today: string;
  current: CurrentWeather;
  daily: DailyForecast[];
};

export type RainPoint = {
  /** その土地（日本時間）の "HH:mm" */
  time: string;
  /** 降水強度（mm/h） */
  rainfall: number;
  kind: "observation" | "forecast";
};

export type RainResponse =
  | { enabled: false }
  | { enabled: true; points: RainPoint[] };

export type ApiError = { error: string };
