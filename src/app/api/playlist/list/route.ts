import { NextResponse } from "next/server";
import { fetchPlaylistItems } from "@/lib/youtube";

export async function GET() {
  try {
    const items = await fetchPlaylistItems();
    return NextResponse.json({ items });
  } catch (err) {
    console.error("[/api/playlist/list]", err);
    return NextResponse.json(
      { error: "플레이리스트를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
