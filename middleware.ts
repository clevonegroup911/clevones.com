import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  adminRoutes,
  authRoutes,
  isAdminProtectedPath,
  isAdminPublicPath,
  isProtectedPath,
  safeAdminCallbackUrl,
} from "@/lib/auth";
import { ADMIN_MFA_CHALLENGE_COOKIE } from "@/lib/auth/mfa-challenge-cookie";
import { verifyMfaChallengeToken } from "@/lib/auth/mfa-challenge-token";
import { PORTAL_SESSION_COOKIE } from "@/lib/auth/portal-session-cookie";
import { verifyPortalSessionToken } from "@/lib/auth/portal-session-token";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth/session-cookie";
import { verifyAdminSessionToken } from "@/lib/auth/session-token";
import { getLocaleFromPath } from "@/lib/i18n/routes";
import { localeHeaderName } from "@/lib/i18n/request";

/**
 * Trusted absolute origin for middleware redirects.
 * Never derived from Host or X-Forwarded-* — those remain client-controlled
 * even when Nginx forwards them.
 */
function getTrustedAppOrigin(request: NextRequest): string {
  const raw = process.env.APP_ORIGIN?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (raw) {
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      throw new Error("APP_ORIGIN must be a valid absolute URL.");
    }

    if (isProduction && parsed.protocol !== "https:") {
      throw new Error("APP_ORIGIN must use https: in production.");
    }

    return parsed.origin;
  }

  if (isProduction) {
    throw new Error("APP_ORIGIN must be set in production.");
  }

  return request.nextUrl.origin;
}

/**
 * Locale negotiation, admin session gate, and portal session gate.
 * Portal accepts portal_session (USER) or admin_session (ADMIN/SUPER_ADMIN).
 * Admin console accepts only admin_session (MFA path unchanged).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(localeHeaderName, getLocaleFromPath(pathname));
  requestHeaders.set("x-pathname", pathname);

  const adminSession = await getAdminSessionFromRequest(request);
  const portalSession = await getPortalSessionFromRequest(request);
  const mfaChallenge = await getMfaChallengeFromRequest(request);
  const origin = getTrustedAppOrigin(request);
  const hasPortalAccess = Boolean(adminSession || portalSession);

  if (isProtectedPath(pathname) && !hasPortalAccess) {
    const loginUrl = new URL(authRoutes.signIn, origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminProtectedPath(pathname) && !adminSession) {
    if (mfaChallenge) {
      return NextResponse.redirect(new URL(adminRoutes.mfaVerify, origin));
    }

    const loginUrl = new URL(adminRoutes.login, origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPublicPath(pathname) && adminSession) {
    const callbackUrl = safeAdminCallbackUrl(
      request.nextUrl.searchParams.get("callbackUrl"),
    );
    return NextResponse.redirect(new URL(callbackUrl, origin));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

async function getAdminSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  return verifyAdminSessionToken(token);
}

async function getPortalSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(PORTAL_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  return verifyPortalSessionToken(token);
}

async function getMfaChallengeFromRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_MFA_CHALLENGE_COOKIE)?.value;
  if (!token) {
    return null;
  }

  return verifyMfaChallengeToken(token);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
  runtime: "nodejs",
};
