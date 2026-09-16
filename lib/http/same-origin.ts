import { NextResponse } from "next/server";

export type CsrfStatus = "OK" | "ORIGIN_MISMATCH" | "CONFIG_MISSING" | "REFERER_MISMATCH";

export type SameOriginResult =
  | { ok: true; status: "OK"; trustedOrigin: string; requestOrigin: string | null }
  | {
      ok: false;
      status: Exclude<CsrfStatus, "OK">;
      trustedOrigin: string | null;
      requestOrigin: string | null;
      response: NextResponse;
    };

/**
 * Same-origin / CSRF guard for cookie-authenticated admin mutations.
 * APP_ORIGIN is the canonical trusted origin.
 * In development only, X200_LOCAL_ALLOWED_ORIGINS may add explicit
 * localhost / 127.0.0.1 origins (never wildcard, never arbitrary hosts).
 * Production ignores the local allow-list.
 */
export function assertSameOriginMutation(
  request: Request,
  env: NodeJS.ProcessEnv = process.env,
): SameOriginResult {
  const trusted = resolveTrustedOrigin(request, env);
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowed = collectAllowedOrigins(trusted, env);

  if (!trusted && allowed.length === 0) {
    return {
      ok: false,
      status: "CONFIG_MISSING",
      trustedOrigin: null,
      requestOrigin: origin,
      response: NextResponse.json(
        { error: "Origine applicative non configurée.", code: "CSRF_MISSING" },
        { status: 403 },
      ),
    };
  }

  if (origin) {
    if (isOriginAllowed(origin, allowed)) {
      return {
        ok: true,
        status: "OK",
        trustedOrigin: trusted ?? allowed[0]!,
        requestOrigin: origin,
      };
    }
    return {
      ok: false,
      status: "ORIGIN_MISMATCH",
      trustedOrigin: trusted,
      requestOrigin: origin,
      response: NextResponse.json(
        { error: "Origine non autorisée.", code: "CSRF_ORIGIN" },
        { status: 403 },
      ),
    };
  }

  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (isOriginAllowed(refOrigin, allowed)) {
        return {
          ok: true,
          status: "OK",
          trustedOrigin: trusted ?? allowed[0]!,
          requestOrigin: refOrigin,
        };
      }
    } catch {
      // fall through
    }
    return {
      ok: false,
      status: "REFERER_MISMATCH",
      trustedOrigin: trusted,
      requestOrigin: null,
      response: NextResponse.json(
        { error: "Referer non autorisé.", code: "CSRF_REFERER" },
        { status: 403 },
      ),
    };
  }

  return {
    ok: false,
    status: "CONFIG_MISSING",
    trustedOrigin: trusted,
    requestOrigin: null,
    response: NextResponse.json(
      { error: "En-tête Origin/Referer requis.", code: "CSRF_MISSING" },
      { status: 403 },
    ),
  };
}

/** Diagnostic for UI — never includes secrets. */
export function diagnoseCsrfStatus(
  request: Request,
  env: NodeJS.ProcessEnv = process.env,
): {
  status: CsrfStatus;
  appOriginConfigured: boolean;
  localAllowListActive: boolean;
  localAllowListCount: number;
  requestOrigin: string | null;
} {
  const appOriginConfigured = Boolean(env.APP_ORIGIN?.trim());
  const trusted = resolveTrustedOrigin(request, env);
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const requestOrigin =
    origin ??
    (() => {
      if (!referer) return null;
      try {
        return new URL(referer).origin;
      } catch {
        return null;
      }
    })();
  const localList = parseLocalAllowedOrigins(env);
  const localAllowListActive =
    isDevelopment(env) && localList.length > 0;
  const allowed = collectAllowedOrigins(trusted, env);

  if (!trusted && allowed.length === 0) {
    return {
      status: "CONFIG_MISSING",
      appOriginConfigured,
      localAllowListActive,
      localAllowListCount: localList.length,
      requestOrigin,
    };
  }

  if (!requestOrigin) {
    return {
      status: "CONFIG_MISSING",
      appOriginConfigured,
      localAllowListActive,
      localAllowListCount: localList.length,
      requestOrigin: null,
    };
  }

  if (isOriginAllowed(requestOrigin, allowed)) {
    return {
      status: "OK",
      appOriginConfigured,
      localAllowListActive,
      localAllowListCount: localList.length,
      requestOrigin,
    };
  }

  return {
    status: "ORIGIN_MISMATCH",
    appOriginConfigured,
    localAllowListActive,
    localAllowListCount: localList.length,
    requestOrigin,
  };
}

export function parseLocalAllowedOrigins(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  if (!isDevelopment(env)) return [];
  const raw = env.X200_LOCAL_ALLOWED_ORIGINS?.trim();
  if (!raw) return [];

  const out: string[] = [];
  for (const part of raw.split(",")) {
    const candidate = part.trim();
    if (!candidate) continue;
    if (candidate === "*" || candidate.includes("*")) continue;
    try {
      const url = new URL(candidate);
      if (!isLoopbackHost(url.hostname)) continue;
      if (url.protocol !== "http:" && url.protocol !== "https:") continue;
      out.push(url.origin);
    } catch {
      // skip invalid entries
    }
  }
  return Array.from(new Set(out));
}

function isDevelopment(env: NodeJS.ProcessEnv): boolean {
  return env.NODE_ENV !== "production";
}

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
}

function resolveTrustedOrigin(
  request: Request,
  env: NodeJS.ProcessEnv,
): string | null {
  const raw = env.APP_ORIGIN?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      // fall through
    }
  }
  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

function collectAllowedOrigins(
  trusted: string | null,
  env: NodeJS.ProcessEnv,
): string[] {
  const allowed = new Set<string>();
  if (trusted) allowed.add(trusted);
  for (const origin of parseLocalAllowedOrigins(env)) {
    allowed.add(origin);
  }
  return Array.from(allowed);
}

function isOriginAllowed(candidate: string, allowed: string[]): boolean {
  try {
    const origin = new URL(candidate).origin;
    return allowed.some((entry) => {
      try {
        return new URL(entry).origin === origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}
