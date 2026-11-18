/** 初めて開いたときなど、表示できるデータがまだ無い間の「読み込み中」画面 */
export function LoadingSkeleton() {
  return (
    <div role="status" aria-label="天気を読み込み中" className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Spinner />
        天気を読み込み中…
      </div>
      <div aria-hidden="true" className="h-56 animate-pulse rounded-2xl bg-sky-100" />
      <div aria-hidden="true" className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />
      <div aria-hidden="true" className="grid gap-5 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    </div>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600"
    />
  );
}
