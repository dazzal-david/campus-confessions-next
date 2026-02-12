import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await params;
  const db = getDb();
  const user = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username) as { id: number } | undefined;

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const rows = db
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.avatar_url,
        CASE WHEN f2.id IS NOT NULL THEN 1 ELSE 0 END as you_follow
       FROM follows f
       JOIN users u ON u.id = f.follower_id
       LEFT JOIN follows f2 ON f2.follower_id = ? AND f2.following_id = u.id
       WHERE f.following_id = ? ORDER BY f.timestamp DESC`
    )
    .all(session.user.id, user.id);

  return NextResponse.json(rows);
}
