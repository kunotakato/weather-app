/**
 * OpenWeatherMap の天気コード（weather.id）を絵文字に変換する。
 * 画像を外部から読み込まないので、表示が速く、設定も不要。
 * https://openweathermap.org/weather-conditions
 */
export function weatherEmoji(id: number, isDay = true): string {
  if (id >= 200 && id < 300) return "⛈️";
  if (id >= 300 && id < 400) return "🌦️";
  if (id >= 500 && id < 600) return id === 511 ? "🌨️" : "🌧️";
  if (id >= 600 && id < 700) return "❄️";
  if (id >= 700 && id < 800) return "🌫️";
  if (id === 800) return isDay ? "☀️" : "🌙";
  if (id === 801 || id === 802) return isDay ? "🌤️" : "☁️";
  return "☁️";
}
