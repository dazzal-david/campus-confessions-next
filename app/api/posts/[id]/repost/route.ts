import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, createNotification } from "@/lib/db";

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
    .prepare("SELECT id FROM reposts WHERE user_id = ? AND post_id = ?")
    .get(session.user.id, postId);

  if (existing) {
    db.prepare("DELETE FROM reposts WHERE user_id = ? AND post_id = ?").run(
      session.user.id,
      postId
    );
  } else {
    db.prepare("INSERT INTO reposts (user_id, post_id) VALUES (?, ?)").run(
      session.user.id,
      postId
    );
    const post = db
      .prepare("SELECT user_id FROM posts_v2 WHERE id = ?")
      .get(postId) as { user_id: number } | undefined;
    if (post)
      createNotification(
        post.user_id,
        "repost",
        Number(session.user.id),
        Number(postId)
      );
  }

  const count = db
    .prepare("SELECT COUNT(*) as count FROM reposts WHERE post_id = ?")
    .get(postId) as { count: number };

  return NextResponse.json({
    reposted: !existing,
    repost_count: count.count,
  });
}
