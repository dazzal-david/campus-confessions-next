import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbGet, dbRun, dbAll, createNotification } from "@/lib/db";
import { MSG_MAX_LENGTH } from "@/lib/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await params;
  const user = await dbGet<{ id: number }>(
    "SELECT id FROM users WHERE username = ?",
    [username]
  );

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await dbRun(
    "UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ?",
    [user.id, session.user.id]
  );

  const rows = await dbAll(
    `SELECT m.*, u.username as sender_username, u.display_name as sender_display_name, u.avatar_url as sender_avatar
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
     ORDER BY m.timestamp ASC`,
    [session.user.id, user.id, user.id, session.user.id]
  );

  return NextResponse.json(rows);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text: rawText } = await request.json();
  const text = (rawText || "").trim();
  if (!text) {
    return NextResponse.json(
      { error: "Message cannot be empty" },
      { status: 400 }
    );
  }
  if (text.length > MSG_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Max ${MSG_MAX_LENGTH} characters` },
      { status: 400 }
    );
  }

  const { username } = await params;
  const user = await dbGet<{ id: number }>(
    "SELECT id FROM users WHERE username = ?",
    [username]
  );

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.id === Number(session.user.id)) {
    return NextResponse.json(
      { error: "Cannot message yourself" },
      { status: 400 }
    );
  }

  const result = await dbRun(
    "INSERT INTO messages (sender_id, receiver_id, text) VALUES (?, ?, ?)",
    [session.user.id, user.id, text]
  );

  await createNotification(
    user.id,
    "message",
    Number(session.user.id),
    Number(result.lastInsertRowid)
  );

  return NextResponse.json({
    id: result.lastInsertRowid,
    sender_id: Number(session.user.id),
    receiver_id: user.id,
    text,
    is_read: 0,
  });
}
