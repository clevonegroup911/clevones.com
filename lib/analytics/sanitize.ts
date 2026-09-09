import {
  ANALYTICS_ACTOR_KINDS,
  ANALYTICS_CATEGORIES,
  ANALYTICS_EVENT_NAMES,
  type AnalyticsActorKind,
  type AnalyticsCategory,
  type AnalyticsEventName,
} from "./types";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const UUID_RE =
  /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi;
const CUID_RE = /\/[a-z][a-z0-9]{20,}(?=\/|$)/g;
const MAX_PATH = 180;

export function utcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function sanitizePath(raw: string | null | undefined): string {
  let path = String(raw ?? "").trim();
  if (!path) {
    return "/";
  }

  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      return "/";
    }
  }

  path = path.split("?")[0]?.split("#")[0] ?? "/";
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  path = path.replace(/\/{2,}/g, "/");
  path = path.replace(EMAIL_RE, ":redacted");
  path = path.replace(UUID_RE, "/:id");
  path = path.replace(CUID_RE, "/:id");
  if (path.length > 1) {
    path = path.replace(/\/+$/, "");
  }
  if (path.length > MAX_PATH) {
    path = path.slice(0, MAX_PATH);
  }
  return path || "/";
}

export function sanitizeLocale(raw: string | null | undefined): string | null {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "fr" || value === "en") {
    return value;
  }
  return null;
}

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return (ANALYTICS_EVENT_NAMES as readonly string[]).includes(value);
}

export function isAnalyticsCategory(value: string): value is AnalyticsCategory {
  return (ANALYTICS_CATEGORIES as readonly string[]).includes(value);
}

export function isAnalyticsActorKind(value: string): value is AnalyticsActorKind {
  return (ANALYTICS_ACTOR_KINDS as readonly string[]).includes(value);
}

export function actorKindFromRole(
  role: string | null | undefined,
): AnalyticsActorKind {
  if (role === "SUPER_ADMIN") {
    return "SUPER_ADMIN";
  }
  if (role === "ADMIN") {
    return "ADMIN";
  }
  if (role === "USER") {
    return "USER";
  }
  return "ANONYMOUS";
}

const FORBIDDEN_KEYS = [
  "email",
  "ip",
  "ipAddress",
  "userAgent",
  "userId",
  "actorId",
  "password",
  "token",
  "cookie",
];

export function assertPrivacySafePayload(payload: Record<string, unknown>): void {
  for (const key of Object.keys(payload)) {
    if (FORBIDDEN_KEYS.some((forbidden) => key.toLowerCase() === forbidden.toLowerCase())) {
      throw new Error(`analytics payload forbids ${key}`);
    }
  }
}
