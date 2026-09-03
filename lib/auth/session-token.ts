import { SignJWT, jwtVerify, type JWTPayload } from "jose";

import { getAdminSessionTtlSeconds } from "@/lib/auth/session-cookie";

export type AdminSessionClaims = {
  sub: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN";
};

const SESSION_AUDIENCE = "clevones-admin";
const SESSION_ISSUER = "clevones-admin";

function getAuthSecretNullable(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    return null;
  }

  return new TextEncoder().encode(secret);
}

function isAdminRole(role: unknown): role is AdminSessionClaims["role"] {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

function toSessionClaims(payload: JWTPayload): AdminSessionClaims | null {
  if (
    typeof payload.sub !== "string" ||
    payload.sub.length === 0 ||
    typeof payload.email !== "string" ||
    !isAdminRole(payload.role)
  ) {
    return null;
  }

  return {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  };
}

export async function createAdminSessionToken(
  claims: AdminSessionClaims,
): Promise<string> {
  const secret = getAuthSecretNullable();
  if (!secret) {
    throw new Error(
      "AUTH_SECRET must be set to create an admin session token.",
    );
  }
  const ttl = getAdminSessionTtlSeconds();

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

export async function verifyAdminSessionToken(
  token: string,
): Promise<AdminSessionClaims | null> {
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
