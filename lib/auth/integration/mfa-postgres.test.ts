import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

import { PrismaClient } from "@prisma/client";

import { createMfaChallengeRecord } from "@/lib/auth/mfa-challenge-store";
import {
  consumeMfaChallenge,
  consumeRecoveryCode,
  consumeTotpStep,
  findUsableMfaChallenge,
  registerMfaChallengeFailure,
} from "@/lib/auth/mfa-consume";
import { MFA_CHALLENGE_MAX_FAILURES } from "@/lib/auth/mfa-config";
import {
  confirmPendingEnrollment,
  replacePendingEnrollment,
} from "@/lib/auth/mfa-enrollment";
import {
  MFA_RATE_LIMIT_IP_TYPE,
  MFA_RATE_LIMIT_USER_TYPE,
  fingerprintMfaIpAddress,
  fingerprintMfaRateLimitSubject,
  registerPersistentMfaFailure,
} from "@/lib/auth/mfa-rate-limit";
import { resolveMfaTestDatabaseUrl } from "@/lib/auth/integration/mfa-test-database-url";

const testDatabaseUrl = resolveMfaTestDatabaseUrl();
const enabled = Boolean(testDatabaseUrl);

function requirePrisma() {
  if (!testDatabaseUrl) {
    throw new Error("TEST_DATABASE_URL is required for PostgreSQL MFA tests.");
  }
  return new PrismaClient({
    datasources: {
      db: { url: testDatabaseUrl },
    },
  });
}

async function seedUser(prisma: PrismaClient, suffix: string) {
  return prisma.user.create({
    data: {
      email: `t002-${suffix}-${randomUUID()}@example.test`,
      passwordHash: "not-a-real-hash",
      firstName: "Test",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      mfaEnabled: true,
    },
  });
}

async function seedSecret(
  prisma: PrismaClient,
  userId: string,
  extra?: { pending?: boolean; pendingExpiresAt?: Date | null; lastUsedStep?: number | null },
) {
  return prisma.userMfaSecret.create({
    data: {
      userId,
      ciphertext: Buffer.from("cipher"),
      iv: Buffer.from("iv-12-bytes!"),
      authTag: Buffer.from("auth-tag-16bytex"),
      keyVersion: 1,
      pending: extra?.pending ?? false,
      pendingExpiresAt: extra?.pendingExpiresAt ?? null,
      lastUsedStep: extra?.lastUsedStep ?? null,
    },
  });
}

test("PostgreSQL MFA schema has challenge, rate-limit and recovery constraints", async (t) => {
  if (!enabled) {
    t.skip("PostgreSQL integration not enabled (set TEST_DATABASE_URL)");
    return;
  }

  const prisma = requirePrisma();
  try {
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('UserMfaSecret', 'MfaChallenge', 'MfaRateLimit', 'MfaRecoveryCode')
      ORDER BY tablename
    `;
    assert.deepEqual(
      tables.map((row) => row.tablename),
      ["MfaChallenge", "MfaRateLimit", "MfaRecoveryCode", "UserMfaSecret"],
    );

    const uniques = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN (
          'UserMfaSecret_userId_key',
          'MfaRateLimit_subjectType_subjectHash_key'
        )
      ORDER BY indexname
    `;
    assert.equal(uniques.length, 2);

    const fkeys = await prisma.$queryRaw<Array<{ conname: string }>>`
      SELECT conname
      FROM pg_constraint
      WHERE conname IN (
        'UserMfaSecret_userId_fkey',
        'MfaChallenge_userId_fkey',
        'MfaRecoveryCode_secretId_fkey'
      )
      ORDER BY conname
    `;
    assert.equal(fkeys.length, 3);
  } finally {
    await prisma.$disconnect();
  }
});

