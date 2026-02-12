import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbAll, dbRun, getReactionsForPosts } from "@/lib/db";
import { POST_MAX_LENGTH, VALID_MOODS } from "@/lib/constants";
import { processImage } from "@/lib/image";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feedType = request.nextUrl.searchParams.get("feed") || "all";
  const sortType = request.nextUrl.searchParams.get("sort") || "recent";

  let orderClause = "posts_v2.timestamp DESC";
  if (sortType === "top") {
    orderClause =
      "(COALESCE(lc.like_count, 0) + COALESCE(rpc.repost_count, 0) + COALESCE(rc.reaction_count, 0)) DESC";
  }

  let whereClause = "";
  const params: (string | number)[] = [
    session.user.id,
    session.user.id,
    session.user.id,
  ];
  if (feedType === "following") {
    whereClause =
      "WHERE posts_v2.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)";
    params.push(session.user.id);
  }

  const rows = await dbAll<{ id: number }>(
    `SELECT posts_v2.*,
      u.username, u.display_name, u.avatar_url,
      COALESCE(rc.reaction_count, 0) as reaction_count,
      COALESCE(rep.reply_count, 0) as reply_count,
      COALESCE(lc.like_count, 0) as like_count,
      COALESCE(rpc.repost_count, 0) as repost_count,
      CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END as user_liked,
      CASE WHEN ur.id IS NOT NULL THEN 1 ELSE 0 END as user_reposted,
      CASE WHEN ub.id IS NOT NULL THEN 1 ELSE 0 END as user_bookmarked
    FROM posts_v2
    JOIN users u ON u.id = posts_v2.user_id
    LEFT JOIN (SELECT post_id, COUNT(*) as reaction_count FROM reactions_v2 GROUP BY post_id) rc ON rc.post_id = posts_v2.id
    LEFT JOIN (SELECT post_id, COUNT(*) as reply_count FROM replies_v2 GROUP BY post_id) rep ON rep.post_id = posts_v2.id
    LEFT JOIN (SELECT post_id, COUNT(*) as like_count FROM likes GROUP BY post_id) lc ON lc.post_id = posts_v2.id
    LEFT JOIN (SELECT post_id, COUNT(*) as repost_count FROM reposts GROUP BY post_id) rpc ON rpc.post_id = posts_v2.id
    LEFT JOIN likes ul ON ul.post_id = posts_v2.id AND ul.user_id = ?
    LEFT JOIN reposts ur ON ur.post_id = posts_v2.id AND ur.user_id = ?
    LEFT JOIN bookmarks ub ON ub.post_id = posts_v2.id AND ub.user_id = ?
    ${whereClause}
    ORDER BY ${orderClause}
    LIMIT 100`,
    params
  );

  const ids = rows.map((r) => r.id);
  const { reactionsMap, userReactionsMap } = await getReactionsForPosts(
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

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const text = (formData.get("text") as string || "").trim();
  if (!text) {
    return NextResponse.json(
      { error: "Post cannot be empty" },
      { status: 400 }
    );
  }
  if (text.length > POST_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Max ${POST_MAX_LENGTH} characters` },
      { status: 400 }
    );
  }

  const mood = formData.get("mood") as string || "none";
  const safeMood = (VALID_MOODS as readonly string[]).includes(mood)
    ? mood
    : "none";

  let imageUrl: string | null = null;
  const file = formData.get("image") as File | null;
  if (file && file.size > 0) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      imageUrl = await processImage(buffer);
    } catch {
      return NextResponse.json(
        { error: "Failed to process image" },
        { status: 500 }
      );
    }
  }

  const result = await dbRun(
    "INSERT INTO posts_v2 (user_id, text, mood, image_url) VALUES (?, ?, ?, ?)",
    [session.user.id, text, safeMood, imageUrl]
  );

  return NextResponse.json({
    id: result.lastInsertRowid,
    user_id: Number(session.user.id),
    text,
    mood: safeMood,
    image_url: imageUrl,
    username: session.user.username,
  });
}
