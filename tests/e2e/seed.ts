import { createCipheriv, hkdfSync, randomBytes } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import * as OTPAuth from "otpauth";

import { hashPassword } from "@/lib/auth/password";

import {
  E2E_AUTH_SECRET,
  E2E_MFA_ENCRYPTION_KEY,
  e2eAppEnv,
} from "./env";
import {
  E2E_ADMIN_EMAIL,
  E2E_ADMIN_FIRST_NAME,
  E2E_ADMIN_ID,
  E2E_ADMIN_LAST_NAME,
  E2E_ADMIN_PASSWORD,
  E2E_TOTP_SECRET_BASE32,
  E2E_USER_EMAIL,
  E2E_USER_FIRST_NAME,
  E2E_USER_ID,
  E2E_USER_LAST_NAME,
  E2E_USER_PASSWORD,
} from "./fixture";

const HKDF_SALT = Buffer.from("clevones-mfa-v1");

function encryptTotpSecret(plaintext: string, userId: string) {
  const master = Buffer.from(E2E_MFA_ENCRYPTION_KEY, "base64");
  const aesKey = Buffer.from(
    hkdfSync("sha256", master, HKDF_SALT, "mfa-aes-256-gcm", 32),
  );
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", aesKey, iv, {
    authTagLength: 16,
  });
  cipher.setAAD(Buffer.from(`clevones:mfa-secret:v1:user:${userId}`, "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return {
    ciphertext,
    iv,
    authTag: cipher.getAuthTag(),
  };
}

export function currentE2eTotpCode(at = Date.now()): string {
  const totp = new OTPAuth.TOTP({
    issuer: "CLEVONES-E2E",
    label: E2E_ADMIN_EMAIL,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(E2E_TOTP_SECRET_BASE32),
  });
  return totp.generate({ timestamp: at });
}

export function waitMsUntilSafeTotpWindow(
  at = Date.now(),
  minRemainingMs = 2500,
): number {
  const periodMs = 30_000;
  const remaining = periodMs - (at % periodMs);
  return remaining < minRemainingMs ? remaining + 50 : 0;
}

export async function resetE2eMfaReplayState(databaseUrl: string): Promise<void> {
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  try {
    await prisma.userMfaSecret.updateMany({
      where: { userId: E2E_ADMIN_ID },
      data: { lastUsedStep: null },
    });
  } finally {
    await prisma.$disconnect();
  }
}

export async function seedE2eAdmin(databaseUrl: string): Promise<void> {
  const env = e2eAppEnv(databaseUrl);
  process.env.DATABASE_URL = env.DATABASE_URL;
  process.env.AUTH_SECRET = E2E_AUTH_SECRET;
  process.env.MFA_ENCRYPTION_KEY = E2E_MFA_ENCRYPTION_KEY;

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  try {
    const passwordHash = await hashPassword(E2E_ADMIN_PASSWORD);
    const userPasswordHash = await hashPassword(E2E_USER_PASSWORD);
    const encrypted = encryptTotpSecret(E2E_TOTP_SECRET_BASE32, E2E_ADMIN_ID);

    await prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: E2E_ADMIN_ID },
        update: {
          email: E2E_ADMIN_EMAIL,
          passwordHash,
          firstName: E2E_ADMIN_FIRST_NAME,
          lastName: E2E_ADMIN_LAST_NAME,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          mfaEnabled: true,
        },
        create: {
          id: E2E_ADMIN_ID,
          email: E2E_ADMIN_EMAIL,
          passwordHash,
          firstName: E2E_ADMIN_FIRST_NAME,
          lastName: E2E_ADMIN_LAST_NAME,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          mfaEnabled: true,
        },
      });

      await tx.mfaChallenge.updateMany({
        where: { userId: E2E_ADMIN_ID, consumedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await tx.userMfaSecret.deleteMany({ where: { userId: E2E_ADMIN_ID } });
      await tx.userMfaSecret.create({
        data: {
          userId: E2E_ADMIN_ID,
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          keyVersion: 1,
          pending: false,
          pendingExpiresAt: null,
          lastUsedStep: null,
        },
      });

      await tx.user.upsert({
        where: { id: E2E_USER_ID },
        update: {
          email: E2E_USER_EMAIL,
          passwordHash: userPasswordHash,
          firstName: E2E_USER_FIRST_NAME,
          lastName: E2E_USER_LAST_NAME,
          role: "USER",
          status: "ACTIVE",
          mfaEnabled: false,
        },
        create: {
          id: E2E_USER_ID,
          email: E2E_USER_EMAIL,
          passwordHash: userPasswordHash,
          firstName: E2E_USER_FIRST_NAME,
          lastName: E2E_USER_LAST_NAME,
          role: "USER",
          status: "ACTIVE",
          mfaEnabled: false,
        },
      });
    });
  } finally {
    await prisma.$disconnect();
  }
}
