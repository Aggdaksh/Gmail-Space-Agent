import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/middleware";
import { archiveEmail } from "@/lib/gmail";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body as { id: string };

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    await archiveEmail(user.accessToken, user.refreshToken, id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Archive failed";
    console.error("Archive error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
