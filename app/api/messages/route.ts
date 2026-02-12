import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbAll } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const rows = await dbAll(
    `SELECT
      CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_id,
      u.username, u.display_name, u.avatar_url,
      m.text as last_message, m.timestamp,
      SUM(CASE WHEN m.receiver_id = ? AND m.is_read = 0 THEN 1 ELSE 0 END) as unread_count
    FROM messages m
    JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
    WHERE m.sender_id = ? OR m.receiver_id = ?
    GROUP BY other_id
    ORDER BY MAX(m.timestamp) DESC`,
    [userId, userId, userId, userId, userId]
  );

  return NextResponse.json(rows);
}
