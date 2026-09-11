const TEST_LIKE_DATABASE_NAME = /(?:test|tmp|mfa|e2e|ci_x100|x100)/i;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

export class DisallowedE2eDatabaseUrlError extends Error {
  constructor() {
    super("Playwright e2e tests refuse non-local or non-temporary database URLs.");
    this.name = "DisallowedE2eDatabaseUrlError";
  }
}

function databaseNameFromUrl(url: URL): string {
  const pathname = decodeURIComponent(url.pathname || "").replace(/^\//, "");
  const [database] = pathname.split("/");
  return database ?? "";
}

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (LOOPBACK_HOSTS.has(host)) {
    return true;
  }
  return host.startsWith("127.");
}

function isEphemeralDockerHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "");
  return host.length > 0 && !host.includes(".");
}

function isPrivateIpv4(hostname: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (!match) {
    return false;
  }
  const a = Number(match[1]);
  const b = Number(match[2]);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export function assertAllowedE2eDatabaseUrl(raw: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new DisallowedE2eDatabaseUrlError();
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new DisallowedE2eDatabaseUrlError();
  }

  const databaseName = databaseNameFromUrl(parsed);
  if (!databaseName || !TEST_LIKE_DATABASE_NAME.test(databaseName)) {
    throw new DisallowedE2eDatabaseUrlError();
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (
    isLoopbackHost(hostname) ||
    isEphemeralDockerHost(hostname) ||
    isPrivateIpv4(hostname)
  ) {
    return raw;
  }

  throw new DisallowedE2eDatabaseUrlError();
}

export const E2E_PORT = 3100;
export const E2E_ORIGIN = `http://127.0.0.1:${E2E_PORT}`;

/** Dummy CI/e2e secrets — never production values. Length >= 32. */
export const E2E_AUTH_SECRET = "ci-only-auth-secret-not-for-production-use";
export const E2E_MFA_ENCRYPTION_KEY =
  "eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHg=";

export function e2eAppEnv(databaseUrl: string): NodeJS.ProcessEnv {
  const env: Record<string, string> = {
    NODE_ENV: "development",
  };
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      env[key] = value;
    }
  }
  env.DATABASE_URL = databaseUrl;
  env.AUTH_SECRET = E2E_AUTH_SECRET;
  env.MFA_ENCRYPTION_KEY = E2E_MFA_ENCRYPTION_KEY;
  env.MFA_ISSUER = "CLEVONES-E2E";
  env.APP_ORIGIN = E2E_ORIGIN;
  if (process.env.CI) {
    env.CI = process.env.CI;
  }
  return {
    ...env,
    NODE_ENV: "development",
  };
}

export function resolveProvidedE2eDatabaseUrl(
  env: NodeJS.Dict<string | undefined> = process.env,
): string | null {
  const candidates = [
    env.PLAYWRIGHT_DATABASE_URL,
    env.TEST_DATABASE_URL,
    env.CI === "true" ? env.DATABASE_URL : undefined,
  ];

  for (const candidate of candidates) {
    const raw = candidate?.trim();
    if (!raw) {
      continue;
    }
    return assertAllowedE2eDatabaseUrl(raw);
  }

  return null;
}
