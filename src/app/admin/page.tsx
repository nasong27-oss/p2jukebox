"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import { LogIn, LogOut, Copy, CheckCircle, KeyRound, AlertCircle } from "lucide-react";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <KeyRound className="w-8 h-8 text-green-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              관리자 설정
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              공동 주크박스 Spotify 권한 설정
            </p>
          </div>
        </div>

        {!session ? (
          <div className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-semibold mb-1">최초 1회 설정 필요</p>
                <p>
                  Spotify 계정으로 로그인하여 플레이리스트 수정 권한을 앱에
                  부여해주세요. 로그인 후 발급된{" "}
                  <strong>Refresh Token</strong>을{" "}
                  <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">
                    SPOTIFY_REFRESH_TOKEN
                  </code>{" "}
                  환경 변수에 저장해야 팀원들이 곡을 추가할 수 있습니다.
                </p>
              </div>
            </div>

            <button
              onClick={() => signIn("spotify")}
              className="w-full flex items-center justify-center gap-3 bg-[#1DB954] hover:bg-[#1aa34a] text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Spotify 계정으로 로그인
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              {session.user?.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt="profile"
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {session.user?.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {session.user?.email}
                </p>
              </div>
            </div>

            {session.refreshToken ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold text-sm">
                    Refresh Token 발급 완료
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  아래 토큰을 복사하여{" "}
                  <code className="bg-gray-100 dark:bg-gray-600 px-1 rounded">
                    SPOTIFY_REFRESH_TOKEN
                  </code>{" "}
                  환경 변수에 저장하세요.
                </p>

                <div className="relative">
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-3 pr-12 font-mono text-xs text-gray-700 dark:text-gray-300 break-all">
                    {session.refreshToken}
                  </div>
                  <button
                    onClick={() => handleCopy(session.refreshToken!)}
                    className="absolute top-2 right-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="복사"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-2">다음 단계</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>위 토큰을 복사</li>
                    <li>
                      Vercel 대시보드 → Settings → Environment Variables로 이동
                    </li>
                    <li>
                      <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">
                        SPOTIFY_REFRESH_TOKEN
                      </code>{" "}
                      키에 붙여넣기
                    </li>
                    <li>프로젝트 재배포 (Redeploy)</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-800 dark:text-red-200">
                <p className="font-semibold mb-1">Refresh Token 없음</p>
                <p>
                  로그아웃 후 다시 로그인해주세요. Spotify OAuth 과정에서
                  오프라인 접근 권한이 부여되지 않았습니다.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <a
                href="/"
                className="flex-1 text-center py-2.5 px-4 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                메인으로
              </a>
              <button
                onClick={() => signOut({ callbackUrl: "/admin" })}
                className="flex items-center gap-2 py-2.5 px-4 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
