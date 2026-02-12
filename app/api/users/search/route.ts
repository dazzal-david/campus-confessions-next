import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbAll } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (!q) return NextResponse.json([]);

  const rows = await dbAll(
    "SELECT id, username, display_name, avatar_url FROM users WHERE username LIKE ? LIMIT 20",
    [`%${q}%`]
  );

  return NextResponse.json(rows);
}
