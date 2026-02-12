import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbAll, dbRun, dbGet, createNotification } from "@/lib/db";
import { POST_MAX_LENGTH } from "@/lib/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const rows = await dbAll(
    `SELECT replies_v2.*, u.username, u.display_name, u.avatar_url
     FROM replies_v2
     JOIN users u ON u.id = replies_v2.user_id
     WHERE replies_v2.post_id = ?
     ORDER BY replies_v2.timestamp ASC`,
    [id]
  );

  return NextResponse.json(rows);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text: rawText } = await request.json();
  const text = (rawText || "").trim();
  if (!text) {
    return NextResponse.json(
      { error: "Reply cannot be empty" },
      { status: 400 }
    );
  }
  if (text.length > POST_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Max ${POST_MAX_LENGTH} characters` },
      { status: 400 }
    );
  }

  const { id: postId } = await params;
  const result = await dbRun(
    "INSERT INTO replies_v2 (post_id, user_id, text) VALUES (?, ?, ?)",
    [postId, session.user.id, text]
  );

  const post = await dbGet<{ user_id: number }>(
    "SELECT user_id FROM posts_v2 WHERE id = ?",
    [postId]
  );
  if (post)
    await createNotification(
      post.user_id,
      "reply",
      Number(session.user.id),
      Number(postId)
    );

  return NextResponse.json({
    id: result.lastInsertRowid,
    post_id: Number(postId),
    text,
    username: session.user.username,
  });
}
