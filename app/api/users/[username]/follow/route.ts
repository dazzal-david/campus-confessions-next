import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, createNotification } from "@/lib/db";

export async function POST(
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
  if (user.id === Number(session.user.id)) {
    return NextResponse.json(
      { error: "Cannot follow yourself" },
      { status: 400 }
    );
  }

  const existing = db
    .prepare(
      "SELECT id FROM follows WHERE follower_id = ? AND following_id = ?"
    )
    .get(session.user.id, user.id);

  if (existing) {
    db.prepare(
      "DELETE FROM follows WHERE follower_id = ? AND following_id = ?"
    ).run(session.user.id, user.id);
    return NextResponse.json({ following: false });
  } else {
    db.prepare(
      "INSERT INTO follows (follower_id, following_id) VALUES (?, ?)"
    ).run(session.user.id, user.id);
    createNotification(user.id, "follow", Number(session.user.id), null);
    return NextResponse.json({ following: true });
  }
}
