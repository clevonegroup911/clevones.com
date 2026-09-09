import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  adminRoutes,
  isAdminProtectedPath,
  isAdminPublicPath,
  isProtectedPath,
  safeAdminCallbackUrl,
} from "@/lib/auth";
import { ADMIN_MFA_CHALLENGE_COOKIE } from "@/lib/auth/mfa-challenge-cookie";
import { verifyMfaChallengeToken } from "@/lib/auth/mfa-challenge-token";
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
 * Locale negotiation, admin session gate, and authenticated portal gate.
 * Portal uses the admin session cookie in this phase (T020); T021 refines
 * USER document permissions.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(localeHeaderName, getLocaleFromPath(pathname));
  requestHeaders.set("x-pathname", pathname);

  const adminSession = await getAdminSessionFromRequest(request);
  const mfaChallenge = await getMfaChallengeFromRequest(request);
  const origin = getTrustedAppOrigin(request);

  if (isProtectedPath(pathname) && !adminSession) {
    if (mfaChallenge) {
      return NextResponse.redirect(new URL(adminRoutes.mfaVerify, origin));
    }
    const loginUrl = new URL(adminRoutes.login, origin);
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
