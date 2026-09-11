"use server";

import { auditActions, writeAuditLog } from "@/lib/admin/audit";
import { MfaConfigurationError } from "@/lib/auth/mfa-config";
import { decryptUtf8 } from "@/lib/auth/mfa-crypto";
import {
  confirmPendingEnrollment,
  disableMfaEnrollment,
  isPendingEnrollmentExpired,
  MfaEnrollmentConflictError,
  replacePendingEnrollment,
} from "@/lib/auth/mfa-enrollment";
import {
  consumeRecoveryCode,
  consumeTotpStep,
} from "@/lib/auth/mfa-consume";
import {
  generateRecoveryCodes,
  hashRecoveryCodes,
  findMatchingRecoveryCode,
  isWellFormedRecoveryCode,
} from "@/lib/auth/mfa-recovery";
import {
  createTotpEnrollment,
  createTotpQrDataUrl,
  isWellFormedTotpCode,
  verifyTotpCode,
} from "@/lib/auth/mfa-totp";
import {
  clearFailedMfaSetup,
  isMfaSetupRateLimited,
  registerFailedMfaSetup,
} from "@/lib/auth/rate-limit";
import { getRequestAuditContext } from "@/lib/auth/request-context";
import { verifyPassword } from "@/lib/auth/password";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import {
  adminMfaConfirmSchema,
  adminMfaDisableSchema,
  adminMfaPasswordSchema,
  formatZodFieldErrors,
} from "@/lib/validation/admin-auth";

const GENERIC_SETUP_ERROR =
  "La vérification a échoué. Contrôlez votre mot de passe ou votre code.";
const RATE_LIMIT_ERROR =
  "Trop de tentatives. Réessayez dans quelques minutes.";
const FORBIDDEN_ERROR =
  "Cette opération est réservée au super-administrateur, sur son propre compte.";
const EXPIRED_ENROLLMENT_ERROR =
  "La configuration MFA a expiré. Recommencez l'activation.";

export type MfaSetupState = {
  error?: string;
  fieldErrors?: {
    password?: string;
    code?: string;
  };
  phase?: "idle" | "pending" | "recovery" | "disabled";
  message?: string;
  manualKey?: string;
  qrDataUrl?: string | null;
  recoveryCodes?: string[];
};

function setupUnavailableError(): MfaSetupState {
  return {
    error:
      "La configuration MFA est temporairement indisponible. Réessayez plus tard.",
  };
}

export async function startMfaEnrollment(
  _previousState: MfaSetupState,
  formData: FormData,
): Promise<MfaSetupState> {
  const actor = await requireAdmin();
  if (actor.role !== "SUPER_ADMIN") {
    return { error: FORBIDDEN_ERROR };
  }

  const parsed = adminMfaPasswordSchema.safeParse({
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      error: "Vérifiez les champs du formulaire.",
      fieldErrors: formatZodFieldErrors(parsed.error),
    };
  }

  const { ipAddress, userAgent } = await getRequestAuditContext();
  if (isMfaSetupRateLimited(actor.id, ipAddress)) {
    return { error: RATE_LIMIT_ERROR };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: actor.id },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        mfaEnabled: true,
      },
    });

    if (!user || user.role !== "SUPER_ADMIN" || user.id !== actor.id) {
      return { error: FORBIDDEN_ERROR };
    }

    if (user.mfaEnabled) {
      return { error: "La MFA est déjà activée sur ce compte." };
    }

    const passwordMatches = await verifyPassword(
      user.passwordHash,
      parsed.data.password,
    );
    if (!passwordMatches) {
      registerFailedMfaSetup(actor.id, ipAddress);
      return { error: GENERIC_SETUP_ERROR };
    }

    const enrollment = await createTotpEnrollment(user.email, user.id);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await replacePendingEnrollment(tx, {
        userId: user.id,
        encrypted: enrollment.encrypted,
      });
      await writeAuditLog(
        {
          actorId: user.id,
          action: auditActions.MFA_ENROLLMENT_STARTED,
          entityType: "User",
          entityId: user.id,
          metadata: { role: user.role },
          ipAddress,
          userAgent,
        },
        tx,
      );
    });

    clearFailedMfaSetup(actor.id, ipAddress);

    return {
      phase: "pending",
      manualKey: enrollment.secretBase32,
      qrDataUrl: enrollment.qrDataUrl,
    };
  } catch (error) {
    if (error instanceof MfaEnrollmentConflictError) {
      return { error: "La MFA est déjà activée sur ce compte." };
    }
    if (error instanceof MfaConfigurationError) {
      return setupUnavailableError();
    }
    return setupUnavailableError();
  }
}

