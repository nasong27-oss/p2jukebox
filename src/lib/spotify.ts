const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

interface SpotifyArtist {
  name: string;
}
interface SpotifyImage {
  url: string;
}
interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  duration_ms: number;
  artists: SpotifyArtist[];
  album: { images: SpotifyImage[] };
}
interface SpotifyPlaylistItem {
  track: SpotifyTrack;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function basicAuth(): string {
  return Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");
}

/** Client Credentials token — for public read operations (search, playlist list) */
export async function getClientToken(): Promise<string> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth()}`,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const data = await res.json();
  if (!data.access_token)
    throw new Error(`Client token fetch failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

/** User token via stored refresh token — for write operations */
export async function getUserToken(): Promise<string> {
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error(
      "SPOTIFY_REFRESH_TOKEN 이 설정되지 않았습니다. /admin 에서 관리자 로그인 후 Refresh Token을 환경변수에 저장해주세요."
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
  if (!data.access_token)
    throw new Error(`User token refresh failed: ${JSON.stringify(data)}`);
  console.log("[getUserToken] scope:", data.scope);
  return data.access_token;
}

/** Search Spotify for tracks */
export async function searchTracks(query: string) {
  const token = await getUserToken();
  const res = await fetch(
    `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  return (data.tracks?.items ?? []).map((track: SpotifyTrack) => ({
    trackId: track.id,
    trackUri: track.uri,
    title: track.name,
    thumbnail: track.album.images[0]?.url ?? "",
    artistName: track.artists.map((a) => a.name).join(", "),
    duration: formatDuration(track.duration_ms),
  }));
}

/** Fetch all tracks in the configured Spotify playlist */
export async function fetchPlaylistTracks() {
  const token = await getUserToken();
  const playlistId = process.env.SPOTIFY_PLAYLIST_ID!;
  console.log("[fetchPlaylistTracks] playlistId:", playlistId);;

  const items: SpotifyPlaylistItem[] = [];
  let nextUrl: string | null =
    `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?limit=50&fields=next,items(track(id,uri,name,duration_ms,artists,album(images)))`;

  while (nextUrl) {
    const currentUrl: string = nextUrl;
    const res = await fetch(currentUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json();
    if (data.error) throw new Error(`${res.status} ${JSON.stringify(data.error)}`);
    items.push(...(data.items ?? []));
    nextUrl = (data.next as string | null) ?? null;
  }

  return items
    .filter((item) => item.track) // skip null tracks (deleted songs)
    .map((item, index) => ({
      trackUri: item.track.uri,
      trackId: item.track.id,
      title: item.track.name,
      thumbnail: item.track.album.images[0]?.url ?? "",
      artistName: item.track.artists.map((a) => a.name).join(", "),
      duration: formatDuration(item.track.duration_ms),
      addedBy: "", // merged with nickname store by the route handler
      position: index,
    }));
}

/** Add a track to the configured playlist */
export async function addTrackToPlaylist(trackUri: string) {
  const token = await getUserToken();
  const playlistId = process.env.SPOTIFY_PLAYLIST_ID!;

  console.log("[addTrackToPlaylist] playlistId:", playlistId);

  // Check current user identity
  const meRes = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const meData = await meRes.json();
  console.log("[addTrackToPlaylist] current user id:", meData.id, "display_name:", meData.display_name);

  // Verify playlist ownership first
  const checkRes = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}?fields=id,name,owner`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const checkData = await checkRes.json();
  console.log("[addTrackToPlaylist] playlist owner:", JSON.stringify(checkData.owner), "name:", checkData.name);

  const res = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: [trackUri] }),
    cache: "no-store",
  });
  const data = await res.json();
  if (data.error) {
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => { headers[k] = v; });
    console.log("[addTrackToPlaylist] error headers:", JSON.stringify(headers));
    throw new Error(`Spotify ${res.status}: ${JSON.stringify(data.error)}`);
  }
  return data;
}

/** Remove a track from the configured playlist */
export async function removeTrackFromPlaylist(trackUri: string) {
  const token = await getUserToken();
  const playlistId = process.env.SPOTIFY_PLAYLIST_ID!;

  const res = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tracks: [{ uri: trackUri }] }),
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: { message?: string } }).error?.message ??
        `Delete failed: ${res.status}`
    );
  }
}

/** Reorder a track within the playlist */
export async function reorderPlaylistTrack(
  rangeStart: number,
  insertBefore: number
) {
  const token = await getUserToken();
  const playlistId = process.env.SPOTIFY_PLAYLIST_ID!;

  const res = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      range_start: rangeStart,
      insert_before: insertBefore,
      range_length: 1,
    }),
    cache: "no-store",
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}
