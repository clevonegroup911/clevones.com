import "server-only";

export const MFA_TOTP_DIGITS = 6;
export const MFA_TOTP_PERIOD_SECONDS = 30;
export const MFA_TOTP_WINDOW = 1;
export const MFA_RECOVERY_CODE_COUNT = 10;
export const MFA_CHALLENGE_TTL_SECONDS = 5 * 60;
export const MFA_CHALLENGE_MAX_FAILURES = 5;
export const MFA_ENROLLMENT_TTL_SECONDS = 10 * 60;
export const MFA_SECRET_KEY_VERSION = 1;
export const MFA_DEFAULT_ISSUER = "CLEVONES";
export const MFA_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const MFA_RATE_LIMIT_USER_MAX_ATTEMPTS = 5;
export const MFA_RATE_LIMIT_IP_MAX_ATTEMPTS = 15;

const CANONICAL_32_BYTE_BASE64 = /^[A-Za-z0-9+/]{43}=$/;

export class MfaConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MfaConfigurationError";
  }
}

export function getMfaIssuer(): string {
  const issuer = process.env.MFA_ISSUER?.trim();
  return issuer && issuer.length > 0 ? issuer : MFA_DEFAULT_ISSUER;
}

export function buildMfaSecretAad(
  userId: string,
  keyVersion = MFA_SECRET_KEY_VERSION,
): string {
  if (!userId || userId.trim().length === 0) {
    throw new MfaConfigurationError(
      "A user id is required to bind an MFA secret.",
    );
  }

  return `clevones:mfa-secret:v${keyVersion}:user:${userId}`;
}

function parseMfaEncryptionKey(): Buffer {
  const raw = process.env.MFA_ENCRYPTION_KEY;
  if (typeof raw !== "string" || !CANONICAL_32_BYTE_BASE64.test(raw)) {
    throw new MfaConfigurationError(
      "MFA_ENCRYPTION_KEY must be a base64-encoded 32-byte key.",
    );
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32 || key.toString("base64") !== raw) {
    throw new MfaConfigurationError(
      "MFA_ENCRYPTION_KEY must be a base64-encoded 32-byte key.",
    );
  }

  return key;
}

export function getMfaEncryptionKey(): Buffer {
  return parseMfaEncryptionKey();
}

export function assertMfaEncryptionKeyForProduction(): void {
  if (process.env.NODE_ENV === "production") {
    parseMfaEncryptionKey();
  }
}
