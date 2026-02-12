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
    .prepare(
      "SELECT id, username, display_name, bio, avatar_url, created_at FROM users WHERE username = ?"
    )
    .get(username) as { id: number } | undefined;

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userId = user.id;
  const postCount = db
    .prepare("SELECT COUNT(*) as count FROM posts_v2 WHERE user_id = ?")
    .get(userId) as { count: number };
  const followerCount = db
    .prepare("SELECT COUNT(*) as count FROM follows WHERE following_id = ?")
    .get(userId) as { count: number };
  const followingCount = db
    .prepare("SELECT COUNT(*) as count FROM follows WHERE follower_id = ?")
    .get(userId) as { count: number };
  const isFollowing = db
    .prepare(
      "SELECT id FROM follows WHERE follower_id = ? AND following_id = ?"
    )
    .get(session.user.id, userId);

  return NextResponse.json({
    ...user,
    post_count: postCount.count,
    follower_count: followerCount.count,
    following_count: followingCount.count,
    is_following: !!isFollowing,
    is_self: Number(session.user.id) === userId,
  });
}
