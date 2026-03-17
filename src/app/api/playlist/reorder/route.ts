import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { reorderPlaylistItem } from "@/lib/youtube";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }

  let body: {
    playlistItemId?: string;
    videoId?: string;
    newPosition?: number;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { playlistItemId, videoId, newPosition, note = "" } = body;

  if (!playlistItemId || !videoId || newPosition === undefined) {
    return NextResponse.json(
      { error: "playlistItemId, videoId, newPosition이 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const result = await reorderPlaylistItem(
      playlistItemId,
      videoId,
      newPosition,
      note
    );
    return NextResponse.json({ success: true, item: result });
  } catch (err) {
    console.error("[/api/playlist/reorder]", err);
    const message =
      err instanceof Error ? err.message : "순서 변경 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
