const TEST_LIKE_DATABASE_NAME = /(?:test|tmp|mfa|t00\d)/i;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

export class DisallowedMfaTestDatabaseUrlError extends Error {
  constructor() {
    super(
      "MFA PostgreSQL tests refuse non-local or non-temporary database URLs.",
    );
    this.name = "DisallowedMfaTestDatabaseUrlError";
  }
}

export function readMfaTestDatabaseUrl(
  env: NodeJS.Dict<string | undefined> = process.env,
): string | null {
  const dedicated = env.TEST_DATABASE_URL?.trim() || env.MFA_TEST_DATABASE_URL?.trim();
  return dedicated && dedicated.length > 0 ? dedicated : null;
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

export function assertAllowedMfaTestDatabaseUrl(raw: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new DisallowedMfaTestDatabaseUrlError();
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new DisallowedMfaTestDatabaseUrlError();
  }

  const databaseName = databaseNameFromUrl(parsed);
  if (!databaseName || !TEST_LIKE_DATABASE_NAME.test(databaseName)) {
    throw new DisallowedMfaTestDatabaseUrlError();
  }

  const hostname = parsed.hostname;
  if (isLoopbackHost(hostname) || isEphemeralDockerHost(hostname)) {
    return raw;
  }

  throw new DisallowedMfaTestDatabaseUrlError();
}

export function resolveMfaTestDatabaseUrl(
  env: NodeJS.Dict<string | undefined> = process.env,
): string | null {
  const dedicated = readMfaTestDatabaseUrl(env);
  if (!dedicated) {
    return null;
  }

  return assertAllowedMfaTestDatabaseUrl(dedicated);
}
