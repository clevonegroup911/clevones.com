export const PORTAL_SESSION_COOKIE = "portal_session";

const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 8;

export function getPortalSessionTtlSeconds(): number {
  const raw = process.env.AUTH_SESSION_TTL_SECONDS;
  if (!raw) {
    return DEFAULT_SESSION_TTL_SECONDS;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 60 || parsed > 60 * 60 * 24) {
    return DEFAULT_SESSION_TTL_SECONDS;
  }

  return parsed;
}

export function getPortalSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: getPortalSessionTtlSeconds(),
  };
}
