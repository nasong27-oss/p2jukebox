import { NextRequest, NextResponse } from "next/server";
import { addTrackToPlaylist } from "@/lib/spotify";
import { setNickname } from "@/lib/nicknameStore";

export async function POST(request: NextRequest) {
  let body: { trackUri?: string; nickname?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { trackUri, nickname } = body;

  if (!trackUri) {
    return NextResponse.json({ error: "trackUri가 필요합니다." }, { status: 400 });
  }
  if (!nickname || nickname.trim().length === 0) {
    return NextResponse.json({ error: "닉네임을 입력해주세요." }, { status: 400 });
  }

  try {
    const result = await addTrackToPlaylist(trackUri);

    // Store nickname for display
    setNickname(trackUri, `${nickname.trim()}이(가) 추가함`);

    return NextResponse.json({ success: true, item: result });
  } catch (err) {
    console.error("[/api/playlist/add]", err);
    const message =
      err instanceof Error ? err.message : "곡 추가 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
