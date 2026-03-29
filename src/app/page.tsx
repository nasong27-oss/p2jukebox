"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/Header";
import { SearchSection } from "@/components/SearchSection";
import { SearchResults } from "@/components/SearchResults";
import { PlaylistView } from "@/components/PlaylistView";
import { NicknameModal } from "@/components/NicknameModal";
import { ToastProvider, useToast } from "@/components/Toast";
import type {
  TrackSearchResult,
  PlaylistItem,
  NicknameModalState,
} from "@/types";

const SPOTIFY_API = "https://api.spotify.com/v1";

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function getSpotifyToken(): Promise<{ accessToken: string; playlistId: string }> {
  const res = await fetch("/api/spotify-token");
  if (!res.ok) throw new Error("토큰을 가져올 수 없습니다.");
  return res.json();
}

function JukeboxApp() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const isAdmin = !!session;

  const [searchResults, setSearchResults] = useState<TrackSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(true);
  const [modal, setModal] = useState<NicknameModalState>({
    isOpen: false,
    trackUri: "",
    trackTitle: "",
  });
  const [isAdding, setIsAdding] = useState(false);

  const fetchPlaylist = useCallback(async () => {
    setIsPlaylistLoading(true);
    try {
      const { accessToken, playlistId } = await getSpotifyToken();

      // Fetch tracks directly from Spotify (bypasses Vercel IP restriction)
      const spotifyRes = await fetch(
        `${SPOTIFY_API}/playlists/${playlistId}/tracks?limit=50&fields=next,items(track(id,uri,name,duration_ms,artists,album(images)))`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!spotifyRes.ok) {
        const err = await spotifyRes.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message ?? `Spotify ${spotifyRes.status}`);
      }
      const spotifyData = await spotifyRes.json();

      // Get nicknames from server
      const nicknameRes = await fetch("/api/playlist/list");
      const { nicknames } = await nicknameRes.json() as { nicknames: Record<string, string> };

      const items: PlaylistItem[] = (spotifyData.items ?? [])
        .filter((item: { track: unknown }) => item.track)
        .map((item: { track: { uri: string; id: string; name: string; duration_ms: number; artists: { name: string }[]; album: { images: { url: string }[] } } }, index: number) => ({
          trackUri: item.track.uri,
          trackId: item.track.id,
          title: item.track.name,
          thumbnail: item.track.album.images[0]?.url ?? "",
          artistName: item.track.artists.map((a) => a.name).join(", "),
          duration: formatDuration(item.track.duration_ms),
          addedBy: nicknames?.[item.track.uri] ?? "",
          position: index,
        }));

      setPlaylist(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : "플레이리스트를 불러오는 데 실패했습니다.";
      addToast(message, "error");
    } finally {
      setIsPlaylistLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  const playlistTrackUris = new Set(playlist.map((item) => item.trackUri));
  const enrichedResults = searchResults.map((r) => ({
    ...r,
    isInPlaylist: playlistTrackUris.has(r.trackUri),
  }));

  const handleAddClick = (track: TrackSearchResult) => {
    setModal({ isOpen: true, trackUri: track.trackUri, trackTitle: track.title });
  };

  const handleNicknameConfirm = async (nickname: string) => {
    setIsAdding(true);
    try {
      const { accessToken, playlistId } = await getSpotifyToken();

      // Add track directly via Spotify API from browser
      const spotifyRes = await fetch(`${SPOTIFY_API}/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [modal.trackUri] }),
      });
      if (!spotifyRes.ok) {
        const err = await spotifyRes.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message ?? `Spotify ${spotifyRes.status}`);
      }

      // Store nickname on server
      await fetch("/api/playlist/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackUri: modal.trackUri, nickname }),
      });

      addToast(`"${modal.trackTitle.slice(0, 30)}..." 을(를) 추가했어요! 🎵`, "success");
      setModal({ isOpen: false, trackUri: "", trackTitle: "" });
      await fetchPlaylist();
    } catch (err) {
      const message = err instanceof Error ? err.message : "곡 추가에 실패했습니다.";
      addToast(message, "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (item: PlaylistItem) => {
    if (!confirm(`"${item.title}" 을(를) 삭제하시겠습니까?`)) return;
    try {
      const { accessToken, playlistId } = await getSpotifyToken();

      // Remove track directly via Spotify API from browser
      const spotifyRes = await fetch(`${SPOTIFY_API}/playlists/${playlistId}/tracks`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tracks: [{ uri: item.trackUri }] }),
      });
      if (!spotifyRes.ok) {
        const err = await spotifyRes.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message ?? `Spotify ${spotifyRes.status}`);
      }

      // Delete nickname on server
      await fetch("/api/playlist/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackUri: item.trackUri }),
      });

      addToast("곡이 삭제되었습니다.", "info");
      await fetchPlaylist();
    } catch (err) {
      const message = err instanceof Error ? err.message : "삭제에 실패했습니다.";
      addToast(message, "error");
    }
  };

  const handleReorder = async (item: PlaylistItem, direction: "up" | "down") => {
    const rangeStart = item.position;
    const insertBefore = direction === "up" ? rangeStart - 1 : rangeStart + 2;
    if (insertBefore < 0 || insertBefore > playlist.length) return;

    try {
      const { accessToken, playlistId } = await getSpotifyToken();

      // Reorder directly via Spotify API from browser
      const spotifyRes = await fetch(`${SPOTIFY_API}/playlists/${playlistId}/tracks`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ range_start: rangeStart, insert_before: insertBefore, range_length: 1 }),
      });
      if (!spotifyRes.ok) {
        const err = await spotifyRes.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message ?? `Spotify ${spotifyRes.status}`);
      }

      await fetchPlaylist();
    } catch (err) {
      const message = err instanceof Error ? err.message : "순서 변경에 실패했습니다.";
      addToast(message, "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">노래 검색</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              원하는 노래를 검색하고 플레이리스트에 추가하세요
            </p>
          </div>
          <SearchSection
            onResults={setSearchResults}
            onLoading={setIsSearching}
            isLoading={isSearching}
          />
        </section>

        {(enrichedResults.length > 0 || isSearching) && (
          <section>
            <SearchResults results={enrichedResults} onAddClick={handleAddClick} />
          </section>
        )}

        <section>
          <PlaylistView
            items={playlist}
            isAdmin={isAdmin}
            isLoading={isPlaylistLoading}
            onRemove={handleRemove}
            onMoveUp={(item) => handleReorder(item, "up")}
            onMoveDown={(item) => handleReorder(item, "down")}
            onRefresh={fetchPlaylist}
          />
        </section>
      </main>

      {modal.isOpen && (
        <NicknameModal
          videoTitle={modal.trackTitle}
          onConfirm={handleNicknameConfirm}
          onClose={() => setModal({ isOpen: false, trackUri: "", trackTitle: "" })}
          isLoading={isAdding}
        />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <JukeboxApp />
    </ToastProvider>
  );
}
