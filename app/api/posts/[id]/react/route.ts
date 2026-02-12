import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, createNotification } from "@/lib/db";
import { VALID_REACTIONS } from "@/lib/constants";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await request.json();
  if (!(VALID_REACTIONS as readonly string[]).includes(type)) {
    return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
  }

  const { id: postId } = await params;
  const db = getDb();
  const existing = db
    .prepare(
      "SELECT id FROM reactions_v2 WHERE post_id = ? AND user_id = ? AND type = ?"
    )
    .get(postId, session.user.id, type);

  if (existing) {
    db.prepare(
      "DELETE FROM reactions_v2 WHERE post_id = ? AND user_id = ? AND type = ?"
    ).run(postId, session.user.id, type);
  } else {
    db.prepare(
      "INSERT INTO reactions_v2 (post_id, user_id, type) VALUES (?, ?, ?)"
    ).run(postId, session.user.id, type);
    const post = db
      .prepare("SELECT user_id FROM posts_v2 WHERE id = ?")
      .get(postId) as { user_id: number } | undefined;
    if (post)
      createNotification(
        post.user_id,
        "reaction",
        Number(session.user.id),
        Number(postId)
      );
  }

  const rows = db
    .prepare(
      "SELECT type, COUNT(*) as count FROM reactions_v2 WHERE post_id = ? GROUP BY type"
    )
    .all(postId) as { type: string; count: number }[];

  const reactions: Record<string, number> = {};
  for (const r of rows) reactions[r.type] = r.count;

  return NextResponse.json({ reacted: !existing, reactions });
}
