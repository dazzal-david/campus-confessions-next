import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, getReactionsForPosts } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const row = db
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
      WHERE posts_v2.id = ?`
    )
    .get(session.user.id, session.user.id, session.user.id, id) as {
    id: number;
  } | undefined;

  if (!row) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const { reactionsMap, userReactionsMap } = getReactionsForPosts(
    [row.id],
    Number(session.user.id)
  );

  return NextResponse.json({
    ...row,
    reactions: reactionsMap[row.id] || {},
    user_reactions: userReactionsMap[row.id] || [],
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const post = db
    .prepare("SELECT * FROM posts_v2 WHERE id = ? AND user_id = ?")
    .get(id, session.user.id);

  if (!post) {
    return NextResponse.json(
      { error: "Post not found or not yours" },
      { status: 404 }
    );
  }

  const deletePost = db.transaction(() => {
    db.prepare("DELETE FROM likes WHERE post_id = ?").run(id);
    db.prepare("DELETE FROM reposts WHERE post_id = ?").run(id);
    db.prepare("DELETE FROM reactions_v2 WHERE post_id = ?").run(id);
    db.prepare("DELETE FROM replies_v2 WHERE post_id = ?").run(id);
    db.prepare("DELETE FROM bookmarks WHERE post_id = ?").run(id);
    db.prepare("DELETE FROM posts_v2 WHERE id = ?").run(id);
  });

  deletePost();
  return NextResponse.json({ deleted: true });
}
