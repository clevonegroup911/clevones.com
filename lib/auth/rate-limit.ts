type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, RateLimitEntry>();

function pruneExpired(now: number) {
  for (const [key, entry] of attempts) {
    if (entry.resetAt <= now) {
      attempts.delete(key);
    }
  }
}

export function getLoginRateLimitKey(email: string, ipAddress: string | null) {
  return `${ipAddress ?? "unknown"}:${email}`;
}

export function isLoginRateLimited(key: string): boolean {
  const now = Date.now();
  pruneExpired(now);
  const entry = attempts.get(key);
  if (!entry) {
    return false;
  }

  return entry.count >= MAX_ATTEMPTS && entry.resetAt > now;
}

export function registerFailedLogin(key: string): void {
  const now = Date.now();
  const existing = attempts.get(key);

  if (!existing || existing.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  existing.count += 1;
}

export function clearFailedLogins(key: string): void {
  attempts.delete(key);
}
