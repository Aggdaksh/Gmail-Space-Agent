import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/middleware";
import { getStorageStats } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const stats = await getStorageStats(
      user.accessToken,
      user.refreshToken,
      user.email,
      user.name,
      user.picture
    );

    return NextResponse.json(stats);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Stats fetch failed";
    console.error("Stats error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
