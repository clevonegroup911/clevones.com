import assert from "node:assert/strict";
import { test } from "node:test";

import type { MfaDbClient } from "@/lib/auth/mfa-consume";
import {
  confirmPendingEnrollment,
  disableMfaEnrollment,
  isPendingEnrollmentExpired,
  replacePendingEnrollment,
} from "@/lib/auth/mfa-enrollment";
import { MFA_ENROLLMENT_TTL_SECONDS } from "@/lib/auth/mfa-config";
import { createMfaMemoryDb } from "@/lib/auth/mfa-memory-db";

function asClient(db: ReturnType<typeof createMfaMemoryDb>): MfaDbClient {
  return db as unknown as MfaDbClient;
}

test("a pending MFA enrollment expires after 10 minutes and cannot be confirmed", async () => {
  const db = createMfaMemoryDb();
  const client = asClient(db);
  await db.user.create({
    data: {
      id: "user_1",
      email: "admin@example.com",
      passwordHash: "hash",
      firstName: "Ada",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      mfaEnabled: false,
    },
  });

  const now = new Date("2026-09-07T00:00:00.000Z");
  const first = await replacePendingEnrollment(
    client,
    {
      userId: "user_1",
      encrypted: {
        ciphertext: new Uint8Array([1, 2, 3]),
        iv: new Uint8Array(12),
        authTag: new Uint8Array(16),
      },
    },
    now,
  );

  assert.equal(first.pending, true);
  assert.equal(
    first.pendingExpiresAt?.getTime(),
    now.getTime() + MFA_ENROLLMENT_TTL_SECONDS * 1000,
  );

  const expiredAt = new Date(now.getTime() + MFA_ENROLLMENT_TTL_SECONDS * 1000 + 1);
  assert.equal(
    isPendingEnrollmentExpired(
      {
        pending: true,
        pendingExpiresAt: first.pendingExpiresAt as Date,
      },
      expiredAt,
    ),
    true,
  );

  const confirmedAfterExpiry = await confirmPendingEnrollment(
    client,
    {
      userId: "user_1",
      secretId: String(first.id),
      verifiedStep: 12,
      recoveryHashes: ["old-hash"],
    },
    expiredAt,
  );
  assert.equal(confirmedAfterExpiry, false);

  const replacementNow = new Date(expiredAt.getTime() + 1000);
  const replaced = await db.$transaction((tx) =>
    replacePendingEnrollment(
      tx as unknown as MfaDbClient,
      {
        userId: "user_1",
        encrypted: {
          ciphertext: new Uint8Array([9, 8, 7]),
          iv: new Uint8Array(12).fill(2),
          authTag: new Uint8Array(16).fill(3),
        },
      },
      replacementNow,
    ),
  );

  assert.equal(String(replaced.id), String(first.id));
  assert.equal(replaced.pending, true);
  assert.equal(replaced.lastUsedStep, null);
  assert.deepEqual(Buffer.from(replaced.ciphertext as Buffer), Buffer.from([9, 8, 7]));
  const leftoverCodes = await db.mfaRecoveryCode.findFirst({
    where: { secretId: String(replaced.id) },
  });
  assert.equal(leftoverCodes, null);

  const confirmedReplacement = await confirmPendingEnrollment(
    client,
    {
      userId: "user_1",
      secretId: String(replaced.id),
      verifiedStep: 21,
      recoveryHashes: ["new-hash"],
    },
    replacementNow,
  );
  assert.equal(confirmedReplacement, true);
});

test("an active MFA enrollment cannot be overwritten by a pending replacement", async () => {
  const db = createMfaMemoryDb();
  const client = asClient(db);
  await db.user.create({
    data: {
      id: "user_1",
      email: "admin@example.com",
      passwordHash: "hash",
      firstName: "Ada",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      mfaEnabled: true,
    },
  });
  await db.userMfaSecret.create({
    data: {
      id: "secret_active",
      userId: "user_1",
      ciphertext: Buffer.from([1]),
      iv: Buffer.from(new Uint8Array(12)),
      authTag: Buffer.from(new Uint8Array(16)),
      keyVersion: 1,
      pending: false,
      pendingExpiresAt: null,
      lastUsedStep: 9,
    },
  });

  await assert.rejects(
    () =>
      replacePendingEnrollment(client, {
        userId: "user_1",
        encrypted: {
          ciphertext: new Uint8Array([9, 8, 7]),
          iv: new Uint8Array(12),
          authTag: new Uint8Array(16),
        },
      }),
    (error: unknown) =>
      error instanceof Error && error.name === "MfaEnrollmentConflictError",
  );

  const stored = await db.userMfaSecret.findUnique({ where: { userId: "user_1" } });
  assert.equal(stored?.pending, false);
  assert.deepEqual(Buffer.from(stored?.ciphertext as Buffer), Buffer.from([1]));
});

test("MFA disable only deletes the secret that belongs to the authenticated user", async () => {
  const db = createMfaMemoryDb();
  const client = asClient(db);
  await db.user.create({
    data: {
      id: "user_1",
      email: "admin@example.com",
      passwordHash: "hash",
      firstName: "Ada",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      mfaEnabled: true,
    },
  });
  await db.user.create({
    data: {
      id: "user_2",
      email: "other@example.com",
      passwordHash: "hash",
      firstName: "Other",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      mfaEnabled: true,
    },
  });
  const secret = await db.userMfaSecret.create({
    data: {
      userId: "user_1",
      ciphertext: Buffer.from([1]),
      iv: Buffer.from(new Uint8Array(12)),
      authTag: Buffer.from(new Uint8Array(16)),
      keyVersion: 1,
      pending: false,
    },
  });

  await assert.rejects(() =>
    disableMfaEnrollment(client, {
      userId: "user_2",
      secretId: String(secret.id),
    }),
  );

  const stored = await db.userMfaSecret.findUnique({ where: { id: String(secret.id) } });
  assert.ok(stored);
  const owner = await db.user.findUnique({ where: { id: "user_1" } });
  assert.equal(owner?.mfaEnabled, true);
});
