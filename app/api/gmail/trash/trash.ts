import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/middleware";
import { trashEmailBatch } from "@/lib/gmail";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { ids } = body as { ids: string[] };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }

  if (ids.length > 100) {
    return NextResponse.json(
      { error: "Max 100 emails at once" },
      { status: 400 }
    );
  }

  try {
    const result = await trashEmailBatch(
      user.accessToken,
      user.refreshToken,
      ids
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Trash failed";
    console.error("Trash error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
