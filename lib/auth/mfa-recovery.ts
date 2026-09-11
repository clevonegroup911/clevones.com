import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { MFA_RECOVERY_CODE_COUNT } from "@/lib/auth/mfa-config";
import { deriveRecoveryHmacKey } from "@/lib/auth/mfa-crypto";

const HEX_GROUP_SIZE = 4;
const HEX_LENGTH = 16;

export function normalizeRecoveryCode(code: string): string {
  return code.trim().toLowerCase().replace(/[^a-f0-9]/g, "");
}

export function formatRecoveryCode(normalizedHex: string): string {
  const groups: string[] = [];
  for (let index = 0; index < normalizedHex.length; index += HEX_GROUP_SIZE) {
    groups.push(normalizedHex.slice(index, index + HEX_GROUP_SIZE));
  }
  return groups.join("-");
}

export function generateRecoveryCodes(
  count = MFA_RECOVERY_CODE_COUNT,
): string[] {
  const codes: string[] = [];
  for (let index = 0; index < count; index += 1) {
    codes.push(formatRecoveryCode(randomBytes(8).toString("hex")));
  }
  return codes;
}

export function hashRecoveryCode(code: string): string {
  const normalized = normalizeRecoveryCode(code);
  const hmac = createHmac("sha256", deriveRecoveryHmacKey());
  hmac.update(normalized);
  return hmac.digest("base64");
}

export function hashRecoveryCodes(codes: string[]): string[] {
  return codes.map((code) => hashRecoveryCode(code));
}

function hashesEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "base64");
  const rightBuffer = Buffer.from(right, "base64");
  if (leftBuffer.length !== rightBuffer.length) {
    const dummy = Buffer.alloc(32);
    timingSafeEqual(dummy, dummy);
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function findMatchingRecoveryCode<T extends { id: string; codeHash: string }>(
  codes: T[],
  submitted: string,
): T | null {
  const submittedHash = hashRecoveryCode(submitted);
  let matched: T | null = null;

  for (const code of codes) {
    if (hashesEqual(code.codeHash, submittedHash)) {
      matched = code;
    }
  }

  return matched;
}

export function isWellFormedRecoveryCode(code: string): boolean {
  return normalizeRecoveryCode(code).length === HEX_LENGTH;
}
