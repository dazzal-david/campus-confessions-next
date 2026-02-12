import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const result = db
    .prepare("DELETE FROM replies_v2 WHERE id = ? AND user_id = ?")
    .run(id, session.user.id);

  if (result.changes === 0) {
    return NextResponse.json(
      { error: "Reply not found or not yours" },
      { status: 404 }
    );
  }

  return NextResponse.json({ deleted: true });
}
