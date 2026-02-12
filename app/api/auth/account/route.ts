import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbBatch } from "@/lib/db";

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  await dbBatch([
    { sql: "DELETE FROM notifications WHERE user_id = ? OR actor_id = ?", args: [userId, userId] },
    { sql: "DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?", args: [userId, userId] },
    { sql: "DELETE FROM bookmarks WHERE user_id = ?", args: [userId] },
    { sql: "DELETE FROM follows WHERE follower_id = ? OR following_id = ?", args: [userId, userId] },
    { sql: "DELETE FROM reactions_v2 WHERE user_id = ?", args: [userId] },
    { sql: "DELETE FROM likes WHERE user_id = ?", args: [userId] },
    { sql: "DELETE FROM reposts WHERE user_id = ?", args: [userId] },
    { sql: "DELETE FROM replies_v2 WHERE user_id = ?", args: [userId] },
    { sql: "DELETE FROM posts_v2 WHERE user_id = ?", args: [userId] },
    { sql: "DELETE FROM users WHERE id = ?", args: [userId] },
  ]);

  return NextResponse.json({ deleted: true });
}
