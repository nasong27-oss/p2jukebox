import { NextResponse } from "next/server";
import { fetchPlaylistTracks } from "@/lib/spotify";
import { getNicknames } from "@/lib/nicknameStore";

export async function GET() {
  try {
    const items = await fetchPlaylistTracks();

    // Merge stored nicknames
    const nicknames = getNicknames(items.map((i) => i.trackUri));
    const merged = items.map((item) => ({
      ...item,
      addedBy: nicknames[item.trackUri] ?? "",
    }));

    return NextResponse.json({ items: merged });
  } catch (err) {
    console.error("[/api/playlist/list]", err);
    return NextResponse.json(
      { error: "플레이리스트를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
