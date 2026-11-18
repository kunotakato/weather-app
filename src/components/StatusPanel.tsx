import { formatSavedAt } from "@/lib/cache";
import { ERROR_GUIDES, type AppError, type ErrorCode } from "@/lib/errors";
import { Spinner } from "./LoadingSkeleton";

/** サーバーの詳しいメッセージが案内文に情報を足すもの（都市名・エラー番号など）だけ表示する */
const SHOW_DETAIL: ErrorCode[] = ["NOT_FOUND", "UPSTREAM", "UNKNOWN", "GEO_UNAVAILABLE"];

type Props = {
  /** 表示中のデータが取得し直し中か */
  refreshing: boolean;
  error: AppError | null;
  /** 表示中のデータが「前回保存したもの」なら、その取得時刻 */
  staleSavedAt: number | null;
  onRetry: () => void;
};

/**
 * 画面上部のお知らせ欄。
 *  - 更新中 … 小さなくるくる
 *  - エラー … 何が起きたか / 次にどうすればよいか / 再試行ボタン
 *  - 古いデータ表示中 … いつ時点のデータかを明示
 */
export function StatusPanel({ refreshing, error, staleSavedAt, onRetry }: Props) {
  const guide = error ? ERROR_GUIDES[error.code] : null;

  return (
    <div aria-live="polite" className="space-y-2">
      {refreshing && (
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <Spinner />
          最新の天気を取得しています…
        </p>
      )}

      {error && guide && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
          <p className="font-semibold">⚠️ {guide.title}</p>
          {SHOW_DETAIL.includes(error.code) && error.message !== guide.title && (
            <p className="mt-0.5 text-sm">{error.message}</p>
          )}
          <p className="mt-1 text-sm">{guide.hint}</p>
          {guide.retry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={refreshing}
              className="mt-2 rounded-md bg-rose-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
            >
              🔄 再試行
            </button>
          )}
        </div>
      )}

      {staleSavedAt !== null && !refreshing && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          🕒 前回取得したデータ（{formatSavedAt(staleSavedAt)} 時点）を表示しています。最新の予報とは異なる場合があります。
        </p>
      )}
    </div>
  );
}
