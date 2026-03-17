import { NextRequest, NextResponse } from "next/server";
import { searchYouTube } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: "검색어를 입력해주세요." }, { status: 400 });
  }

  try {
    const results = await searchYouTube(query.trim());
    return NextResponse.json({ items: results });
  } catch (err) {
    console.error("[/api/search]", err);
    return NextResponse.json(
      { error: "검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
