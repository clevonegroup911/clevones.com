import "server-only";

import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

import {
  getMfaIssuer,
  MFA_TOTP_DIGITS,
  MFA_TOTP_PERIOD_SECONDS,
  MFA_TOTP_WINDOW,
} from "@/lib/auth/mfa-config";
import { encryptUtf8, type EncryptedPayload } from "@/lib/auth/mfa-crypto";

function createTotp(secretBase32: string, label: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: getMfaIssuer(),
    label,
    algorithm: "SHA1",
    digits: MFA_TOTP_DIGITS,
    period: MFA_TOTP_PERIOD_SECONDS,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

export function isWellFormedTotpCode(code: string): boolean {
  return new RegExp(`^\\d{${MFA_TOTP_DIGITS}}$`).test(code.trim());
}

export async function createTotpQrDataUrl(
  secretBase32: string,
  label: string,
): Promise<string | null> {
  try {
    return await QRCode.toDataURL(createTotp(secretBase32, label).toString(), {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 220,
      color: { dark: "#111827", light: "#ffffff" },
    });
  } catch {
    return null;
  }
}

export async function createTotpEnrollment(
  label: string,
  userId: string,
): Promise<{
  secretBase32: string;
  encrypted: EncryptedPayload;
  qrDataUrl: string | null;
}> {
  const secret = new OTPAuth.Secret({ size: 20 });
  const secretBase32 = secret.base32;
  const encrypted = encryptUtf8(secretBase32, userId);
  const qrDataUrl = await createTotpQrDataUrl(secretBase32, label);
  return { secretBase32, encrypted, qrDataUrl };
}

export function verifyTotpCode(
  secretBase32: string,
  code: string,
  at = Date.now(),
): { ok: true; step: number } | { ok: false } {
  if (!isWellFormedTotpCode(code)) {
    return { ok: false };
  }

  const totp = createTotp(secretBase32, "verify");
  const delta = totp.validate({
    token: code.trim(),
    window: MFA_TOTP_WINDOW,
    timestamp: at,
  });

  if (delta === null) {
    return { ok: false };
  }

  const currentStep = Math.floor(at / 1000 / MFA_TOTP_PERIOD_SECONDS);
  return { ok: true, step: currentStep + delta };
}

export function generateTotpCodeForTests(
  secretBase32: string,
  at = Date.now(),
): string {
  return createTotp(secretBase32, "test").generate({ timestamp: at });
}
