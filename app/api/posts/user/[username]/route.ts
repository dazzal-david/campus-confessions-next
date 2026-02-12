import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, getReactionsForPosts } from "@/lib/db";

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
      `SELECT posts_v2.*, u.username, u.display_name, u.avatar_url,
        COALESCE(lc.like_count, 0) as like_count,
        COALESCE(rep.reply_count, 0) as reply_count,
        COALESCE(rpc.repost_count, 0) as repost_count,
        CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END as user_liked,
        CASE WHEN ur.id IS NOT NULL THEN 1 ELSE 0 END as user_reposted,
        CASE WHEN ub.id IS NOT NULL THEN 1 ELSE 0 END as user_bookmarked
      FROM posts_v2
      JOIN users u ON u.id = posts_v2.user_id
      LEFT JOIN (SELECT post_id, COUNT(*) as like_count FROM likes GROUP BY post_id) lc ON lc.post_id = posts_v2.id
      LEFT JOIN (SELECT post_id, COUNT(*) as reply_count FROM replies_v2 GROUP BY post_id) rep ON rep.post_id = posts_v2.id
      LEFT JOIN (SELECT post_id, COUNT(*) as repost_count FROM reposts GROUP BY post_id) rpc ON rpc.post_id = posts_v2.id
      LEFT JOIN likes ul ON ul.post_id = posts_v2.id AND ul.user_id = ?
      LEFT JOIN reposts ur ON ur.post_id = posts_v2.id AND ur.user_id = ?
      LEFT JOIN bookmarks ub ON ub.post_id = posts_v2.id AND ub.user_id = ?
      WHERE posts_v2.user_id = ?
      ORDER BY posts_v2.timestamp DESC`
    )
    .all(session.user.id, session.user.id, session.user.id, user.id) as {
    id: number;
  }[];

  const ids = rows.map((r) => r.id);
  const { reactionsMap, userReactionsMap } = getReactionsForPosts(
    ids,
    Number(session.user.id)
  );

  return NextResponse.json(
    rows.map((row) => ({
      ...row,
      reactions: reactionsMap[row.id] || {},
      user_reactions: userReactionsMap[row.id] || [],
    }))
  );
}
