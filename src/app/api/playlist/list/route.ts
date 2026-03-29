import { NextResponse } from "next/server";
import { getAllNicknames } from "@/lib/nicknameStore";

export async function GET() {
  return NextResponse.json({ nicknames: getAllNicknames() });
}
