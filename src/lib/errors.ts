/*
 * エラーの「種類」と、利用者に見せる案内文をまとめたファイル。
 * サーバー（/api/weather）は { error, code } を返し、画面は code を見て案内を出し分ける。
 */

export type ErrorCode =
  // サーバーから返ってくるもの
  | "NO_KEY" // サーバーに API キーが設定されていない
  | "BAD_QUERY" // 都市名・緯度経度の指定がおかしい
  | "NOT_FOUND" // 都市が見つからない
  | "INVALID_KEY" // API キーが無効
  | "RATE_LIMIT" // 呼び出し回数の上限
  | "UPSTREAM" // OpenWeatherMap 側の不具合・応答なし
  | "UNKNOWN"
  // ブラウザ側で起きるもの
  | "NETWORK" // インターネットにつながらない
  | "TIMEOUT" // 応答が遅すぎる
  | "GEO_DENIED" // 位置情報が許可されていない
  | "GEO_UNAVAILABLE"; // 位置情報が取れない

export type ErrorGuide = {
  title: string;
  /** 次に何をすればよいか */
  hint: string;
  /** 再試行ボタンを出すか（同じ操作をやり直して直る見込みがあるか） */
  retry: boolean;
};

export const ERROR_GUIDES: Record<ErrorCode, ErrorGuide> = {
  NETWORK: {
    title: "インターネットに接続できません",
    hint: "Wi-Fi やモバイル通信を確認してください。つながると自動でもう一度取得します。",
    retry: true,
  },
  TIMEOUT: {
    title: "応答に時間がかかっています",
    hint: "通信が混み合っているようです。少し待ってから再試行してください。",
    retry: true,
  },
  NOT_FOUND: {
    title: "都市が見つかりませんでした",
    hint: "綴りを確認するか、英語表記（例: Kyoto、Sapporo）で検索してみてください。",
    retry: false,
  },
  BAD_QUERY: {
    title: "検索の指定が正しくありません",
    hint: "都市名を入れ直すか、下の都市ボタンから選んでください。",
    retry: false,
  },
  RATE_LIMIT: {
    title: "アクセスが集中しています",
    hint: "無料プランの呼び出し回数の上限に達しました。1分ほど待ってから再試行してください。",
    retry: true,
  },
  UPSTREAM: {
    title: "天気サービスが一時的に使えません",
    hint: "OpenWeatherMap 側の不具合の可能性があります。時間をおいて再試行してください。",
    retry: true,
  },
  INVALID_KEY: {
    title: "天気サービスの認証に失敗しました",
    hint: "（管理者向け）API キーが無効です。発行直後なら最大2時間ほど待つか、キーの値を確認してください。",
    retry: true,
  },
  NO_KEY: {
    title: "サーバーの設定が完了していません",
    hint: "（管理者向け）OPENWEATHER_API_KEY を .env.local または Vercel の環境変数に設定し、再起動・再デプロイしてください。",
    retry: true,
  },
  GEO_DENIED: {
    title: "位置情報が許可されていません",
    hint: "アドレスバー左のアイコンからこのサイトの「位置情報」を許可するか、都市名で検索してください。",
    retry: true,
  },
  GEO_UNAVAILABLE: {
    title: "現在地を取得できませんでした",
    hint: "電波の良い場所で再試行するか、都市名で検索してください。",
    retry: true,
  },
  UNKNOWN: {
    title: "天気を取得できませんでした",
    hint: "時間をおいて再試行してください。",
    retry: true,
  },
};

const CODES = new Set(Object.keys(ERROR_GUIDES));

export function toErrorCode(value: unknown): ErrorCode {
  return typeof value === "string" && CODES.has(value) ? (value as ErrorCode) : "UNKNOWN";
}

/** 画面側で扱うエラー（種類 + 詳しいメッセージ） */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message?: string,
  ) {
    super(message ?? ERROR_GUIDES[code].title);
    this.name = "AppError";
  }
}

/**
 * 「データの取得そのものに失敗した」エラーか。
 * このときは表示中のデータが古い可能性があるので、取得時刻を明示する。
 * （都市が見つからない・位置情報の許可がない、は取得の失敗ではないので含めない）
 */
export function isFetchFailure(code: ErrorCode): boolean {
  return !["NOT_FOUND", "BAD_QUERY", "GEO_DENIED", "GEO_UNAVAILABLE"].includes(code);
}
