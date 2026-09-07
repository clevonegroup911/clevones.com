import "server-only";

import { cookies } from "next/headers";

import { canAccessAdminConsole, isAdminRole } from "@/lib/auth/admin-access";
import {
  ADMIN_MFA_CHALLENGE_COOKIE,
  getMfaChallengeCookieOptions,
} from "@/lib/auth/mfa-challenge-cookie";
import { createMfaChallengeRecord } from "@/lib/auth/mfa-challenge-store";
import {
  createMfaChallengeToken,
  verifyMfaChallengeToken,
} from "@/lib/auth/mfa-challenge-token";
import { findUsableMfaChallenge } from "@/lib/auth/mfa-consume";
import { safeAdminCallbackUrl } from "@/lib/auth/routes";
import { prisma } from "@/lib/db/prisma";

export type MfaChallengeClaims = {
  sub: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN";
  callbackUrl: string;
  jti: string;
  failureCount: number;
  exp: number;
};

export async function readMfaChallengeClaims(): Promise<MfaChallengeClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_MFA_CHALLENGE_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const jwtClaims = await verifyMfaChallengeToken(token);
  if (!jwtClaims) {
    return null;
  }

  const challenge = await findUsableMfaChallenge(prisma, {
    id: jwtClaims.jti,
    userId: jwtClaims.sub,
  });
  if (!challenge || challenge.userId !== jwtClaims.sub) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: jwtClaims.sub },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      mfaEnabled: true,
    },
  });

  if (
    !user ||
    !isAdminRole(user.role) ||
    !canAccessAdminConsole(user) ||
    !user.mfaEnabled
  ) {
    return null;
  }

  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    callbackUrl: safeAdminCallbackUrl(challenge.callbackUrl),
    jti: challenge.id,
    failureCount: challenge.failureCount,
    exp: Math.floor(challenge.expiresAt.getTime() / 1000),
  };
}

export async function issueMfaChallenge(input: {
  userId: string;
  callbackUrl: string;
}): Promise<void> {
  const record = await createMfaChallengeRecord(prisma, {
    userId: input.userId,
    callbackUrl: input.callbackUrl,
  });
  const exp = Math.floor(record.expiresAt.getTime() / 1000);
  const token = await createMfaChallengeToken({
    sub: input.userId,
    jti: record.id,
    exp,
  });
  const remainingSeconds = Math.max(1, exp - Math.floor(Date.now() / 1000));
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_MFA_CHALLENGE_COOKIE, token, {
    ...getMfaChallengeCookieOptions(),
    maxAge: remainingSeconds,
  });
}

export async function clearMfaChallengeCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_MFA_CHALLENGE_COOKIE, "", {
    ...getMfaChallengeCookieOptions(),
    maxAge: 0,
  });
}
