import "server-only";

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

import { MFA_CHALLENGE_TTL_SECONDS } from "@/lib/auth/mfa-config";

export const MFA_CHALLENGE_AUDIENCE = "clevones-admin-mfa";
export const MFA_CHALLENGE_ISSUER = "clevones-admin-mfa";
export const MFA_CHALLENGE_PURPOSE = "admin_mfa_challenge";

export type MfaChallengeTokenClaims = {
  sub: string;
  jti: string;
  iat: number;
  exp: number;
};

function getAuthSecretNullable(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    return null;
  }

  return new TextEncoder().encode(secret);
}

function toChallengeTokenClaims(payload: JWTPayload): MfaChallengeTokenClaims | null {
  if (
    payload.purpose !== MFA_CHALLENGE_PURPOSE ||
    typeof payload.sub !== "string" ||
    payload.sub.length === 0 ||
    typeof payload.jti !== "string" ||
    payload.jti.length === 0 ||
    typeof payload.iat !== "number" ||
    typeof payload.exp !== "number" ||
    !Number.isFinite(payload.iat) ||
    !Number.isFinite(payload.exp)
  ) {
    return null;
  }

  if (payload.exp - payload.iat > MFA_CHALLENGE_TTL_SECONDS || payload.exp <= payload.iat) {
    return null;
  }

  return {
    sub: payload.sub,
    jti: payload.jti,
    iat: payload.iat,
    exp: payload.exp,
  };
}

export async function createMfaChallengeToken(claims: {
  sub: string;
  jti: string;
  iat?: number;
  exp?: number;
}): Promise<string> {
  const secret = getAuthSecretNullable();
  if (!secret) {
    throw new Error("AUTH_SECRET must be set to create an MFA challenge token.");
  }

  const iat = claims.iat ?? Math.floor(Date.now() / 1000);
  const exp = claims.exp ?? iat + MFA_CHALLENGE_TTL_SECONDS;

  return new SignJWT({
    purpose: MFA_CHALLENGE_PURPOSE,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setJti(claims.jti)
    .setIssuedAt(iat)
    .setIssuer(MFA_CHALLENGE_ISSUER)
    .setAudience(MFA_CHALLENGE_AUDIENCE)
    .setExpirationTime(exp)
    .sign(secret);
}

export async function verifyMfaChallengeToken(
  token: string,
): Promise<MfaChallengeTokenClaims | null> {
  try {
    const secret = getAuthSecretNullable();
    if (!secret) {
      return null;
    }

    const { payload, protectedHeader } = await jwtVerify(token, secret, {
      issuer: MFA_CHALLENGE_ISSUER,
      audience: MFA_CHALLENGE_AUDIENCE,
      algorithms: ["HS256"],
      maxTokenAge: `${MFA_CHALLENGE_TTL_SECONDS}s`,
      clockTolerance: 5,
      requiredClaims: ["sub", "jti", "iat", "exp", "iss", "aud"],
    });

    if (protectedHeader.alg !== "HS256" || protectedHeader.typ !== "JWT") {
      return null;
    }

    return toChallengeTokenClaims(payload);
  } catch {
    return null;
  }
}
