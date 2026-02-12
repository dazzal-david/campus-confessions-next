import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbGet, dbRun, dbAll, createNotification } from "@/lib/db";
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
  const existing = await dbGet(
    "SELECT id FROM reactions_v2 WHERE post_id = ? AND user_id = ? AND type = ?",
    [postId, session.user.id, type]
  );

  if (existing) {
    await dbRun(
      "DELETE FROM reactions_v2 WHERE post_id = ? AND user_id = ? AND type = ?",
      [postId, session.user.id, type]
    );
  } else {
    await dbRun(
      "INSERT INTO reactions_v2 (post_id, user_id, type) VALUES (?, ?, ?)",
      [postId, session.user.id, type]
    );
    const post = await dbGet<{ user_id: number }>(
      "SELECT user_id FROM posts_v2 WHERE id = ?",
      [postId]
    );
    if (post)
      await createNotification(
        post.user_id,
        "reaction",
        Number(session.user.id),
        Number(postId)
      );
  }

  const rows = await dbAll<{ type: string; count: number }>(
    "SELECT type, COUNT(*) as count FROM reactions_v2 WHERE post_id = ? GROUP BY type",
    [postId]
  );

  const reactions: Record<string, number> = {};
  for (const r of rows) reactions[r.type] = r.count;

  return NextResponse.json({ reacted: !existing, reactions });
}
