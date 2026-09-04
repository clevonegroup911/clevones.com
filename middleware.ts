import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  adminRoutes,
  isAdminProtectedPath,
  isAdminPublicPath,
  isProtectedPath,
  safeAdminCallbackUrl,
} from "@/lib/auth";
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
 * Locale negotiation plus admin session gate.
 * Portal protection remains prepared but inactive so public/preparatory
 * routes keep their current behaviour.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(localeHeaderName, getLocaleFromPath(pathname));
  requestHeaders.set("x-pathname", pathname);

  if (isProtectedPath(pathname)) {
    // const session = request.cookies.get("session");
    // if (!session) {
    //   const signInUrl = new URL(authRoutes.signIn, request.url);
    //   signInUrl.searchParams.set("callbackUrl", pathname);
    //   return NextResponse.redirect(signInUrl);
    // }
  }

  const adminSession = await getAdminSessionFromRequest(request);

  if (isAdminProtectedPath(pathname) && !adminSession) {
    const loginUrl = new URL(adminRoutes.login, getTrustedAppOrigin(request));
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPublicPath(pathname) && adminSession) {
    const callbackUrl = safeAdminCallbackUrl(
      request.nextUrl.searchParams.get("callbackUrl"),
    );
    return NextResponse.redirect(
      new URL(callbackUrl, getTrustedAppOrigin(request)),
    );
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

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
  runtime: "nodejs",
};
