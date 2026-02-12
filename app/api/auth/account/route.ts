import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const userId = session.user.id;

  const deleteAll = db.transaction(() => {
    db.prepare("DELETE FROM notifications WHERE user_id = ? OR actor_id = ?").run(userId, userId);
    db.prepare("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?").run(userId, userId);
    db.prepare("DELETE FROM bookmarks WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM follows WHERE follower_id = ? OR following_id = ?").run(userId, userId);
    db.prepare("DELETE FROM reactions_v2 WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM likes WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM reposts WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM replies_v2 WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM posts_v2 WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
  });

  deleteAll();

  return NextResponse.json({ deleted: true });
}
