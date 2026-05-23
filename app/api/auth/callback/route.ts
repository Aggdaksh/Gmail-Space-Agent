// app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { signJWT } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/?error=auth_denied", request.url));
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );

    // Token exchange
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // User info
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    const payload = {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      email: userInfo.email!,
      name: userInfo.name!,
      picture: userInfo.picture!,
    };

    const jwt = await signJWT(payload);

    // Set httpOnly cookie
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.set("token", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
  }
}