import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MfaConfigurationError,
  getMfaEncryptionKey,
} from "@/lib/auth/mfa-config";
import { encryptUtf8, decryptUtf8 } from "@/lib/auth/mfa-crypto";

const validKey = Buffer.alloc(32, 7).toString("base64");

function withEncryptionKey(value: string | undefined, fn: () => void) {
  const previous = process.env.MFA_ENCRYPTION_KEY;
  try {
    if (value === undefined) {
      delete process.env.MFA_ENCRYPTION_KEY;
    } else {
      process.env.MFA_ENCRYPTION_KEY = value;
    }
    fn();
  } finally {
    if (previous === undefined) {
      delete process.env.MFA_ENCRYPTION_KEY;
    } else {
      process.env.MFA_ENCRYPTION_KEY = previous;
    }
  }
}

test("rejects missing or invalid MFA_ENCRYPTION_KEY", () => {
  withEncryptionKey(undefined, () => {
    assert.throws(() => getMfaEncryptionKey(), MfaConfigurationError);
  });

  withEncryptionKey(Buffer.alloc(16, 1).toString("base64"), () => {
    assert.throws(() => getMfaEncryptionKey(), MfaConfigurationError);
  });
});

test("rejects non-canonical Base64 MFA_ENCRYPTION_KEY values", () => {
  withEncryptionKey("not-base64!!not-base64!!not-base64!!not-b64=", () => {
    assert.throws(() => getMfaEncryptionKey(), MfaConfigurationError);
  });

  withEncryptionKey(` ${validKey}`, () => {
    assert.throws(() => getMfaEncryptionKey(), MfaConfigurationError);
  });

  withEncryptionKey(`${validKey} `, () => {
    assert.throws(() => getMfaEncryptionKey(), MfaConfigurationError);
  });

  withEncryptionKey(`${validKey}x`, () => {
    assert.throws(() => getMfaEncryptionKey(), MfaConfigurationError);
  });

  const plusSlashKey = Buffer.alloc(32, 0xfb).toString("base64");
  withEncryptionKey(plusSlashKey.replaceAll("+", "-").replaceAll("/", "_"), () => {
    assert.throws(() => getMfaEncryptionKey(), MfaConfigurationError);
  });

  withEncryptionKey(Buffer.alloc(32, 7).toString("base64url"), () => {
    assert.throws(() => getMfaEncryptionKey(), MfaConfigurationError);
  });

  withEncryptionKey(Buffer.alloc(31, 7).toString("base64"), () => {
    assert.throws(() => getMfaEncryptionKey(), MfaConfigurationError);
  });

  withEncryptionKey(Buffer.alloc(33, 7).toString("base64"), () => {
    assert.throws(() => getMfaEncryptionKey(), MfaConfigurationError);
  });
});

test("accepts only a canonical 32-byte standard Base64 key", () => {
  assert.equal(validKey.length, 44);
  assert.equal(validKey.endsWith("="), true);
  withEncryptionKey(validKey, () => {
    const key = getMfaEncryptionKey();
    assert.equal(key.length, 32);
    assert.equal(key.toString("base64"), validKey);
  });
});

test("encrypts and decrypts a TOTP secret with AES-256-GCM bound to the user", () => {
  withEncryptionKey(validKey, () => {
    const plaintext = "JBSWY3DPEHPK3PXP";
    const encrypted = encryptUtf8(plaintext, "user_a");

    assert.equal(encrypted.iv.byteLength, 12);
    assert.equal(encrypted.authTag.byteLength, 16);
    assert.notEqual(Buffer.from(encrypted.ciphertext).toString("utf8"), plaintext);
    assert.equal(decryptUtf8(encrypted, "user_a"), plaintext);
  });
});

test("refuses tampered ciphertext", () => {
  withEncryptionKey(validKey, () => {
    const encrypted = encryptUtf8("JBSWY3DPEHPK3PXP", "user_a");
    encrypted.ciphertext[0] ^= 0xff;
    assert.throws(() => decryptUtf8(encrypted, "user_a"));
  });
});

test("refuses ciphertext encrypted for another user", () => {
  withEncryptionKey(validKey, () => {
    const encrypted = encryptUtf8("JBSWY3DPEHPK3PXP", "user_a");
    assert.throws(() => decryptUtf8(encrypted, "user_b"));
  });
});

test("refuses decrypt payloads with invalid IV, auth tag, or empty ciphertext", () => {
  withEncryptionKey(validKey, () => {
    const encrypted = encryptUtf8("JBSWY3DPEHPK3PXP", "user_a");
    assert.throws(() =>
      decryptUtf8({ ...encrypted, iv: encrypted.iv.slice(0, 11) }, "user_a"),
    );
    assert.throws(() =>
      decryptUtf8({ ...encrypted, authTag: encrypted.authTag.slice(0, 15) }, "user_a"),
    );
    assert.throws(() =>
      decryptUtf8({ ...encrypted, ciphertext: new Uint8Array() }, "user_a"),
    );
  });
});

test("refuses an unsupported MFA secret keyVersion", () => {
  withEncryptionKey(validKey, () => {
    assert.throws(() => encryptUtf8("JBSWY3DPEHPK3PXP", "user_a", 2));
    const encrypted = encryptUtf8("JBSWY3DPEHPK3PXP", "user_a");
    assert.throws(() => decryptUtf8(encrypted, "user_a", 2));
  });
});