export async function confirmMfaEnrollment(
  _previousState: MfaSetupState,
  formData: FormData,
): Promise<MfaSetupState> {
  const actor = await requireAdmin();
  if (actor.role !== "SUPER_ADMIN") {
    return { error: FORBIDDEN_ERROR };
  }

  const parsed = adminMfaConfirmSchema.safeParse({
    code: formData.get("code"),
  });
  if (!parsed.success) {
    return {
      error: "Vérifiez le code saisi.",
      fieldErrors: formatZodFieldErrors(parsed.error),
      phase: "pending",
    };
  }

  const { ipAddress, userAgent } = await getRequestAuditContext();
  if (isMfaSetupRateLimited(actor.id, ipAddress)) {
    return { error: RATE_LIMIT_ERROR, phase: "pending" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: actor.id },
      include: { mfaSecret: true },
    });

    if (!user || user.role !== "SUPER_ADMIN" || user.id !== actor.id) {
      return { error: FORBIDDEN_ERROR };
    }

    if (user.mfaEnabled || !user.mfaSecret || !user.mfaSecret.pending) {
      return {
        error: "Recommencez l'activation MFA depuis le début.",
      };
    }

    if (isPendingEnrollmentExpired(user.mfaSecret)) {
      return {
        error: EXPIRED_ENROLLMENT_ERROR,
      };
    }

    const secretBase32 = decryptUtf8(
      {
        ciphertext: user.mfaSecret.ciphertext,
        iv: user.mfaSecret.iv,
        authTag: user.mfaSecret.authTag,
      },
      user.id,
      user.mfaSecret.keyVersion,
    );
    const totpResult = verifyTotpCode(secretBase32, parsed.data.code);
    if (!totpResult.ok) {
      registerFailedMfaSetup(actor.id, ipAddress);
      return {
        error: GENERIC_SETUP_ERROR,
        phase: "pending",
        manualKey: secretBase32,
        qrDataUrl: await createTotpQrDataUrl(secretBase32, user.email),
      };
    }

    const recoveryCodes = generateRecoveryCodes();
    const recoveryHashes = hashRecoveryCodes(recoveryCodes);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const confirmed = await confirmPendingEnrollment(tx, {
        userId: user.id,
        secretId: user.mfaSecret!.id,
        verifiedStep: totpResult.step,
        recoveryHashes,
      });
      if (!confirmed) {
        throw new Error("enrollment_expired");
      }
      await writeAuditLog(
        {
          actorId: user.id,
          action: auditActions.MFA_ENABLED,
          entityType: "User",
          entityId: user.id,
          metadata: { role: user.role },
          ipAddress,
          userAgent,
        },
        tx,
      );
    });

    clearFailedMfaSetup(actor.id, ipAddress);

    return {
      phase: "recovery",
      recoveryCodes,
      message:
        "MFA activée. Conservez ces codes de récupération maintenant : ils ne seront plus affichés.",
    };
  } catch (error) {
    if (error instanceof MfaConfigurationError) {
      return setupUnavailableError();
    }
    if (error instanceof Error && error.message === "enrollment_expired") {
      return { error: EXPIRED_ENROLLMENT_ERROR };
    }
    return setupUnavailableError();
  }
}

export async function disableMfa(
  _previousState: MfaSetupState,
  formData: FormData,
): Promise<MfaSetupState> {
  const actor = await requireAdmin();
  if (actor.role !== "SUPER_ADMIN") {
    return { error: FORBIDDEN_ERROR };
  }

  const parsed = adminMfaDisableSchema.safeParse({
    password: formData.get("password"),
    code: formData.get("code"),
  });
  if (!parsed.success) {
    return {
      error: "Vérifiez les champs du formulaire.",
      fieldErrors: formatZodFieldErrors(parsed.error),
    };
  }

  const { ipAddress, userAgent } = await getRequestAuditContext();
  if (isMfaSetupRateLimited(actor.id, ipAddress)) {
    return { error: RATE_LIMIT_ERROR };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: actor.id },
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

    if (!user || user.role !== "SUPER_ADMIN" || user.id !== actor.id) {
      return { error: FORBIDDEN_ERROR };
    }

    if (!user.mfaEnabled || !user.mfaSecret || user.mfaSecret.pending) {
      return { error: "La MFA n'est pas active sur ce compte." };
    }

    const passwordMatches = await verifyPassword(
      user.passwordHash,
      parsed.data.password,
    );
    if (!passwordMatches) {
      registerFailedMfaSetup(actor.id, ipAddress);
      return { error: GENERIC_SETUP_ERROR };
    }

    const submittedCode = parsed.data.code;
    let nextStep: number | null = null;
    let recoveryMatchId: string | null = null;

    if (isWellFormedTotpCode(submittedCode)) {
      const secretBase32 = decryptUtf8(
        {
          ciphertext: user.mfaSecret.ciphertext,
          iv: user.mfaSecret.iv,
          authTag: user.mfaSecret.authTag,
        },
        user.id,
        user.mfaSecret.keyVersion,
      );
      const totpResult = verifyTotpCode(secretBase32, submittedCode);
      if (totpResult.ok) {
        nextStep = totpResult.step;
      }
    } else if (isWellFormedRecoveryCode(submittedCode)) {
      const matched = findMatchingRecoveryCode(
        user.mfaSecret.recoveryCodes,
        submittedCode,
      );
      recoveryMatchId = matched?.id ?? null;
    }

    if (nextStep === null && !recoveryMatchId) {
      registerFailedMfaSetup(actor.id, ipAddress);
      return { error: GENERIC_SETUP_ERROR };
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (recoveryMatchId) {
        const consumed = await consumeRecoveryCode(tx, {
          codeId: recoveryMatchId,
          secretId: user.mfaSecret!.id,
        });
        if (!consumed) {
          throw new Error("recovery_code_race");
        }
      } else if (nextStep !== null) {
        const consumed = await consumeTotpStep(tx, {
          userId: user.id,
          secretId: user.mfaSecret!.id,
          verifiedStep: nextStep,
        });
        if (!consumed) {
          throw new Error("totp_replay");
        }
      }

      await disableMfaEnrollment(tx, {
        userId: user.id,
        secretId: user.mfaSecret!.id,
      });
      await writeAuditLog(
        {
          actorId: user.id,
          action: auditActions.MFA_DISABLED,
          entityType: "User",
          entityId: user.id,
          metadata: {
            role: user.role,
            method: recoveryMatchId ? "recovery" : "totp",
          },
          ipAddress,
          userAgent,
        },
        tx,
      );
    });

    clearFailedMfaSetup(actor.id, ipAddress);

    return {
      phase: "disabled",
      message: "La MFA a été désactivée sur ce compte.",
    };
  } catch (error) {
    if (error instanceof MfaConfigurationError) {
      return setupUnavailableError();
    }
    return { error: GENERIC_SETUP_ERROR };
  }
}
