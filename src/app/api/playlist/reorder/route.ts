import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  // Reorder is handled client-side via Spotify API directly
  return NextResponse.json({ success: true });
}
