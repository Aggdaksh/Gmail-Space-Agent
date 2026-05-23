// lib/middleware.ts
import { cookies } from "next/headers";
import { verifyJWT } from "./auth";

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const payload = await verifyJWT(token);
    return payload; // contains accessToken, refreshToken, email, name, picture
  } catch {
    return null;
  }
}