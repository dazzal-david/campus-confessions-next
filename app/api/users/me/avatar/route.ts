import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbRun } from "@/lib/db";
import { processImage } from "@/lib/image";

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("avatar") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, GIF, WebP images allowed" },
      { status: 400 }
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image too large" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await processImage(buffer);
    await dbRun(
      "UPDATE users SET avatar_url = ? WHERE id = ?",
      [url, session.user.id]
    );
    return NextResponse.json({ avatar_url: url });
  } catch {
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
