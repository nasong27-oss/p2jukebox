"use client";

import { useEffect, useRef, useState } from "react";
import { X, UserCircle, Music } from "lucide-react";

interface Props {
  videoTitle: string;
  onConfirm: (nickname: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function NicknameModal({
  videoTitle,
  onConfirm,
  onClose,
  isLoading,
}: Props) {
  const [nickname, setNickname] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Restore saved nickname from localStorage
    const saved = localStorage.getItem("jukebox_nickname") ?? "";
    setNickname(saved);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) return;
    localStorage.setItem("jukebox_nickname", trimmed);
    onConfirm(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/30 rounded-lg flex items-center justify-center">
              <Music className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              닉네임 입력
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            추가할 곡
          </p>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2 mb-5">
            {videoTitle}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                닉네임{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="예: 홍길동"
                  maxLength={20}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                플레이리스트에 &quot;{nickname.trim() || "닉네임"}&quot;이(가) 추가함 으로 표시됩니다.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
                disabled={isLoading}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!nickname.trim() || isLoading}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 dark:disabled:bg-brand-800 text-white rounded-xl transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    추가 중...
                  </>
                ) : (
                  "플레이리스트에 추가"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