test("six concurrent challenge failures leave the challenge unusable with failureCount=5", async (t) => {
  if (!enabled) {
    t.skip("PostgreSQL integration not enabled (set TEST_DATABASE_URL)");
    return;
  }

  process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "0".repeat(48);
  const prisma = requirePrisma();
  try {
    const user = await seedUser(prisma, "fail");
    const challenge = await createMfaChallengeRecord(prisma, {
      userId: user.id,
      callbackUrl: "/admin/dashboard",
    });

    const outcomes = await Promise.all(
      Array.from({ length: 6 }, () =>
        registerMfaChallengeFailure(prisma, { id: challenge.id, userId: user.id }),
      ),
    );

    const counted = outcomes.filter((outcome) => outcome === "counted").length;
    const exhausted = outcomes.filter((outcome) => outcome === "exhausted").length;
    const unusable = outcomes.filter((outcome) => outcome === "unusable").length;

    assert.equal(counted + exhausted, MFA_CHALLENGE_MAX_FAILURES);
    assert.equal(unusable, 1);
    assert.ok(exhausted >= 1);

    const stored = await prisma.mfaChallenge.findUniqueOrThrow({
      where: { id: challenge.id },
    });
    assert.equal(stored.failureCount, MFA_CHALLENGE_MAX_FAILURES);
    assert.equal(await findUsableMfaChallenge(prisma, { id: challenge.id, userId: user.id }), null);
    assert.equal(await consumeMfaChallenge(prisma, { id: challenge.id, userId: user.id }), false);
  } finally {
    await prisma.$disconnect();
  }
});

test("two concurrent challenge consumptions produce exactly one success", async (t) => {
  if (!enabled) {
    t.skip("PostgreSQL integration not enabled (set TEST_DATABASE_URL)");
    return;
  }

  const prisma = requirePrisma();
  try {
    const user = await seedUser(prisma, "consume");
    const challenge = await createMfaChallengeRecord(prisma, {
      userId: user.id,
      callbackUrl: "/admin/dashboard",
    });

    const [first, second] = await Promise.all([
      consumeMfaChallenge(prisma, { id: challenge.id, userId: user.id }),
      consumeMfaChallenge(prisma, { id: challenge.id, userId: user.id }),
    ]);

    assert.equal([first, second].filter(Boolean).length, 1);
    const stored = await prisma.mfaChallenge.findUniqueOrThrow({
      where: { id: challenge.id },
    });
    assert.ok(stored.consumedAt);
    assert.equal(await consumeMfaChallenge(prisma, { id: challenge.id, userId: user.id }), false);
  } finally {
    await prisma.$disconnect();
  }
});

test("two concurrent TOTP steps produce exactly one success and reject equal or prior steps", async (t) => {
  if (!enabled) {
    t.skip("PostgreSQL integration not enabled (set TEST_DATABASE_URL)");
    return;
  }

  const prisma = requirePrisma();
  try {
    const user = await seedUser(prisma, "totp");
    const secret = await seedSecret(prisma, user.id, { lastUsedStep: null });

    const [first, second] = await Promise.all([
      consumeTotpStep(prisma, { userId: user.id, secretId: secret.id, verifiedStep: 42 }),
      consumeTotpStep(prisma, { userId: user.id, secretId: secret.id, verifiedStep: 42 }),
    ]);
    assert.equal([first, second].filter(Boolean).length, 1);

    assert.equal(
      await consumeTotpStep(prisma, { userId: user.id, secretId: secret.id, verifiedStep: 42 }),
      false,
    );
    assert.equal(
      await consumeTotpStep(prisma, { userId: user.id, secretId: secret.id, verifiedStep: 41 }),
      false,
    );
    assert.equal(
      await consumeTotpStep(prisma, { userId: user.id, secretId: secret.id, verifiedStep: 43 }),
      true,
    );
  } finally {
    await prisma.$disconnect();
  }
});

test("two concurrent recovery-code uses produce exactly one success", async (t) => {
  if (!enabled) {
    t.skip("PostgreSQL integration not enabled (set TEST_DATABASE_URL)");
    return;
  }

  const prisma = requirePrisma();
  try {
    const user = await seedUser(prisma, "recovery");
    const secret = await seedSecret(prisma, user.id);
    const code = await prisma.mfaRecoveryCode.create({
      data: {
        secretId: secret.id,
        codeHash: "hash-recovery",
      },
    });

    const [first, second] = await Promise.all([
      consumeRecoveryCode(prisma, { codeId: code.id, secretId: secret.id }),
      consumeRecoveryCode(prisma, { codeId: code.id, secretId: secret.id }),
    ]);
    assert.equal([first, second].filter(Boolean).length, 1);
    const stored = await prisma.mfaRecoveryCode.findUniqueOrThrow({ where: { id: code.id } });
    assert.ok(stored.usedAt);
  } finally {
    await prisma.$disconnect();
  }
});

