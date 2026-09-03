import "server-only";

import { cookies } from "next/headers";

import {
  ADMIN_SESSION_COOKIE,
  getAdminSessionCookieOptions,
} from "@/lib/auth/session-cookie";
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
  type AdminSessionClaims,
} from "@/lib/auth/session-token";

export async function readAdminSessionClaims(): Promise<AdminSessionClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  return verifyAdminSessionToken(token);
}

export async function setAdminSessionCookie(
  claims: AdminSessionClaims,
): Promise<void> {
  const token = await createAdminSessionToken(claims);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, getAdminSessionCookieOptions());
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    ...getAdminSessionCookieOptions(),
    maxAge: 0,
  });
}
