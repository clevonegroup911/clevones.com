import "server-only";

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

import {
  MFA_SECRET_KEY_VERSION,
  buildMfaSecretAad,
  getMfaEncryptionKey,
} from "@/lib/auth/mfa-config";

const AES_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const HKDF_SALT = Buffer.from("clevones-mfa-v1");

export type EncryptedPayload = {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  authTag: Uint8Array;
};

function deriveAesKey(master: Buffer): Buffer {
  return Buffer.from(
    hkdfSync("sha256", master, HKDF_SALT, "mfa-aes-256-gcm", 32),
  );
}

export function deriveRecoveryHmacKey(master: Buffer = getMfaEncryptionKey()): Buffer {
  return Buffer.from(
    hkdfSync("sha256", master, HKDF_SALT, "mfa-recovery-hmac", 32),
  );
}

function assertSupportedKeyVersion(keyVersion: number): void {
  if (keyVersion !== MFA_SECRET_KEY_VERSION) {
    throw new Error("Unsupported MFA secret key version.");
  }
}

function assertDecryptPayload(payload: EncryptedPayload): {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
} {
  const iv = Buffer.from(payload.iv);
  const authTag = Buffer.from(payload.authTag);
  const ciphertext = Buffer.from(payload.ciphertext);

  if (iv.byteLength !== IV_LENGTH) {
    throw new Error("MFA secret IV must be exactly 12 bytes.");
  }
  if (authTag.byteLength !== AUTH_TAG_LENGTH) {
    throw new Error("MFA secret auth tag must be exactly 16 bytes.");
  }
  if (ciphertext.byteLength === 0) {
    throw new Error("MFA secret ciphertext must not be empty.");
  }

  return { ciphertext, iv, authTag };
}

export function encryptUtf8(
  plaintext: string,
  userId: string,
  keyVersion = MFA_SECRET_KEY_VERSION,
): EncryptedPayload {
  assertSupportedKeyVersion(keyVersion);
  const aesKey = deriveAesKey(getMfaEncryptionKey());
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(AES_ALGORITHM, aesKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  cipher.setAAD(Buffer.from(buildMfaSecretAad(userId, keyVersion), "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: new Uint8Array(ciphertext),
    iv: new Uint8Array(iv),
    authTag: new Uint8Array(authTag),
  };
}

export function decryptUtf8(
  payload: EncryptedPayload,
  userId: string,
  keyVersion = MFA_SECRET_KEY_VERSION,
): string {
  assertSupportedKeyVersion(keyVersion);
  const { ciphertext, iv, authTag } = assertDecryptPayload(payload);
  const aesKey = deriveAesKey(getMfaEncryptionKey());
  const decipher = createDecipheriv(AES_ALGORITHM, aesKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAAD(Buffer.from(buildMfaSecretAad(userId, keyVersion), "utf8"));
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
