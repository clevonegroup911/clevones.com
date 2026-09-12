import { SignJWT, jwtVerify, type JWTPayload } from "jose";

import { getPortalSessionTtlSeconds } from "@/lib/auth/portal-session-cookie";

export type PortalSessionClaims = {
  sub: string;
  email: string;
  role: "USER";
};

const SESSION_AUDIENCE = "clevones-portal";
const SESSION_ISSUER = "clevones-portal";

function getAuthSecretNullable(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    return null;
  }

  return new TextEncoder().encode(secret);
}

function toSessionClaims(payload: JWTPayload): PortalSessionClaims | null {
  if (
    typeof payload.sub !== "string" ||
    payload.sub.length === 0 ||
    typeof payload.email !== "string" ||
    payload.role !== "USER"
  ) {
    return null;
  }

  return {
    sub: payload.sub,
    email: payload.email,
    role: "USER",
  };
}

export async function createPortalSessionToken(
  claims: PortalSessionClaims,
): Promise<string> {
  const secret = getAuthSecretNullable();
  if (!secret) {
    throw new Error(
      "AUTH_SECRET must be set to create a portal session token.",
    );
  }
  const ttl = getPortalSessionTtlSeconds();

  return new SignJWT({
    email: claims.email,
    role: claims.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .sign(secret);
}

export async function verifyPortalSessionToken(
  token: string,
): Promise<PortalSessionClaims | null> {
  try {
    const secret = getAuthSecretNullable();
    if (!secret) {
      return null;
    }

    const { payload } = await jwtVerify(token, secret, {
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
      algorithms: ["HS256"],
    });

    return toSessionClaims(payload);
  } catch {
    return null;
  }
}
