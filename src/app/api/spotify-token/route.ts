import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

function basicAuth(): string {
  return Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");
}

export async function GET() {
  const playlistId = process.env.SPOTIFY_PLAYLIST_ID;

  // Try session access token first (direct from OAuth flow, not refreshed)
  const session = await getServerSession(authOptions);
  if (session?.accessToken) {
    return NextResponse.json({
      accessToken: session.accessToken,
      playlistId,
      source: "session",
    });
  }

  // Fall back to refresh token
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!refreshToken) {
    return NextResponse.json(
      { error: "SPOTIFY_REFRESH_TOKEN이 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth()}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    cache: "no-store",
  });

  const data = await res.json();
  if (!data.access_token) {
    return NextResponse.json(
      { error: `토큰 갱신 실패: ${JSON.stringify(data)}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    accessToken: data.access_token,
    playlistId,
    source: "refresh",
  });
}
