import assert from "node:assert/strict";
import { test } from "node:test";

import {
  findMatchingRecoveryCode,
  generateRecoveryCodes,
  hashRecoveryCode,
  isWellFormedRecoveryCode,
  normalizeRecoveryCode,
} from "@/lib/auth/mfa-recovery";

const validKey = Buffer.alloc(32, 7).toString("base64");

test("recovery codes are hashed and matched without storing plaintext", () => {
  process.env.MFA_ENCRYPTION_KEY = validKey;
  const codes = generateRecoveryCodes(10);
  assert.equal(codes.length, 10);
  assert.equal(isWellFormedRecoveryCode(codes[0]), true);

  const stored = codes.map((code, index) => ({
    id: `id-${index}`,
    codeHash: hashRecoveryCode(code),
  }));

  assert.notEqual(stored[0].codeHash, codes[0]);
  const spaced = codes[3].toUpperCase().replaceAll("-", " ");
  const matched = findMatchingRecoveryCode(stored, spaced);
  assert.equal(matched?.id, "id-3");
  assert.equal(findMatchingRecoveryCode(stored, "ffff-ffff-ffff-ffff")?.id, undefined);
  assert.equal(normalizeRecoveryCode(codes[0]).length, 16);
});
