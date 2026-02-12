import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbGet, dbRun } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth-helpers";

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { current_password, new_password } = await request.json();

  if (!current_password || !new_password) {
    return NextResponse.json(
      { error: "Both passwords required" },
      { status: 400 }
    );
  }
  if (new_password.length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const user = await dbGet<{ password_hash: string }>(
    "SELECT password_hash FROM users WHERE id = ?",
    [session.user.id]
  );

  if (!user) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const match = await verifyPassword(current_password, user.password_hash);
  if (!match) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 401 }
    );
  }

  const hash = await hashPassword(new_password);
  await dbRun("UPDATE users SET password_hash = ? WHERE id = ?", [
    hash,
    session.user.id,
  ]);

  return NextResponse.json({ success: true });
}
