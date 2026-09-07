import assert from "node:assert/strict";
import { test } from "node:test";

import type { MfaDbClient } from "@/lib/auth/mfa-consume";
import {
  consumeMfaChallenge,
  consumeRecoveryCode,
  consumeTotpStep,
  findUsableMfaChallenge,
  registerMfaChallengeFailure,
} from "@/lib/auth/mfa-consume";
import { createMfaChallengeRecord } from "@/lib/auth/mfa-challenge-store";
import {
  createMfaChallengeToken,
  verifyMfaChallengeToken,
} from "@/lib/auth/mfa-challenge-token";
import { MFA_CHALLENGE_MAX_FAILURES } from "@/lib/auth/mfa-config";
import { registerPersistentMfaFailure } from "@/lib/auth/mfa-rate-limit";
import { confirmPendingEnrollment } from "@/lib/auth/mfa-enrollment";
import { createMfaMemoryDb } from "@/lib/auth/mfa-memory-db";

function asClient(db: ReturnType<typeof createMfaMemoryDb>): MfaDbClient {
  return db as unknown as MfaDbClient;
}

async function seedUser(db: ReturnType<typeof createMfaMemoryDb>, userId = "user_1") {
  await db.user.create({
    data: {
      id: userId,
      email: "admin@example.com",
      passwordHash: "hash",
      firstName: "Ada",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      mfaEnabled: true,
    },
  });
}

async function seedSecret(
  db: ReturnType<typeof createMfaMemoryDb>,
  params: {
    userId?: string;
    pending?: boolean;
    lastUsedStep?: number | null;
    pendingExpiresAt?: Date | null;
  } = {},
) {
  const userId = params.userId ?? "user_1";
  return db.userMfaSecret.create({
    data: {
      userId,
      ciphertext: Buffer.from("cipher"),
      iv: Buffer.from("iv-12-bytes!"),
      authTag: Buffer.from("auth-tag-16byte"),
      keyVersion: 1,
      pending: params.pending ?? false,
      pendingExpiresAt: params.pendingExpiresAt ?? null,
      lastUsedStep: params.lastUsedStep ?? null,
    },
  });
}

test("an old MFA challenge JWT is rejected after 5 server-side failures", async () => {
  process.env.AUTH_SECRET = "0".repeat(48);
  const db = createMfaMemoryDb();
  const client = asClient(db);
  await seedUser(db);
  const challenge = await createMfaChallengeRecord(client, {
    userId: "user_1",
    callbackUrl: "/admin/dashboard",
  });
  const token = await createMfaChallengeToken({
    sub: "user_1",
    jti: challenge.id,
    exp: Math.floor(challenge.expiresAt.getTime() / 1000),
  });

  for (let attempt = 0; attempt < MFA_CHALLENGE_MAX_FAILURES; attempt += 1) {
    const outcome = await registerMfaChallengeFailure(client, {
      id: challenge.id,
      userId: "user_1",
    });
    assert.equal(
      outcome,
      attempt === MFA_CHALLENGE_MAX_FAILURES - 1 ? "exhausted" : "counted",
    );
  }

  const replayedJwt = await verifyMfaChallengeToken(token);
  assert.ok(replayedJwt, "the copied cookie JWT still verifies cryptographically");
  assert.equal(replayedJwt.jti, challenge.id);

  assert.equal(
    await findUsableMfaChallenge(client, { id: challenge.id, userId: "user_1" }),
    null,
  );
  assert.equal(
    await registerMfaChallengeFailure(client, {
      id: challenge.id,
      userId: "user_1",
    }),
    "unusable",
  );
  assert.equal(
    await consumeMfaChallenge(client, { id: challenge.id, userId: "user_1" }),
    false,
  );
});

test("a consumed MFA challenge cannot be reused by a copied cookie", async () => {
  const db = createMfaMemoryDb();
  const client = asClient(db);
  await seedUser(db);
  const challenge = await createMfaChallengeRecord(client, {
    userId: "user_1",
    callbackUrl: "/admin/dashboard",
  });

  assert.equal(
    await consumeMfaChallenge(client, { id: challenge.id, userId: "user_1" }),
    true,
  );
  assert.equal(
    await consumeMfaChallenge(client, { id: challenge.id, userId: "user_1" }),
    false,
  );
  assert.equal(
    await findUsableMfaChallenge(client, { id: challenge.id, userId: "user_1" }),
    null,
  );
});

test("an expired MFA challenge is rejected", async () => {
  const db = createMfaMemoryDb();
  const client = asClient(db);
  await seedUser(db);
  const now = new Date();
  const challenge = await db.mfaChallenge.create({
    data: {
      userId: "user_1",
      callbackUrl: "/admin/dashboard",
      failureCount: 0,
      expiresAt: new Date(now.getTime() - 1000),
      consumedAt: null,
      revokedAt: null,
    },
  });

  assert.equal(
    await findUsableMfaChallenge(
      client,
      { id: String(challenge.id), userId: "user_1" },
      now,
    ),
    null,
  );
  assert.equal(
    await consumeMfaChallenge(
      client,
      { id: String(challenge.id), userId: "user_1" },
      now,
    ),
    false,
  );
});

