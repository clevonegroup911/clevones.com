import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";

import { MFA_CHALLENGE_MAX_FAILURES } from "@/lib/auth/mfa-config";

export type MfaDbClient = PrismaClient | Prisma.TransactionClient;

export async function consumeTotpStep(
  client: MfaDbClient,
  params: {
    userId: string;
    secretId: string;
    verifiedStep: number;
  },
): Promise<boolean> {
  const result = await client.userMfaSecret.updateMany({
    where: {
      id: params.secretId,
      userId: params.userId,
      pending: false,
      OR: [{ lastUsedStep: null }, { lastUsedStep: { lt: params.verifiedStep } }],
    },
    data: { lastUsedStep: params.verifiedStep },
  });

  return result.count === 1;
}

export async function consumeRecoveryCode(
  client: MfaDbClient,
  params: {
    codeId: string;
    secretId: string;
  },
): Promise<boolean> {
  const result = await client.mfaRecoveryCode.updateMany({
    where: {
      id: params.codeId,
      secretId: params.secretId,
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  return result.count === 1;
}

export function usableMfaChallengeWhere(
  params: { id: string; userId: string },
  now = new Date(),
) {
  return {
    id: params.id,
    userId: params.userId,
    consumedAt: null,
    revokedAt: null,
    expiresAt: { gt: now },
    failureCount: { lt: MFA_CHALLENGE_MAX_FAILURES },
  };
}

export async function consumeMfaChallenge(
  client: MfaDbClient,
  params: { id: string; userId: string },
  now = new Date(),
): Promise<boolean> {
  const result = await client.mfaChallenge.updateMany({
    where: usableMfaChallengeWhere(params, now),
    data: { consumedAt: now },
  });

  return result.count === 1;
}

export async function registerMfaChallengeFailure(
  client: MfaDbClient,
  params: { id: string; userId: string },
  now = new Date(),
): Promise<"counted" | "exhausted" | "unusable"> {
  const result = await client.mfaChallenge.updateMany({
    where: usableMfaChallengeWhere(params, now),
    data: { failureCount: { increment: 1 } },
  });

  if (result.count !== 1) {
    return "unusable";
  }

  const updated = await client.mfaChallenge.findUnique({
    where: { id: params.id },
    select: { failureCount: true },
  });

  if (!updated || updated.failureCount >= MFA_CHALLENGE_MAX_FAILURES) {
    return "exhausted";
  }

  return "counted";
}

export async function findUsableMfaChallenge(
  client: MfaDbClient,
  params: { id: string; userId: string },
  now = new Date(),
) {
  return client.mfaChallenge.findFirst({
    where: usableMfaChallengeWhere(params, now),
  });
}
