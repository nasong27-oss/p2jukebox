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

function JukeboxApp() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const isAdmin = !!session;

  // State
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

  // Fetch playlist
  const fetchPlaylist = useCallback(async () => {
    setIsPlaylistLoading(true);
    try {
      const res = await fetch("/api/playlist/list");
      const data = await res.json();
      setPlaylist(data.items ?? []);
    } catch {
      addToast("플레이리스트를 불러오는 데 실패했습니다.", "error");
    } finally {
      setIsPlaylistLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  // Enrich search results with "already in playlist" info
  const playlistTrackUris = new Set(playlist.map((item) => item.trackUri));
  const enrichedResults = searchResults.map((r) => ({
    ...r,
    isInPlaylist: playlistTrackUris.has(r.trackUri),
  }));

  // Handle add click – open nickname modal
  const handleAddClick = (track: TrackSearchResult) => {
    setModal({ isOpen: true, trackUri: track.trackUri, trackTitle: track.title });
  };

  // Handle nickname confirm – add to playlist
  const handleNicknameConfirm = async (nickname: string) => {
    setIsAdding(true);
    try {
      const res = await fetch("/api/playlist/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackUri: modal.trackUri, nickname }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "추가 실패");

      addToast(
        `"${modal.trackTitle.slice(0, 30)}..." 을(를) 추가했어요! 🎵`,
        "success"
      );
      setModal({ isOpen: false, trackUri: "", trackTitle: "" });
      await fetchPlaylist();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "곡 추가에 실패했습니다.";
      addToast(message, "error");
    } finally {
      setIsAdding(false);
    }
  };

  // Admin: remove
  const handleRemove = async (item: PlaylistItem) => {
    if (!confirm(`"${item.title}" 을(를) 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch("/api/playlist/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackUri: item.trackUri }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "삭제 실패");
      addToast("곡이 삭제되었습니다.", "info");
      await fetchPlaylist();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "삭제에 실패했습니다.";
      addToast(message, "error");
    }
  };

  // Admin: reorder
  const handleReorder = async (
    item: PlaylistItem,
    direction: "up" | "down"
  ) => {
    const rangeStart = item.position;
    // Spotify: insertBefore is the index BEFORE which to insert
    // Moving up: insert before the previous item (rangeStart - 1)
    // Moving down: insert before the item two positions ahead (rangeStart + 2)
    const insertBefore =
      direction === "up" ? rangeStart - 1 : rangeStart + 2;

    if (insertBefore < 0 || insertBefore > playlist.length) return;

    try {
      const res = await fetch("/api/playlist/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rangeStart, insertBefore }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "순서 변경 실패");
      await fetchPlaylist();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "순서 변경에 실패했습니다.";
      addToast(message, "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              노래 검색
            </h2>
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

        {/* Search Results */}
        {(enrichedResults.length > 0 || isSearching) && (
          <section>
            <SearchResults
              results={enrichedResults}
              onAddClick={handleAddClick}
            />
          </section>
        )}

        {/* Playlist */}
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

      {/* Nickname modal */}
      {modal.isOpen && (
        <NicknameModal
          videoTitle={modal.trackTitle}
          onConfirm={handleNicknameConfirm}
          onClose={() =>
            setModal({ isOpen: false, trackUri: "", trackTitle: "" })
          }
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
