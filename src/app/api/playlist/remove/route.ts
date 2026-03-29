import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { deleteNickname } from "@/lib/nicknameStore";

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }

  let body: { trackUri?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { trackUri } = body;
  if (!trackUri) {
    return NextResponse.json({ error: "trackUri가 필요합니다." }, { status: 400 });
  }

  deleteNickname(trackUri);
  return NextResponse.json({ success: true });
}
