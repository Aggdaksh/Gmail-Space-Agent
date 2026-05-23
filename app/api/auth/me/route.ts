// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/middleware";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({
    email: user.email,
    name: user.name,
    picture: user.picture,
  });
}