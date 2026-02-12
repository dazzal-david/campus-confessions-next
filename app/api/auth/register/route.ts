import { NextRequest, NextResponse } from "next/server";
import { dbGet, dbRun } from "@/lib/db";
import { hashPassword } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password required" },
      { status: 400 }
    );
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return NextResponse.json(
      { error: "Username: 3-20 chars, letters/numbers/underscores only" },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  try {
    const existing = await dbGet<{ id: number }>(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );
    if (existing) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    const hash = await hashPassword(password);
    const result = await dbRun(
      "INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)",
      [username, hash, username]
    );

    return NextResponse.json({
      success: true,
      user: {
        id: result.lastInsertRowid,
        username,
        display_name: username,
        bio: "",
        avatar_url: null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
