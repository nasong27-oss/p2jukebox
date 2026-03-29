import { NextResponse } from "next/server";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

function basicAuth(): string {
  return Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");
}

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Client credentials token
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
    results.clientToken = tokenData.access_token
      ? `OK (${tokenData.access_token.slice(0, 20)}...)`
      : `FAIL: ${JSON.stringify(tokenData)}`;

    if (tokenData.access_token) {
      // 2. GET /playlists/{id}
      const playlistId = process.env.SPOTIFY_PLAYLIST_ID!;
      const p1 = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}?fields=id,name,public,owner`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
        cache: "no-store",
      });
      const p1Data = await p1.json();
      results.playlistInfo = { status: p1.status, data: p1Data };

      // 3. GET /playlists/{id}/tracks (no fields filter)
      const p2 = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?limit=1`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
        cache: "no-store",
      });
      const p2Data = await p2.json();
      results.playlistTracks = { status: p2.status, data: p2Data };
    }
  } catch (e) {
    results.error = String(e);
  }

  // 4. Refresh token test
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  if (refreshToken) {
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
      results.userToken = rData.access_token
        ? `OK scope: ${rData.scope}`
        : `FAIL: ${JSON.stringify(rData)}`;

      if (rData.access_token) {
        // 5. GET /me
        const meRes = await fetch(`${SPOTIFY_API_BASE}/me`, {
          headers: { Authorization: `Bearer ${rData.access_token}` },
          cache: "no-store",
        });
        const meData = await meRes.json();
        results.me = { status: meRes.status, id: meData.id, display_name: meData.display_name };

        // 6. POST /playlists/{id}/tracks with fake URI (should give 400 if auth is OK)
        const playlistId = process.env.SPOTIFY_PLAYLIST_ID!;
        const addRes = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${rData.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uris: ["spotify:track:test"] }),
          cache: "no-store",
        });
        const addData = await addRes.json();
        results.addTrackTest = { status: addRes.status, data: addData };
      }
    } catch (e) {
      results.refreshTokenError = String(e);
    }
  } else {
    results.refreshToken = "NOT SET";
  }

  return NextResponse.json(results);
}
