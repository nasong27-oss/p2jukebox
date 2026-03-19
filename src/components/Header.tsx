"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Music2, Moon, Sun, LogIn, LogOut, Settings } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import Link from "next/link";

export function Header() {
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#1DB954] rounded-xl flex items-center justify-center shadow-sm">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-white text-lg leading-none block">
              공동 주크박스
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 leading-none">
              팀원 모두의 플레이리스트
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="테마 전환"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {session ? (
            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="관리자 설정"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                {session.user?.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt="profile"
                    className="w-7 h-7 rounded-full"
                  />
                )}
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {session.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => signIn("spotify", { callbackUrl: "/admin" })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#1DB954] hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">관리자 로그인</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
