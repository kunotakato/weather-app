"use client";

import { useState } from "react";

const PRESETS = [
  { label: "札幌", query: "Sapporo,JP" },
  { label: "東京", query: "Tokyo,JP" },
  { label: "名古屋", query: "Nagoya,JP" },
  { label: "大阪", query: "Osaka,JP" },
  { label: "福岡", query: "Fukuoka,JP" },
  { label: "那覇", query: "Naha,JP" },
];

type Props = {
  disabled: boolean;
  onSearch: (city: string) => void;
  onLocate: () => void;
};

export function SearchBar({ disabled, onSearch, onLocate }: Props) {
  const [city, setCity] = useState("");

  return (
    <div className="space-y-3">
      <form
        role="search"
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const value = city.trim();
          if (value) onSearch(value);
        }}
      >
        <label htmlFor="city" className="sr-only">
          都市名
        </label>
        <input
          id="city"
          type="search"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="都市名（例: Kyoto, London）"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
        <button
          type="submit"
          disabled={disabled || city.trim() === ""}
          className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          検索
        </button>
        <button
          type="button"
          onClick={onLocate}
          disabled={disabled}
          className="rounded-lg border border-sky-600 bg-white px-4 py-2 font-semibold text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          📍 現在地
        </button>
      </form>
      <ul className="flex flex-wrap gap-2" aria-label="よく使う都市">
        {PRESETS.map((p) => (
          <li key={p.query}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSearch(p.query)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm hover:border-sky-400 hover:bg-sky-50 disabled:opacity-50"
            >
              {p.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
