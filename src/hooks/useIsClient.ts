"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * 「今ブラウザで動いているか」を返す。
 * サーバーで作る最初の HTML と、ブラウザでの最初の描画をそろえる（Hydration エラーを防ぐ）ために使う。
 * localStorage はブラウザにしかないので、読むのは true になってから。
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
