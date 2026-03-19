export interface TrackSearchResult {
  trackId: string;
  trackUri: string;
  title: string;
  thumbnail: string; // album art URL
  artistName: string;
  duration: string;
  isInPlaylist?: boolean;
}

export interface PlaylistItem {
  trackUri: string;
  trackId: string;
  title: string;
  thumbnail: string;
  artistName: string;
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
  trackUri: string;
  trackTitle: string;
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
