import { NextResponse } from "next/server";

/**
 * Same-origin / CSRF guard for cookie-authenticated admin mutations.
 * Accepts Origin or Referer matching the trusted app origin.
 */
export function assertSameOriginMutation(
  request: Request,
): { ok: true } | { ok: false; response: NextResponse } {
  const trusted = resolveTrustedOrigin(request);
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin) {
    if (originsMatch(origin, trusted)) {
      return { ok: true };
    }
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Origine non autorisée.", code: "CSRF_ORIGIN" },
        { status: 403 },
      ),
    };
  }

  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (originsMatch(refOrigin, trusted)) {
        return { ok: true };
      }
    } catch {
      // fall through
    }
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Referer non autorisé.", code: "CSRF_REFERER" },
        { status: 403 },
      ),
    };
  }

  // Browsers send Origin on cross-site POSTs; same-site may omit both in some
  // clients. Require at least one signal for mutations.
  return {
    ok: false,
    response: NextResponse.json(
      { error: "En-tête Origin/Referer requis.", code: "CSRF_MISSING" },
      { status: 403 },
    ),
  };
}

function resolveTrustedOrigin(request: Request): string {
  const raw = process.env.APP_ORIGIN?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      // fall through to request URL
    }
  }
  try {
    return new URL(request.url).origin;
  } catch {
    return "http://localhost";
  }
}

function originsMatch(candidate: string, trusted: string): boolean {
  try {
    return new URL(candidate).origin === new URL(trusted).origin;
  } catch {
    return false;
  }
}
