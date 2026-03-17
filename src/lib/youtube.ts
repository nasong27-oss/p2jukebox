const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Get a fresh access token using the server-stored refresh token */
export async function getServerAccessToken(): Promise<string> {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error(
      "GOOGLE_REFRESH_TOKEN is not set. Please complete admin setup."
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Failed to refresh access token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

/** Search YouTube for videos */
export async function searchYouTube(query: string) {
  const apiKey = process.env.YOUTUBE_API_KEY!;

  const searchRes = await fetch(
    `${YOUTUBE_API_BASE}/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(
      query
    )}&key=${apiKey}`,
    { cache: "no-store" }
  );
  const searchData = await searchRes.json();

  if (!searchData.items?.length) return [];

  const videoIds: string[] = searchData.items.map(
    (item: { id: { videoId: string } }) => item.id.videoId
  );

  // Fetch video durations
  const detailsRes = await fetch(
    `${YOUTUBE_API_BASE}/videos?part=contentDetails&id=${videoIds.join(
      ","
    )}&key=${apiKey}`,
    { cache: "no-store" }
  );
  const detailsData = await detailsRes.json();

  const durationMap: Record<string, string> = {};
  for (const item of detailsData.items ?? []) {
    durationMap[item.id] = parseDuration(
      item.contentDetails?.duration ?? "PT0S"
    );
  }

  return searchData.items.map(
    (item: {
      id: { videoId: string };
      snippet: {
        title: string;
        channelTitle: string;
        thumbnails: { medium?: { url: string }; default?: { url: string } };
      };
    }) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail:
        item.snippet.thumbnails?.medium?.url ??
        item.snippet.thumbnails?.default?.url ??
        "",
      channelTitle: item.snippet.channelTitle,
      duration: durationMap[item.id.videoId] ?? "0:00",
    })
  );
}

/** Fetch all items in the configured playlist */
export async function fetchPlaylistItems() {
  const apiKey = process.env.YOUTUBE_API_KEY!;
  const playlistId = process.env.YOUTUBE_PLAYLIST_ID!;

  const items: {
    id: string;
    snippet: {
      title: string;
      position: number;
      resourceId: { videoId: string };
      thumbnails: { medium?: { url: string }; default?: { url: string } };
      videoOwnerChannelTitle: string;
    };
    contentDetails: { videoId: string; note?: string };
  }[] = [];

  let pageToken = "";

  do {
    const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();

    if (data.error) throw new Error(data.error.message);

    items.push(...(data.items ?? []));
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);

  // Fetch durations in batches
  const videoIds = items.map((i) => i.contentDetails.videoId);
  const durationMap: Record<string, string> = {};

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const res = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=contentDetails&id=${batch.join(
        ","
      )}&key=${apiKey}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    for (const item of data.items ?? []) {
      durationMap[item.id] = parseDuration(
        item.contentDetails?.duration ?? "PT0S"
      );
    }
  }

  return items.map((item) => ({
    playlistItemId: item.id,
    videoId: item.contentDetails.videoId,
    title: item.snippet.title,
    thumbnail:
      item.snippet.thumbnails?.medium?.url ??
      item.snippet.thumbnails?.default?.url ??
      "",
    channelTitle: item.snippet.videoOwnerChannelTitle ?? "",
    duration: durationMap[item.contentDetails.videoId] ?? "0:00",
    addedBy: item.contentDetails.note ?? "",
    position: item.snippet.position,
  }));
}

/** Add a video to the configured playlist */
export async function addToPlaylist(videoId: string, nickname: string) {
  const accessToken = await getServerAccessToken();
  const playlistId = process.env.YOUTUBE_PLAYLIST_ID!;

  const res = await fetch(`${YOUTUBE_API_BASE}/playlistItems?part=snippet,contentDetails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      snippet: {
        playlistId,
        resourceId: { kind: "youtube#video", videoId },
      },
      contentDetails: {
        note: nickname ? `${nickname}이(가) 추가함` : "",
      },
    }),
    cache: "no-store",
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

/** Remove a playlist item by its playlistItemId */
export async function removeFromPlaylist(playlistItemId: string) {
  const accessToken = await getServerAccessToken();

  const res = await fetch(
    `${YOUTUBE_API_BASE}/playlistItems?id=${encodeURIComponent(playlistItemId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );

  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: { message?: string } }).error?.message ??
        `Delete failed with status ${res.status}`
    );
  }
}

/** Reorder a playlist item to a new position */
export async function reorderPlaylistItem(
  playlistItemId: string,
  videoId: string,
  newPosition: number,
  note: string
) {
  const accessToken = await getServerAccessToken();
  const playlistId = process.env.YOUTUBE_PLAYLIST_ID!;

  const res = await fetch(`${YOUTUBE_API_BASE}/playlistItems?part=snippet`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: playlistItemId,
      snippet: {
        playlistId,
        position: newPosition,
        resourceId: { kind: "youtube#video", videoId },
      },
    }),
    cache: "no-store",
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}
