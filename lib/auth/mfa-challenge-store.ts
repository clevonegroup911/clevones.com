import "server-only";

import type { MfaDbClient } from "@/lib/auth/mfa-consume";
import { MFA_CHALLENGE_TTL_SECONDS } from "@/lib/auth/mfa-config";
import { safeAdminCallbackUrl } from "@/lib/auth/routes";

export async function createMfaChallengeRecord(
  client: MfaDbClient,
  params: {
    userId: string;
    callbackUrl: string;
  },
  now = new Date(),
) {
  const expiresAt = new Date(now.getTime() + MFA_CHALLENGE_TTL_SECONDS * 1000);
  const callbackUrl = safeAdminCallbackUrl(params.callbackUrl);

  const create = async (tx: MfaDbClient) => {
    await tx.mfaChallenge.updateMany({
      where: {
        userId: params.userId,
        consumedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: now },
    });

    return tx.mfaChallenge.create({
      data: {
        userId: params.userId,
        callbackUrl,
        failureCount: 0,
        expiresAt,
      },
    });
  };

  if ("$transaction" in client) {
    return client.$transaction((tx) => create(tx));
  }

  return create(client);
}
