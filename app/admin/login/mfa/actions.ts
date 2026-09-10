"use server";

import { redirect } from "next/navigation";

import { auditActions, writeAuditLog } from "@/lib/admin/audit";
import {
  canAccessAdminConsole,
  getAdminAccessDenialReason,
  isAdminRole,
} from "@/lib/auth/admin-access";
import { MfaConfigurationError } from "@/lib/auth/mfa-config";
import {
  clearMfaChallengeCookie,
  readMfaChallengeClaims,
} from "@/lib/auth/mfa-challenge";
import {
  consumeMfaChallenge,
  consumeRecoveryCode,
  consumeTotpStep,
  registerMfaChallengeFailure,
} from "@/lib/auth/mfa-consume";
import { decryptUtf8 } from "@/lib/auth/mfa-crypto";
import {
  findMatchingRecoveryCode,
  isWellFormedRecoveryCode,
} from "@/lib/auth/mfa-recovery";
import {
  clearPersistentMfaFailures,
  isPersistentMfaRateLimited,
  registerPersistentMfaFailure,
} from "@/lib/auth/mfa-rate-limit";
import { isWellFormedTotpCode, verifyTotpCode } from "@/lib/auth/mfa-totp";
import {
  clearFailedMfaAttempts,
  isMfaRateLimited,
  registerFailedMfaAttempt,
} from "@/lib/auth/rate-limit";
import { getRequestAuditContext } from "@/lib/auth/request-context";
import { safeAdminCallbackUrl } from "@/lib/auth/routes";
import { trackAnalyticsEvent } from "@/lib/analytics/track";
import { setAdminSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import {
  adminMfaVerifySchema,
  formatZodFieldErrors,
} from "@/lib/validation/admin-auth";

const GENERIC_MFA_ERROR =
  "Code incorrect ou vérification expirée. Reconnectez-vous si nécessaire.";
const RATE_LIMIT_ERROR =
  "Trop de tentatives de vérification. Réessayez dans quelques minutes.";

export type AdminMfaVerifyState = {
  error?: string;
  fieldErrors?: {
    code?: string;
  };
};

async function recordMfaFailure(
  userId: string,
  challengeId: string,
  ipAddress: string | null,
  userAgent: string | null,
  reason: string,
) {
  registerFailedMfaAttempt(userId, ipAddress);
  await registerPersistentMfaFailure(prisma, userId, ipAddress);
  const outcome = await registerMfaChallengeFailure(prisma, {
    id: challengeId,
    userId,
  });
  if (outcome !== "counted") {
    await clearMfaChallengeCookie();
  }
  await writeAuditLog({
    actorId: userId,
    action: auditActions.MFA_LOGIN_FAILED,
    entityType: "User",
    entityId: userId,
    metadata: { reason },
    ipAddress,
    userAgent,
  });
}

export async function verifyAdminMfa(
  _previousState: AdminMfaVerifyState,
  formData: FormData,
): Promise<AdminMfaVerifyState> {
  const parsed = adminMfaVerifySchema.safeParse({
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return {
      error: "Vérifiez le code saisi.",
      fieldErrors: formatZodFieldErrors(parsed.error),
    };
  }

  const claims = await readMfaChallengeClaims();
  if (!claims) {
    return { error: GENERIC_MFA_ERROR };
  }

  const { ipAddress, userAgent } = await getRequestAuditContext();
  const submittedCode = parsed.data.code;
  let destination = safeAdminCallbackUrl(claims.callbackUrl);

  if (
    isMfaRateLimited(claims.sub, ipAddress) ||
    (await isPersistentMfaRateLimited(prisma, claims.sub, ipAddress))
  ) {
    await writeAuditLog({
      actorId: claims.sub,
      action: auditActions.MFA_LOGIN_FAILED,
      entityType: "User",
      entityId: claims.sub,
      metadata: { reason: "rate_limited" },
      ipAddress,
      userAgent,
    });
    return { error: RATE_LIMIT_ERROR };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      include: {
        mfaSecret: {
          include: {
            recoveryCodes: {
              where: { usedAt: null },
              select: { id: true, codeHash: true, secretId: true },
            },
          },
        },
      },
    });

    if (
      !user ||
      user.email !== claims.email ||
      !user.mfaEnabled ||
      !user.mfaSecret ||
      user.mfaSecret.pending ||
      getAdminAccessDenialReason(user) ||
      !canAccessAdminConsole(user) ||
      !isAdminRole(user.role)
    ) {
      await recordMfaFailure(
        claims.sub,
        claims.jti,
        ipAddress,
        userAgent,
        "access_denied",
      );
      return { error: GENERIC_MFA_ERROR };
    }

    const secretRow = user.mfaSecret;
    let usedRecoveryCodeId: string | null = null;
    let nextStep: number | null = null;

    if (isWellFormedTotpCode(submittedCode)) {
      const secretBase32 = decryptUtf8(
        {
          ciphertext: secretRow.ciphertext,
          iv: secretRow.iv,
          authTag: secretRow.authTag,
        },
        user.id,
        secretRow.keyVersion,
      );
      const totpResult = verifyTotpCode(secretBase32, submittedCode);
      if (totpResult.ok) {
        nextStep = totpResult.step;
      }
    } else if (isWellFormedRecoveryCode(submittedCode)) {
      const matched = findMatchingRecoveryCode(
        secretRow.recoveryCodes,
        submittedCode,
      );
      if (matched) {
        usedRecoveryCodeId = matched.id;
      }
    }

    if (nextStep === null && usedRecoveryCodeId === null) {
      await recordMfaFailure(
        user.id,
        claims.jti,
        ipAddress,
        userAgent,
        "invalid_code",
      );
      return { error: GENERIC_MFA_ERROR };
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (usedRecoveryCodeId) {
        const consumedCode = await consumeRecoveryCode(tx, {
          codeId: usedRecoveryCodeId,
          secretId: secretRow.id,
        });
        if (!consumedCode) {
          throw new Error("recovery_code_race");
        }
        await writeAuditLog(
          {
            actorId: user.id,
            action: auditActions.MFA_RECOVERY_CODE_USED,
            entityType: "User",
            entityId: user.id,
            metadata: { method: "recovery" },
            ipAddress,
            userAgent,
          },
          tx,
        );
      } else if (nextStep !== null) {
        const consumedStep = await consumeTotpStep(tx, {
          userId: user.id,
          secretId: secretRow.id,
          verifiedStep: nextStep,
        });
        if (!consumedStep) {
          throw new Error("totp_replay");
        }
      }

      const consumedChallenge = await consumeMfaChallenge(tx, {
        id: claims.jti,
        userId: user.id,
      });
      if (!consumedChallenge) {
        throw new Error("challenge_unusable");
      }

      await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      await writeAuditLog(
        {
          actorId: user.id,
          action: auditActions.MFA_LOGIN_SUCCESS,
          entityType: "User",
          entityId: user.id,
          metadata: {
            role: user.role,
            method: usedRecoveryCodeId ? "recovery" : "totp",
          },
          ipAddress,
          userAgent,
        },
        tx,
      );
    });

    clearFailedMfaAttempts(user.id, ipAddress);
    await clearPersistentMfaFailures(prisma, user.id, ipAddress);
    await clearMfaChallengeCookie();
    await setAdminSessionCookie({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    await trackAnalyticsEvent({
      name: "ADMIN_LOGIN",
      path: "/admin/login/mfa",
      actorId: user.id,
      label: usedRecoveryCodeId ? "recovery" : "totp",
    });
    destination = safeAdminCallbackUrl(claims.callbackUrl);
  } catch (error) {
    if (error instanceof MfaConfigurationError) {
      return {
        error:
          "La vérification MFA est temporairement indisponible. Réessayez plus tard.",
      };
    }

    await recordMfaFailure(
      claims.sub,
      claims.jti,
      ipAddress,
      userAgent,
      "verification_failed",
    );
    return { error: GENERIC_MFA_ERROR };
  }

  redirect(destination);
}
