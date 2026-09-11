import "server-only";

import type { EncryptedPayload } from "@/lib/auth/mfa-crypto";
import {
  MFA_ENROLLMENT_TTL_SECONDS,
  MFA_SECRET_KEY_VERSION,
} from "@/lib/auth/mfa-config";
import type { MfaDbClient } from "@/lib/auth/mfa-consume";

export class MfaEnrollmentConflictError extends Error {
  constructor(message = "mfa_already_enabled") {
    super(message);
    this.name = "MfaEnrollmentConflictError";
  }
}

export function pendingEnrollmentExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + MFA_ENROLLMENT_TTL_SECONDS * 1000);
}

export function isPendingEnrollmentExpired(
  secret: {
    pending: boolean;
    pendingExpiresAt: Date | null;
  },
  now = new Date(),
): boolean {
  if (!secret.pending) {
    return false;
  }

  if (!secret.pendingExpiresAt) {
    return true;
  }

  return secret.pendingExpiresAt.getTime() <= now.getTime();
}

function encryptedBytes(payload: EncryptedPayload) {
  return {
    ciphertext: Buffer.from(payload.ciphertext),
    iv: Buffer.from(payload.iv),
    authTag: Buffer.from(payload.authTag),
  };
}

export async function replacePendingEnrollment(
  client: MfaDbClient,
  params: {
    userId: string;
    encrypted: EncryptedPayload;
    keyVersion?: number;
  },
  now = new Date(),
) {
  const encrypted = encryptedBytes(params.encrypted);
  const pendingExpiresAt = pendingEnrollmentExpiresAt(now);
  const keyVersion = params.keyVersion ?? MFA_SECRET_KEY_VERSION;

  const user = await client.user.findUnique({
    where: { id: params.userId },
    select: { mfaEnabled: true },
  });
  if (!user || user.mfaEnabled) {
    throw new MfaEnrollmentConflictError();
  }

  await client.mfaRecoveryCode.deleteMany({
    where: { secret: { userId: params.userId } },
  });

  return client.userMfaSecret.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId,
      ...encrypted,
      keyVersion,
      pending: true,
      pendingExpiresAt,
      lastUsedStep: null,
    },
    update: {
      ...encrypted,
      keyVersion,
      pending: true,
      pendingExpiresAt,
      lastUsedStep: null,
    },
  });
}

export async function confirmPendingEnrollment(
  client: MfaDbClient,
  params: {
    userId: string;
    secretId: string;
    verifiedStep: number;
    recoveryHashes: string[];
  },
  now = new Date(),
): Promise<boolean> {
  const confirmed = await client.userMfaSecret.updateMany({
    where: {
      id: params.secretId,
      userId: params.userId,
      pending: true,
      pendingExpiresAt: { gt: now },
    },
    data: {
      pending: false,
      pendingExpiresAt: null,
      lastUsedStep: params.verifiedStep,
    },
  });

  if (confirmed.count !== 1) {
    return false;
  }

  await client.mfaRecoveryCode.deleteMany({
    where: { secretId: params.secretId },
  });
  await client.mfaRecoveryCode.createMany({
    data: params.recoveryHashes.map((codeHash) => ({
      secretId: params.secretId,
      codeHash,
    })),
  });

  await client.user.update({
    where: { id: params.userId },
    data: { mfaEnabled: true },
  });

  return true;
}

export async function disableMfaEnrollment(
  client: MfaDbClient,
  params: { userId: string; secretId: string },
): Promise<void> {
  const owned = await client.userMfaSecret.findFirst({
    where: { id: params.secretId, userId: params.userId },
    select: { id: true },
  });
  if (!owned) {
    throw new Error("mfa_disable_mismatch");
  }

  await client.mfaRecoveryCode.deleteMany({
    where: { secretId: params.secretId },
  });
  const deleted = await client.userMfaSecret.deleteMany({
    where: { id: params.secretId, userId: params.userId },
  });
  if (deleted.count !== 1) {
    throw new Error("mfa_disable_mismatch");
  }
  await client.user.update({
    where: { id: params.userId },
    data: { mfaEnabled: false },
  });
}