test("concurrent first persistent rate-limit inserts increment atomically without storing raw IPs", async (t) => {
  if (!enabled) {
    t.skip("PostgreSQL integration not enabled (set TEST_DATABASE_URL)");
    return;
  }

  process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "0".repeat(48);
  const prisma = requirePrisma();
  const ipAddress = "203.0.113.77";
  const userId = `user-rate-${randomUUID()}`;
  const attempts = 8;
  try {
    await Promise.all(
      Array.from({ length: attempts }, () =>
        registerPersistentMfaFailure(prisma, userId, ipAddress),
      ),
    );

    const userRow = await prisma.mfaRateLimit.findUniqueOrThrow({
      where: {
        subjectType_subjectHash: {
          subjectType: MFA_RATE_LIMIT_USER_TYPE,
          subjectHash: fingerprintMfaRateLimitSubject(userId),
        },
      },
    });
    const ipRow = await prisma.mfaRateLimit.findUniqueOrThrow({
      where: {
        subjectType_subjectHash: {
          subjectType: MFA_RATE_LIMIT_IP_TYPE,
          subjectHash: fingerprintMfaIpAddress(ipAddress),
        },
      },
    });

    assert.equal(userRow.failureCount, attempts);
    assert.equal(ipRow.failureCount, attempts);
    assert.notEqual(ipRow.subjectHash, ipAddress);
    assert.equal(ipRow.subjectHash.includes(ipAddress), false);
  } finally {
    await prisma.$disconnect();
  }
});

test("expired and already consumed challenges are rejected", async (t) => {
  if (!enabled) {
    t.skip("PostgreSQL integration not enabled (set TEST_DATABASE_URL)");
    return;
  }

  const prisma = requirePrisma();
  try {
    const user = await seedUser(prisma, "state");
    const now = new Date();
    const expired = await prisma.mfaChallenge.create({
      data: {
        userId: user.id,
        callbackUrl: "/admin/dashboard",
        failureCount: 0,
        expiresAt: new Date(now.getTime() - 1000),
      },
    });
    assert.equal(
      await consumeMfaChallenge(prisma, { id: expired.id, userId: user.id }, now),
      false,
    );

    const live = await createMfaChallengeRecord(prisma, {
      userId: user.id,
      callbackUrl: "/admin/dashboard",
    });
    assert.equal(await consumeMfaChallenge(prisma, { id: live.id, userId: user.id }), true);
    assert.equal(await consumeMfaChallenge(prisma, { id: live.id, userId: user.id }), false);
  } finally {
    await prisma.$disconnect();
  }
});

test("an expired pending enrollment cannot be confirmed and is replaced transactionally", async (t) => {
  if (!enabled) {
    t.skip("PostgreSQL integration not enabled (set TEST_DATABASE_URL)");
    return;
  }

  const prisma = requirePrisma();
  try {
    const user = await seedUser(prisma, "enroll");
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaEnabled: false },
    });
    const now = new Date("2026-09-07T00:00:00.000Z");
    const first = await replacePendingEnrollment(
      prisma,
      {
        userId: user.id,
        encrypted: {
          ciphertext: new Uint8Array([1, 2, 3]),
          iv: new Uint8Array(12),
          authTag: new Uint8Array(16),
        },
      },
      now,
    );

    const expiredAt = new Date(now.getTime() + 10 * 60 * 1000 + 1);
    assert.equal(
      await confirmPendingEnrollment(
        prisma,
        {
          userId: user.id,
          secretId: first.id,
          verifiedStep: 9,
          recoveryHashes: ["old-hash"],
        },
        expiredAt,
      ),
      false,
    );

    const replaced = await prisma.$transaction((tx) =>
      replacePendingEnrollment(
        tx,
        {
          userId: user.id,
          encrypted: {
            ciphertext: new Uint8Array([9, 8, 7]),
            iv: new Uint8Array(12).fill(2),
            authTag: new Uint8Array(16).fill(3),
          },
        },
        expiredAt,
      ),
    );
    assert.equal(replaced.id, first.id);
    assert.equal(replaced.pending, true);
    assert.deepEqual(Buffer.from(replaced.ciphertext), Buffer.from([9, 8, 7]));
  } finally {
    await prisma.$disconnect();
  }
});
