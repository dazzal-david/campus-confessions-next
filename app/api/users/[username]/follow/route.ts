import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbGet, dbRun, createNotification } from "@/lib/db";

export async function POST(
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
  if (user.id === Number(session.user.id)) {
    return NextResponse.json(
      { error: "Cannot follow yourself" },
      { status: 400 }
    );
  }

  const existing = await dbGet(
    "SELECT id FROM follows WHERE follower_id = ? AND following_id = ?",
    [session.user.id, user.id]
  );

  if (existing) {
    await dbRun(
      "DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
      [session.user.id, user.id]
    );
    return NextResponse.json({ following: false });
  } else {
    await dbRun(
      "INSERT INTO follows (follower_id, following_id) VALUES (?, ?)",
      [session.user.id, user.id]
    );
    await createNotification(user.id, "follow", Number(session.user.id), null);
    return NextResponse.json({ following: true });
  }
}
