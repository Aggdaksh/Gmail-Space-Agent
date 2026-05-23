import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/middleware";
import { searchEmails } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const max   = parseInt(searchParams.get("max") || "20", 10);

  if (!query) {
    return NextResponse.json({ error: "q param required" }, { status: 400 });
  }

  try {
    const result = await searchEmails(
      user.accessToken,
      user.refreshToken,
      query,
      Math.min(max, 50) // max 50 cap
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Search failed";
    console.error("Search error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
