import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbRun } from "@/lib/db";

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { display_name, bio } = await request.json();
  const safeName = (display_name || "").trim().slice(0, 30) || session.user.username;
  const safeBio = (bio || "").trim().slice(0, 160);

  await dbRun(
    "UPDATE users SET display_name = ?, bio = ? WHERE id = ?",
    [safeName, safeBio, session.user.id]
  );

  return NextResponse.json({ display_name: safeName, bio: safeBio });
}
