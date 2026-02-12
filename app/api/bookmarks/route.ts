import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbAll, getReactionsForPosts } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const rows = await dbAll<{ id: number }>(
    `SELECT posts_v2.*, u.username, u.display_name, u.avatar_url,
      COALESCE(lc.like_count, 0) as like_count,
      COALESCE(rep.reply_count, 0) as reply_count,
      COALESCE(rpc.repost_count, 0) as repost_count,
      1 as user_bookmarked,
      CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END as user_liked,
      CASE WHEN ur.id IS NOT NULL THEN 1 ELSE 0 END as user_reposted
    FROM bookmarks b
    JOIN posts_v2 ON posts_v2.id = b.post_id
    JOIN users u ON u.id = posts_v2.user_id
    LEFT JOIN (SELECT post_id, COUNT(*) as like_count FROM likes GROUP BY post_id) lc ON lc.post_id = posts_v2.id
    LEFT JOIN (SELECT post_id, COUNT(*) as reply_count FROM replies_v2 GROUP BY post_id) rep ON rep.post_id = posts_v2.id
    LEFT JOIN (SELECT post_id, COUNT(*) as repost_count FROM reposts GROUP BY post_id) rpc ON rpc.post_id = posts_v2.id
    LEFT JOIN likes ul ON ul.post_id = posts_v2.id AND ul.user_id = ?
    LEFT JOIN reposts ur ON ur.post_id = posts_v2.id AND ur.user_id = ?
    WHERE b.user_id = ?
    ORDER BY b.timestamp DESC`,
    [userId, userId, userId]
  );

  const ids = rows.map((r) => r.id);
  const { reactionsMap, userReactionsMap } = await getReactionsForPosts(
    ids,
    Number(userId)
  );

  return NextResponse.json(
    rows.map((row) => ({
      ...row,
      reactions: reactionsMap[row.id] || {},
      user_reactions: userReactionsMap[row.id] || [],
    }))
  );
}
