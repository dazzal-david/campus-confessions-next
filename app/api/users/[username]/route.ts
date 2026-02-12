import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbGet } from "@/lib/db";

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
    "SELECT id, username, display_name, bio, avatar_url, created_at FROM users WHERE username = ?",
    [username]
  );

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userId = user.id;
  const postCount = await dbGet<{ count: number }>(
    "SELECT COUNT(*) as count FROM posts_v2 WHERE user_id = ?",
    [userId]
  );
  const followerCount = await dbGet<{ count: number }>(
    "SELECT COUNT(*) as count FROM follows WHERE following_id = ?",
    [userId]
  );
  const followingCount = await dbGet<{ count: number }>(
    "SELECT COUNT(*) as count FROM follows WHERE follower_id = ?",
    [userId]
  );
  const isFollowing = await dbGet(
    "SELECT id FROM follows WHERE follower_id = ? AND following_id = ?",
    [session.user.id, userId]
  );

  return NextResponse.json({
    ...user,
    post_count: postCount!.count,
    follower_count: followerCount!.count,
    following_count: followingCount!.count,
    is_following: !!isFollowing,
    is_self: Number(session.user.id) === userId,
  });
}
