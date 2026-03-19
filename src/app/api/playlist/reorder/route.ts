import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { reorderPlaylistTrack } from "@/lib/spotify";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }

  let body: { rangeStart?: number; insertBefore?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { rangeStart, insertBefore } = body;
  if (rangeStart === undefined || insertBefore === undefined) {
    return NextResponse.json(
      { error: "rangeStart, insertBefore 가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const result = await reorderPlaylistTrack(rangeStart, insertBefore);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("[/api/playlist/reorder]", err);
    const message =
      err instanceof Error ? err.message : "순서 변경 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
