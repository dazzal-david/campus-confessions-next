import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const row = db
    .prepare(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0"
    )
    .get(session.user.id) as { count: number };

  return NextResponse.json({ count: row.count });
}
