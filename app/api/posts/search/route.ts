import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbAll } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (!q) return NextResponse.json([]);

  const rows = await dbAll(
    `SELECT posts_v2.*, u.username, u.display_name, u.avatar_url,
      COALESCE(lc.like_count, 0) as like_count,
      COALESCE(rep.reply_count, 0) as reply_count
    FROM posts_v2
    JOIN users u ON u.id = posts_v2.user_id
    LEFT JOIN (SELECT post_id, COUNT(*) as like_count FROM likes GROUP BY post_id) lc ON lc.post_id = posts_v2.id
    LEFT JOIN (SELECT post_id, COUNT(*) as reply_count FROM replies_v2 GROUP BY post_id) rep ON rep.post_id = posts_v2.id
    WHERE posts_v2.text LIKE ?
    ORDER BY posts_v2.timestamp DESC LIMIT 50`,
    [`%${q}%`]
  );

  return NextResponse.json(rows);
}
