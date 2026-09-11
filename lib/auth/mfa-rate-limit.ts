import "server-only";

import { createHmac, hkdfSync, randomUUID } from "node:crypto";

import type { PrismaClient } from "@prisma/client";

import type { MfaDbClient } from "@/lib/auth/mfa-consume";
import {
  MFA_RATE_LIMIT_IP_MAX_ATTEMPTS,
  MFA_RATE_LIMIT_USER_MAX_ATTEMPTS,
  MFA_RATE_LIMIT_WINDOW_MS,
} from "@/lib/auth/mfa-config";

export const MFA_RATE_LIMIT_USER_TYPE = "user";
export const MFA_RATE_LIMIT_IP_TYPE = "ip";

function getRateLimitHmacKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to fingerprint MFA rate-limit subjects.");
  }

  return Buffer.from(
    hkdfSync(
      "sha256",
      secret,
      "clevones-mfa-ratelimit-v1",
      "mfa-rate-limit-hmac",
      32,
    ),
  );
}

export function fingerprintMfaRateLimitSubject(value: string): string {
  return createHmac("sha256", getRateLimitHmacKey()).update(value).digest("base64");
}

export function fingerprintMfaIpAddress(ipAddress: string | null): string {
  return fingerprintMfaRateLimitSubject(ipAddress ?? "unknown");
}

function isMemoryDb(client: MfaDbClient): boolean {
  return (client as { _memory?: boolean })._memory === true;
}

type RawSqlClient = Pick<PrismaClient, "$executeRaw">;

async function readWindow(
  client: MfaDbClient,
  subjectType: string,
  subjectHash: string,
  now: Date,
) {
  const row = await client.mfaRateLimit.findUnique({
    where: {
      subjectType_subjectHash: { subjectType, subjectHash },
    },
  });

  if (!row || row.windowEndsAt.getTime() <= now.getTime()) {
    return null;
  }

  return row;
}

export async function isPersistentMfaRateLimited(
  client: MfaDbClient,
  userId: string,
  ipAddress: string | null,
  now = new Date(),
): Promise<boolean> {
  const userWindow = await readWindow(
    client,
    MFA_RATE_LIMIT_USER_TYPE,
    fingerprintMfaRateLimitSubject(userId),
    now,
  );
  if (userWindow && userWindow.failureCount >= MFA_RATE_LIMIT_USER_MAX_ATTEMPTS) {
    return true;
  }

  const ipWindow = await readWindow(
    client,
    MFA_RATE_LIMIT_IP_TYPE,
    fingerprintMfaIpAddress(ipAddress),
    now,
  );
  return Boolean(
    ipWindow && ipWindow.failureCount >= MFA_RATE_LIMIT_IP_MAX_ATTEMPTS,
  );
}

async function bumpWindowMemory(
  client: MfaDbClient,
  subjectType: string,
  subjectHash: string,
  now: Date,
  windowEndsAt: Date,
) {
  const apply = async (tx: MfaDbClient) => {
    const existing = await tx.mfaRateLimit.findUnique({
      where: {
        subjectType_subjectHash: { subjectType, subjectHash },
      },
    });

    if (!existing) {
      await tx.mfaRateLimit.upsert({
        where: {
          subjectType_subjectHash: { subjectType, subjectHash },
        },
        create: {
          subjectType,
          subjectHash,
          failureCount: 1,
          windowEndsAt,
        },
        update: {
          failureCount: { increment: 1 },
        },
      });
      return;
    }

    if (existing.windowEndsAt.getTime() > now.getTime()) {
      await tx.mfaRateLimit.updateMany({
        where: { subjectType, subjectHash },
        data: { failureCount: { increment: 1 } },
      });
      return;
    }

    await tx.mfaRateLimit.updateMany({
      where: { subjectType, subjectHash },
      data: { failureCount: 1, windowEndsAt },
    });
  };

  if ("$transaction" in client) {
    await client.$transaction((tx) => apply(tx));
    return;
  }

  await apply(client);
}

async function bumpWindowSql(
  client: RawSqlClient,
  subjectType: string,
  subjectHash: string,
  now: Date,
  windowEndsAt: Date,
) {
  const id = randomUUID();
  await client.$executeRaw`
    INSERT INTO "MfaRateLimit" ("id", "subjectType", "subjectHash", "failureCount", "windowEndsAt", "createdAt", "updatedAt")
    VALUES (${id}, ${subjectType}, ${subjectHash}, 1, ${windowEndsAt}, ${now}, ${now})
    ON CONFLICT ("subjectType", "subjectHash") DO UPDATE SET
      "failureCount" = CASE
        WHEN "MfaRateLimit"."windowEndsAt" > ${now} THEN "MfaRateLimit"."failureCount" + 1
        ELSE 1
      END,
      "windowEndsAt" = CASE
        WHEN "MfaRateLimit"."windowEndsAt" > ${now} THEN "MfaRateLimit"."windowEndsAt"
        ELSE ${windowEndsAt}
      END,
      "updatedAt" = ${now}
  `;
}

async function bumpWindow(
  client: MfaDbClient,
  subjectType: string,
  subjectHash: string,
  now: Date,
) {
  const windowEndsAt = new Date(now.getTime() + MFA_RATE_LIMIT_WINDOW_MS);

  if (isMemoryDb(client)) {
    await bumpWindowMemory(client, subjectType, subjectHash, now, windowEndsAt);
    return;
  }

  await bumpWindowSql(client as RawSqlClient, subjectType, subjectHash, now, windowEndsAt);
}

export async function registerPersistentMfaFailure(
  client: MfaDbClient,
  userId: string,
  ipAddress: string | null,
  now = new Date(),
): Promise<void> {
  await bumpWindow(
    client,
    MFA_RATE_LIMIT_USER_TYPE,
    fingerprintMfaRateLimitSubject(userId),
    now,
  );
  await bumpWindow(
    client,
    MFA_RATE_LIMIT_IP_TYPE,
    fingerprintMfaIpAddress(ipAddress),
    now,
  );
}

export async function clearPersistentMfaFailures(
  client: MfaDbClient,
  userId: string,
  ipAddress: string | null,
): Promise<void> {
  await client.mfaRateLimit.deleteMany({
    where: {
      OR: [
        {
          subjectType: MFA_RATE_LIMIT_USER_TYPE,
          subjectHash: fingerprintMfaRateLimitSubject(userId),
        },
        {
          subjectType: MFA_RATE_LIMIT_IP_TYPE,
          subjectHash: fingerprintMfaIpAddress(ipAddress),
        },
      ],
    },
  });
}
