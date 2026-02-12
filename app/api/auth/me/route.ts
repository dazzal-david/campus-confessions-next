import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbGet } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await dbGet(
    "SELECT id, username, display_name, bio, avatar_url, created_at FROM users WHERE id = ?",
    [session.user.id]
  );

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
