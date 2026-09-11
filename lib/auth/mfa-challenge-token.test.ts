import assert from "node:assert/strict";
import { test } from "node:test";

import { SignJWT } from "jose";

import {
  MFA_CHALLENGE_AUDIENCE,
  MFA_CHALLENGE_ISSUER,
  MFA_CHALLENGE_PURPOSE,
  createMfaChallengeToken,
  verifyMfaChallengeToken,
} from "@/lib/auth/mfa-challenge-token";
import { MFA_CHALLENGE_TTL_SECONDS } from "@/lib/auth/mfa-config";

const SECRET = "0".repeat(48);

test("MFA challenge JWT verifies HS256, issuer, audience, subject, jti, iat, purpose and 5-minute exp", async () => {
  process.env.AUTH_SECRET = SECRET;

  const token = await createMfaChallengeToken({
    sub: "user_1",
    jti: "challenge_1",
  });
  const claims = await verifyMfaChallengeToken(token);
  assert.ok(claims);
  assert.equal(claims.sub, "user_1");
  assert.equal(claims.jti, "challenge_1");
  assert.equal(typeof claims.iat, "number");
  assert.equal(claims.exp - claims.iat, MFA_CHALLENGE_TTL_SECONDS);
  const payload = JSON.parse(
    Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
  ) as Record<string, unknown>;
  assert.equal("failCount" in payload, false);
  assert.equal(payload.purpose, MFA_CHALLENGE_PURPOSE);
  assert.equal(payload.sub, "user_1");
  assert.equal(payload.jti, "challenge_1");
});

test("MFA challenge JWT rejects the wrong algorithm, issuer, audience or purpose", async () => {
  process.env.AUTH_SECRET = SECRET;
  const secret = new TextEncoder().encode(SECRET);
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + MFA_CHALLENGE_TTL_SECONDS;

  const hs384 = await new SignJWT({ purpose: MFA_CHALLENGE_PURPOSE })
    .setProtectedHeader({ alg: "HS384", typ: "JWT" })
    .setSubject("user_1")
    .setJti("challenge_1")
    .setIssuedAt(iat)
    .setIssuer(MFA_CHALLENGE_ISSUER)
    .setAudience(MFA_CHALLENGE_AUDIENCE)
    .setExpirationTime(exp)
    .sign(secret);
  assert.equal(await verifyMfaChallengeToken(hs384), null);

  const wrongIssuer = await new SignJWT({ purpose: MFA_CHALLENGE_PURPOSE })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject("user_1")
    .setJti("challenge_1")
    .setIssuedAt(iat)
    .setIssuer("other-issuer")
    .setAudience(MFA_CHALLENGE_AUDIENCE)
    .setExpirationTime(exp)
    .sign(secret);
  assert.equal(await verifyMfaChallengeToken(wrongIssuer), null);

  const wrongAudience = await new SignJWT({ purpose: MFA_CHALLENGE_PURPOSE })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject("user_1")
    .setJti("challenge_1")
    .setIssuedAt(iat)
    .setIssuer(MFA_CHALLENGE_ISSUER)
    .setAudience("other-audience")
    .setExpirationTime(exp)
    .sign(secret);
  assert.equal(await verifyMfaChallengeToken(wrongAudience), null);

  const wrongPurpose = await new SignJWT({ purpose: "session" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject("user_1")
    .setJti("challenge_1")
    .setIssuedAt(iat)
    .setIssuer(MFA_CHALLENGE_ISSUER)
    .setAudience(MFA_CHALLENGE_AUDIENCE)
    .setExpirationTime(exp)
    .sign(secret);
  assert.equal(await verifyMfaChallengeToken(wrongPurpose), null);

  const wrongTyp = await new SignJWT({ purpose: MFA_CHALLENGE_PURPOSE })
    .setProtectedHeader({ alg: "HS256", typ: "at+jwt" })
    .setSubject("user_1")
    .setJti("challenge_1")
    .setIssuedAt(iat)
    .setIssuer(MFA_CHALLENGE_ISSUER)
    .setAudience(MFA_CHALLENGE_AUDIENCE)
    .setExpirationTime(exp)
    .sign(secret);
  assert.equal(await verifyMfaChallengeToken(wrongTyp), null);
});

test("MFA challenge JWT rejects a lifetime longer than 5 minutes and expired tokens", async () => {
  process.env.AUTH_SECRET = SECRET;
  const iat = Math.floor(Date.now() / 1000);

  const tooLong = await createMfaChallengeToken({
    sub: "user_1",
    jti: "challenge_long",
    iat,
    exp: iat + MFA_CHALLENGE_TTL_SECONDS + 1,
  });
  assert.equal(await verifyMfaChallengeToken(tooLong), null);

  const expired = await createMfaChallengeToken({
    sub: "user_1",
    jti: "challenge_expired",
    iat: iat - MFA_CHALLENGE_TTL_SECONDS - 30,
    exp: iat - 10,
  });
  assert.equal(await verifyMfaChallengeToken(expired), null);
});
