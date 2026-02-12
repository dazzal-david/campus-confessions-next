import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbGet } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await dbGet<{ count: number }>(
    "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0",
    [session.user.id]
  );

  return NextResponse.json({ count: row!.count });
}
