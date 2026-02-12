import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM bookmarks WHERE user_id = ? AND post_id = ?")
    .get(session.user.id, postId);

  if (existing) {
    db.prepare("DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?").run(
      session.user.id,
      postId
    );
    return NextResponse.json({ bookmarked: false });
  } else {
    db.prepare("INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)").run(
      session.user.id,
      postId
    );
    return NextResponse.json({ bookmarked: true });
  }
}
