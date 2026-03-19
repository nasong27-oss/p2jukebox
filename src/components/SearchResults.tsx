"use client";

import Image from "next/image";
import { Plus, CheckCircle, Clock } from "lucide-react";
import type { TrackSearchResult } from "@/types";

interface Props {
  results: TrackSearchResult[];
  onAddClick: (track: TrackSearchResult) => void;
}

export function SearchResults({ results, onAddClick }: Props) {
  if (!results.length) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-1">
        검색 결과{" "}
        <span className="text-[#1DB954]">{results.length}개</span>
      </h2>

      <div className="space-y-2">
        {results.map((track) => (
          <div
            key={track.trackId}
            className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            {/* Album Art */}
            <div className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              {track.thumbnail ? (
                <Image
                  src={track.thumbnail}
                  alt={track.title}
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
              <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 leading-snug">
                {track.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {track.artistName}
                </span>
                <span className="flex items-center gap-0.5 text-xs text-gray-400 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {track.duration}
                </span>
              </div>
            </div>

            {/* Action */}
            <div className="flex-shrink-0">
              {track.isInPlaylist ? (
                <span className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-3.5 h-3.5" />
                  이미 추가됨
                </span>
              ) : (
                <button
                  onClick={() => onAddClick(track)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1DB954] hover:bg-[#1aa34a] text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  추가
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
