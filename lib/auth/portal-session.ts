import "server-only";

import { cookies } from "next/headers";

import {
  PORTAL_SESSION_COOKIE,
  getPortalSessionCookieOptions,
} from "@/lib/auth/portal-session-cookie";
import {
  createPortalSessionToken,
  verifyPortalSessionToken,
  type PortalSessionClaims,
} from "@/lib/auth/portal-session-token";

export async function readPortalSessionClaims(): Promise<PortalSessionClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  return verifyPortalSessionToken(token);
}

export async function setPortalSessionCookie(
  claims: PortalSessionClaims,
): Promise<void> {
  const token = await createPortalSessionToken(claims);
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_SESSION_COOKIE, token, getPortalSessionCookieOptions());
}

export async function clearPortalSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_SESSION_COOKIE, "", {
    ...getPortalSessionCookieOptions(),
    maxAge: 0,
  });
}
