import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbGet, dbRun } from "@/lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;
  const existing = await dbGet(
    "SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?",
    [session.user.id, postId]
  );

  if (existing) {
    await dbRun("DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?", [
      session.user.id,
      postId,
    ]);
    return NextResponse.json({ bookmarked: false });
  } else {
    await dbRun("INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)", [
      session.user.id,
      postId,
    ]);
    return NextResponse.json({ bookmarked: true });
  }
}
