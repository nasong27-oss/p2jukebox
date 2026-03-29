import { NextResponse } from "next/server";

function basicAuth(): string {
  return Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");
}

export async function GET() {
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
    playlistId: process.env.SPOTIFY_PLAYLIST_ID,
  });
}
