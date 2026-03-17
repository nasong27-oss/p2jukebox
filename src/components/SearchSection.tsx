"use client";

import { useState, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import type { VideoSearchResult } from "@/types";

interface Props {
  onResults: (results: VideoSearchResult[]) => void;
  onLoading: (loading: boolean) => void;
  isLoading: boolean;
}

export function SearchSection({ onResults, onLoading, isLoading }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;

    onLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      onResults(data.items ?? []);
    } catch {
      onResults([]);
    } finally {
      onLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    onResults([]);
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="노래 제목, 아티스트 검색..."
            className="w-full pl-11 pr-10 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="flex items-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 dark:disabled:bg-brand-800 text-white font-medium rounded-xl shadow-sm transition-colors whitespace-nowrap"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">검색</span>
        </button>
      </div>
    </form>
  );
}
