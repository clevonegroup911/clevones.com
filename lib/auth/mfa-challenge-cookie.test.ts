import assert from "node:assert/strict";
import { test } from "node:test";

import { getMfaChallengeCookieOptions } from "@/lib/auth/mfa-challenge-cookie";

test("MFA challenge cookie is HttpOnly, Secure in production, SameSite=Strict, and path /admin", () => {
  const productionOptions = getMfaChallengeCookieOptions("production");
  assert.equal(productionOptions.httpOnly, true);
  assert.equal(productionOptions.secure, true);
  assert.equal(productionOptions.sameSite, "strict");
  assert.equal(productionOptions.path, "/admin");

  const developmentOptions = getMfaChallengeCookieOptions("development");
  assert.equal(developmentOptions.httpOnly, true);
  assert.equal(developmentOptions.secure, false);
  assert.equal(developmentOptions.sameSite, "strict");
  assert.equal(developmentOptions.path, "/admin");
});
