import assert from "node:assert/strict";
import { test } from "node:test";

import { MFA_TOTP_PERIOD_SECONDS } from "@/lib/auth/mfa-config";
import {
  createTotpEnrollment,
  generateTotpCodeForTests,
  isWellFormedTotpCode,
  verifyTotpCode,
} from "@/lib/auth/mfa-totp";

const validKey = Buffer.alloc(32, 7).toString("base64");

test("TOTP codes are 6 digits and accept a ±1 period window", async () => {
  process.env.MFA_ENCRYPTION_KEY = validKey;
  process.env.MFA_ISSUER = "CLEVONES";

  const enrollment = await createTotpEnrollment("admin@example.com", "user_1");
  const now = Date.now();
  const current = generateTotpCodeForTests(enrollment.secretBase32, now);
  const previous = generateTotpCodeForTests(
    enrollment.secretBase32,
    now - MFA_TOTP_PERIOD_SECONDS * 1000,
  );
  const next = generateTotpCodeForTests(
    enrollment.secretBase32,
    now + MFA_TOTP_PERIOD_SECONDS * 1000,
  );
  const tooOld = generateTotpCodeForTests(
    enrollment.secretBase32,
    now - MFA_TOTP_PERIOD_SECONDS * 2 * 1000,
  );

  assert.equal(isWellFormedTotpCode(current), true);
  assert.equal(current.length, 6);
  assert.equal(verifyTotpCode(enrollment.secretBase32, current, now).ok, true);
  assert.equal(verifyTotpCode(enrollment.secretBase32, previous, now).ok, true);
  assert.equal(verifyTotpCode(enrollment.secretBase32, next, now).ok, true);
  assert.equal(verifyTotpCode(enrollment.secretBase32, tooOld, now).ok, false);
  assert.equal(verifyTotpCode(enrollment.secretBase32, "000000", now).ok, false);
});
