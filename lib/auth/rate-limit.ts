type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MFA_WINDOW_MS = 15 * 60 * 1000;
const MFA_MAX_ATTEMPTS = 5;
const MFA_IP_MAX_ATTEMPTS = 15;

const attempts = new Map<string, RateLimitEntry>();

function pruneExpired(now: number) {
  for (const [key, entry] of attempts) {
    if (entry.resetAt <= now) {
      attempts.delete(key);
    }
  }
}

function isLimited(key: string, maxAttempts: number): boolean {
  const now = Date.now();
  pruneExpired(now);
  const entry = attempts.get(key);
  if (!entry) {
    return false;
  }

  return entry.count >= maxAttempts && entry.resetAt > now;
}

function registerFailure(key: string, windowMs: number): void {
  const now = Date.now();
  const existing = attempts.get(key);

  if (!existing || existing.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  existing.count += 1;
}

export function getLoginRateLimitKey(email: string, ipAddress: string | null) {
  return `login:${ipAddress ?? "unknown"}:${email}`;
}

export function isLoginRateLimited(key: string): boolean {
  return isLimited(key, MAX_ATTEMPTS);
}

export function registerFailedLogin(key: string): void {
  registerFailure(key, WINDOW_MS);
}

export function clearFailedLogins(key: string): void {
  attempts.delete(key);
}

export function getMfaUserRateLimitKey(userId: string) {
  return `mfa:user:${userId}`;
}

export function getMfaIpRateLimitKey(ipAddress: string | null) {
  return `mfa:ip:${ipAddress ?? "unknown"}`;
}

export function getMfaSetupRateLimitKey(userId: string, ipAddress: string | null) {
  return `mfa-setup:${ipAddress ?? "unknown"}:${userId}`;
}

export function isMfaRateLimited(userId: string, ipAddress: string | null): boolean {
  return (
    isLimited(getMfaUserRateLimitKey(userId), MFA_MAX_ATTEMPTS) ||
    isLimited(getMfaIpRateLimitKey(ipAddress), MFA_IP_MAX_ATTEMPTS)
  );
}

export function registerFailedMfaAttempt(userId: string, ipAddress: string | null): void {
  registerFailure(getMfaUserRateLimitKey(userId), MFA_WINDOW_MS);
  registerFailure(getMfaIpRateLimitKey(ipAddress), MFA_WINDOW_MS);
}

export function clearFailedMfaAttempts(userId: string, ipAddress: string | null): void {
  attempts.delete(getMfaUserRateLimitKey(userId));
  attempts.delete(getMfaIpRateLimitKey(ipAddress));
}

export function isMfaSetupRateLimited(userId: string, ipAddress: string | null): boolean {
  return isLimited(getMfaSetupRateLimitKey(userId, ipAddress), MAX_ATTEMPTS);
}

export function registerFailedMfaSetup(userId: string, ipAddress: string | null): void {
  registerFailure(getMfaSetupRateLimitKey(userId, ipAddress), WINDOW_MS);
}

export function clearFailedMfaSetup(userId: string, ipAddress: string | null): void {
  attempts.delete(getMfaSetupRateLimitKey(userId, ipAddress));
}
