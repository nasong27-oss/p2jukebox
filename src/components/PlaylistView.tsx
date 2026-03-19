"use client";

import Image from "next/image";
import {
  Trash2,
  ChevronUp,
  ChevronDown,
  Clock,
  ListMusic,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { PlaylistItem } from "@/types";

interface Props {
  items: PlaylistItem[];
  isAdmin: boolean;
  isLoading: boolean;
  onRemove: (item: PlaylistItem) => void;
  onMoveUp: (item: PlaylistItem) => void;
  onMoveDown: (item: PlaylistItem) => void;
  onRefresh: () => void;
}

export function PlaylistView({
  items,
  isAdmin,
  isLoading,
  onRemove,
  onMoveUp,
  onMoveDown,
  onRefresh,
}: Props) {
  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-[#1DB954]" />
          <h2 className="font-semibold text-gray-900 dark:text-white">
            현재 플레이리스트
          </h2>
          {!isLoading && (
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
              {items.length}곡
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-[#1DB954] dark:hover:text-[#1DB954] transition-colors py-1 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          새로고침
        </button>
      </div>

      {/* Loading skeleton */}
      {isLoading && items.length === 0 && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700"
            >
              <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-shrink-0" />
              <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading overlay when refreshing with existing items */}
      {isLoading && items.length > 0 && (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-[#1DB954]">
          <Loader2 className="w-4 h-4 animate-spin" />
          업데이트 중...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <ListMusic className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            아직 플레이리스트가 비어있어요
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            위에서 노래를 검색하여 추가해보세요!
          </p>
        </div>
      )}

      {/* Playlist items */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.trackUri}
            className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 group"
          >
            {/* Position */}
            <span className="w-6 text-center text-sm font-mono text-gray-400 dark:text-gray-500 flex-shrink-0">
              {index + 1}
            </span>

            {/* Album Art */}
            <div className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              {item.thumbnail ? (
                <Image
                  src={item.thumbnail}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6"
                  >
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <a
                href={`https://open.spotify.com/track/${item.trackId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-900 dark:text-white hover:text-[#1DB954] line-clamp-2 leading-snug transition-colors"
              >
                {item.title}
              </a>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                  {item.artistName}
                </span>
                <span className="flex items-center gap-0.5 text-xs text-gray-400 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {item.duration}
                </span>
                {item.addedBy && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full flex-shrink-0">
                    {item.addedBy}
                  </span>
                )}
              </div>
            </div>

            {/* Admin controls */}
            {isAdmin && (
              <div className="flex flex-col gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onMoveUp(item)}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="위로 이동"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onMoveDown(item)}
                  disabled={index === items.length - 1}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="아래로 이동"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onRemove(item)}
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