test("two concurrent TOTP verifications of the same step produce exactly one success", async () => {
  const db = createMfaMemoryDb();
  const client = asClient(db);
  await seedUser(db);
  const secret = await seedSecret(db, { lastUsedStep: null });

  const [first, second] = await Promise.all([
    consumeTotpStep(client, {
      userId: "user_1",
      secretId: String(secret.id),
      verifiedStep: 42,
    }),
    consumeTotpStep(client, {
      userId: "user_1",
      secretId: String(secret.id),
      verifiedStep: 42,
    }),
  ]);

  assert.equal([first, second].filter(Boolean).length, 1);
  const stored = await db.userMfaSecret.findUnique({
    where: { id: String(secret.id) },
  });
  assert.equal(stored?.lastUsedStep, 42);
});

test("TOTP steps equal or prior to lastUsedStep are rejected", async () => {
  const db = createMfaMemoryDb();
  const client = asClient(db);
  await seedUser(db);
  const secret = await seedSecret(db, { lastUsedStep: 100 });

  assert.equal(
    await consumeTotpStep(client, {
      userId: "user_1",
      secretId: String(secret.id),
      verifiedStep: 100,
    }),
    false,
  );
  assert.equal(
    await consumeTotpStep(client, {
      userId: "user_1",
      secretId: String(secret.id),
      verifiedStep: 99,
    }),
    false,
  );
  assert.equal(
    await consumeTotpStep(client, {
      userId: "user_1",
      secretId: String(secret.id),
      verifiedStep: 101,
    }),
    true,
  );
});

test("the TOTP code used to activate MFA cannot be reused for login", async () => {
  const db = createMfaMemoryDb();
  const client = asClient(db);
  await seedUser(db);
  await db.user.update({
    where: { id: "user_1" },
    data: { mfaEnabled: false },
  });
  const secret = await seedSecret(db, {
    pending: true,
    pendingExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    lastUsedStep: null,
  });
  const activationStep = 777;

  const confirmed = await db.$transaction((tx) =>
    confirmPendingEnrollment(tx as unknown as MfaDbClient, {
      userId: "user_1",
      secretId: String(secret.id),
      verifiedStep: activationStep,
      recoveryHashes: ["hash-1"],
    }),
  );
  assert.equal(confirmed, true);

  assert.equal(
    await consumeTotpStep(client, {
      userId: "user_1",
      secretId: String(secret.id),
      verifiedStep: activationStep,
    }),
    false,
  );
  assert.equal(
    await consumeTotpStep(client, {
      userId: "user_1",
      secretId: String(secret.id),
      verifiedStep: activationStep + 1,
    }),
    true,
  );
});

test("two concurrent uses of the same recovery code produce exactly one success", async () => {
  const db = createMfaMemoryDb();
  const client = asClient(db);
  await seedUser(db);
  const secret = await seedSecret(db);
  const code = await db.mfaRecoveryCode.create({
    data: {
      secretId: String(secret.id),
      codeHash: "hash-recovery",
      usedAt: null,
    },
  });

  const [first, second] = await Promise.all([
    consumeRecoveryCode(client, {
      codeId: String(code.id),
      secretId: String(secret.id),
    }),
    consumeRecoveryCode(client, {
      codeId: String(code.id),
      secretId: String(secret.id),
    }),
  ]);

  assert.equal([first, second].filter(Boolean).length, 1);
  const stored = await db.mfaRecoveryCode.findUnique({
    where: { id: String(code.id) },
  });
  assert.ok(stored?.usedAt instanceof Date);
});

test("persistent MFA rate limiting stores an HMAC fingerprint instead of the raw IP", async () => {
  process.env.AUTH_SECRET = "0".repeat(48);
  const db = createMfaMemoryDb();
  const ipAddress = "203.0.113.10";
  await registerPersistentMfaFailure(asClient(db), "user_1", ipAddress);
  const row = await db.mfaRateLimit.findFirst({
    where: { subjectType: "ip" },
  });
  assert.ok(row);
  assert.notEqual(row.subjectHash, ipAddress);
  assert.equal(String(row.subjectHash).includes(ipAddress), false);
});

test("concurrent first MFA rate-limit attempts increment instead of resetting", async () => {
  process.env.AUTH_SECRET = "0".repeat(48);
  const db = createMfaMemoryDb();
  const attempts = 8;
  await Promise.all(
    Array.from({ length: attempts }, () =>
      registerPersistentMfaFailure(asClient(db), "user_race", "198.51.100.10"),
    ),
  );

  const userRow = await db.mfaRateLimit.findFirst({
    where: { subjectType: "user" },
  });
  const ipRow = await db.mfaRateLimit.findFirst({
    where: { subjectType: "ip" },
  });
  assert.equal(userRow?.failureCount, attempts);
  assert.equal(ipRow?.failureCount, attempts);
  assert.notEqual(String(ipRow?.subjectHash), "198.51.100.10");
});
