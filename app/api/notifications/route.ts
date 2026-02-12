import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT n.*, u.username as actor_username, u.display_name as actor_display_name, u.avatar_url as actor_avatar
       FROM notifications n
       JOIN users u ON u.id = n.actor_id
       WHERE n.user_id = ?
       ORDER BY n.timestamp DESC
       LIMIT 50`
    )
    .all(session.user.id);

  return NextResponse.json(rows);
}
