import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { removeFromPlaylist } from "@/lib/youtube";

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }

  let body: { playlistItemId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { playlistItemId } = body;
  if (!playlistItemId) {
    return NextResponse.json(
      { error: "playlistItemId가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    await removeFromPlaylist(playlistItemId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/playlist/remove]", err);
    const message =
      err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
