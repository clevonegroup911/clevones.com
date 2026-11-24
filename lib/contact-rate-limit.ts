/**
 * Per-IP rate limit for the public contact endpoint
 * (`/api/initiative-submission`). Same in-memory fixed-window model as
 * `lib/auth/rate-limit.ts`: per process, reset on restart — enough to curb
 * form spam on the single production instance, not a distributed quota.
 */

export const CONTACT_RATE_LIMIT_MAX = 5;
export const CONTACT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const submissions = new Map<string, RateLimitEntry>();

function pruneExpired(now: number) {
  for (const [key, entry] of submissions) {
    if (entry.resetAt <= now) {
      submissions.delete(key);
    }
  }
}

/** First `x-forwarded-for` hop (set by the reverse proxy), then `x-real-ip`. */
export function getContactClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return (forwarded || realIp || "unknown").slice(0, 64);
}

export type ContactRateLimitResult =
  | { limited: false; remaining: number }
  | { limited: true; retryAfterSeconds: number };

/**
 * Counts one submission attempt for `ip` and reports whether it exceeds the
 * quota. A refused attempt is not counted, so the window is not extended.
 */
export function consumeContactSubmission(
  ip: string,
  now: number = Date.now(),
): ContactRateLimitResult {
  pruneExpired(now);
  const key = `contact:${ip}`;
  const entry = submissions.get(key);

  if (!entry || entry.resetAt <= now) {
    submissions.set(key, { count: 1, resetAt: now + CONTACT_RATE_LIMIT_WINDOW_MS });
    return { limited: false, remaining: CONTACT_RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= CONTACT_RATE_LIMIT_MAX) {
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { limited: false, remaining: CONTACT_RATE_LIMIT_MAX - entry.count };
}

/** Test helper — clears every counter. */
export function resetContactRateLimit(): void {
  submissions.clear();
}
