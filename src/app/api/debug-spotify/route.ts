import { NextResponse } from "next/server";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

function basicAuth(): string {
  return Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");
}

export async function GET() {
  const lines: string[] = [];

  const playlistId = process.env.SPOTIFY_PLAYLIST_ID ?? "NOT SET";
  lines.push(`PLAYLIST_ID: ${playlistId}`);
  lines.push(`CLIENT_ID: ${(process.env.SPOTIFY_CLIENT_ID ?? "NOT SET").slice(0, 8)}...`);

  // 1. Client credentials token
  let clientToken = "";
  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth()}`,
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
    const tokenData = await tokenRes.json();
    if (tokenData.access_token) {
      clientToken = tokenData.access_token;
      lines.push(`CLIENT_TOKEN: OK`);
    } else {
      lines.push(`CLIENT_TOKEN FAIL: ${JSON.stringify(tokenData)}`);
    }
  } catch (e) {
    lines.push(`CLIENT_TOKEN ERROR: ${e}`);
  }

  // 2. GET /playlists/{id} with client token
  if (clientToken) {
    const r = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}?fields=id,name,public`, {
      headers: { Authorization: `Bearer ${clientToken}` },
      cache: "no-store",
    });
    const d = await r.json();
    lines.push(`GET /playlists: ${r.status} name=${d.name} public=${d.public} error=${d.error?.message ?? "none"}`);

    // 3. GET /playlists/{id}/tracks
    const r2 = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?limit=1`, {
      headers: { Authorization: `Bearer ${clientToken}` },
      cache: "no-store",
    });
    const d2 = await r2.json();
    lines.push(`GET /playlists/tracks: ${r2.status} error=${d2.error?.message ?? "none"} total=${d2.total ?? "N/A"}`);
  }

  // 3. Refresh token
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!refreshToken) {
    lines.push("REFRESH_TOKEN: NOT SET");
  } else {
    lines.push(`REFRESH_TOKEN: set (${refreshToken.slice(0, 8)}...)`);
    try {
      const rRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth()}`,
        },
        body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
        cache: "no-store",
      });
      const rData = await rRes.json();
      if (rData.access_token) {
        lines.push(`USER_TOKEN: OK scope=${rData.scope}`);
        const meRes = await fetch(`${SPOTIFY_API_BASE}/me`, {
          headers: { Authorization: `Bearer ${rData.access_token}` },
          cache: "no-store",
        });
        const meData = await meRes.json();
        lines.push(`ME: ${meRes.status} id=${meData.id} name=${meData.display_name}`);

        const addRes = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
          method: "POST",
          headers: { Authorization: `Bearer ${rData.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"] }),
          cache: "no-store",
        });
        const addData = await addRes.json();
        lines.push(`POST /tracks: ${addRes.status} error=${addData.error?.message ?? "none"} snapshot=${addData.snapshot_id?.slice(0, 10) ?? "N/A"}`);
      } else {
        lines.push(`USER_TOKEN FAIL: ${JSON.stringify(rData)}`);
      }
    } catch (e) {
      lines.push(`USER_TOKEN ERROR: ${e}`);
    }
  }

  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
