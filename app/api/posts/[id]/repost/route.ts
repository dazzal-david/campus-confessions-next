import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbGet, dbRun, createNotification } from "@/lib/db";

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
    "SELECT id FROM reposts WHERE user_id = ? AND post_id = ?",
    [session.user.id, postId]
  );

  if (existing) {
    await dbRun("DELETE FROM reposts WHERE user_id = ? AND post_id = ?", [
      session.user.id,
      postId,
    ]);
  } else {
    await dbRun("INSERT INTO reposts (user_id, post_id) VALUES (?, ?)", [
      session.user.id,
      postId,
    ]);
    const post = await dbGet<{ user_id: number }>(
      "SELECT user_id FROM posts_v2 WHERE id = ?",
      [postId]
    );
    if (post)
      await createNotification(
        post.user_id,
        "repost",
        Number(session.user.id),
        Number(postId)
      );
  }

  const count = await dbGet<{ count: number }>(
    "SELECT COUNT(*) as count FROM reposts WHERE post_id = ?",
    [postId]
  );

  return NextResponse.json({
    reposted: !existing,
    repost_count: count!.count,
  });
}
