export interface VideoSearchResult {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration: string;
  isInPlaylist?: boolean;
}

export interface PlaylistItem {
  playlistItemId: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration: string;
  addedBy: string;
  position: number;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface NicknameModalState {
  isOpen: boolean;
  videoId: string;
  videoTitle: string;
}

// next-auth augmentation
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}
