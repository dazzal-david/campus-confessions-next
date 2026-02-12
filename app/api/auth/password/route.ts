import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
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

  const db = getDb();
  const user = db
    .prepare("SELECT password_hash FROM users WHERE id = ?")
    .get(session.user.id) as { password_hash: string } | undefined;

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
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
    hash,
    session.user.id
  );

  return NextResponse.json({ success: true });
}
