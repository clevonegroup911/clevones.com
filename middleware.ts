import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isProtectedPath } from "@/lib/auth";
import { getLocaleFromPath } from "@/lib/i18n/routes";
import { localeHeaderName } from "@/lib/i18n/request";

/**
 * Entry point for session checks and route protection.
 * Uncomment the redirect block when auth (JWT, cookies, or provider) is wired.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(localeHeaderName, getLocaleFromPath(pathname));

  if (isProtectedPath(pathname)) {
    // const session = request.cookies.get("session");
    // if (!session) {
    //   const signInUrl = new URL(authRoutes.signIn, request.url);
    //   signInUrl.searchParams.set("callbackUrl", pathname);
    //   return NextResponse.redirect(signInUrl);
    // }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
