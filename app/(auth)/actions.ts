"use server";

import { redirect } from "next/navigation";

import { auditActions, writeAuditLog } from "@/lib/admin/audit";
import {
  canSignInAsPortalUser,
  getPortalSignInDenialReason,
} from "@/lib/auth/portal-access";
import {
  clearFailedLogins,
  getLoginRateLimitKey,
  isLoginRateLimited,
  registerFailedLogin,
} from "@/lib/auth/rate-limit";
import { getRequestAuditContext } from "@/lib/auth/request-context";
import {
  clearPortalSessionCookie,
  setPortalSessionCookie,
} from "@/lib/auth/portal-session";
import { authRoutes, safePortalCallbackUrl } from "@/lib/auth/routes";
import {
  verifyPassword,
  verifyPasswordAgainstDummy,
} from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import {
  adminLoginSchema,
  formatZodFieldErrors,
} from "@/lib/validation/admin-auth";

const GENERIC_LOGIN_ERROR =
  "Identifiants incorrects ou accès portail refusé.";
const RATE_LIMIT_ERROR =
  "Trop de tentatives de connexion. Réessayez dans quelques minutes.";

export type PortalLoginState = {
  error?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
};

async function recordLoginFailure(
  reason: string,
  email: string,
  ipAddress: string | null,
  userAgent: string | null,
  actorId?: string,
) {
  await writeAuditLog({
    actorId,
    action: auditActions.AUTH_LOGIN_FAILURE,
    entityType: "User",
    entityId: actorId,
    metadata: { email, reason, surface: "portal" },
    ipAddress,
    userAgent,
  });
}

export async function loginPortalUser(
  _previousState: PortalLoginState,
  formData: FormData,
): Promise<PortalLoginState> {
  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl") ?? undefined,
  });

  if (!parsed.success) {
    return {
      error: "Vérifiez les champs du formulaire.",
      fieldErrors: formatZodFieldErrors(parsed.error),
    };
  }

  const { email, password, callbackUrl } = parsed.data;
  const { ipAddress, userAgent } = await getRequestAuditContext();
  const rateLimitKey = `portal:${getLoginRateLimitKey(email, ipAddress)}`;

  if (isLoginRateLimited(rateLimitKey)) {
    await recordLoginFailure("rate_limited", email, ipAddress, userAgent);
    return { error: RATE_LIMIT_ERROR };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      await verifyPasswordAgainstDummy(password);
      registerFailedLogin(rateLimitKey);
      await recordLoginFailure("unknown_user", email, ipAddress, userAgent);
      return { error: GENERIC_LOGIN_ERROR };
    }

    const passwordMatches = await verifyPassword(user.passwordHash, password);
    if (!passwordMatches) {
      registerFailedLogin(rateLimitKey);
      await recordLoginFailure(
        "invalid_password",
        email,
        ipAddress,
        userAgent,
        user.id,
      );
      return { error: GENERIC_LOGIN_ERROR };
    }

    const denialReason = getPortalSignInDenialReason(user);
    if (denialReason || !canSignInAsPortalUser(user)) {
      registerFailedLogin(rateLimitKey);
      await recordLoginFailure(
        denialReason ?? "access_denied",
        email,
        ipAddress,
        userAgent,
        user.id,
      );
      return { error: GENERIC_LOGIN_ERROR };
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      await writeAuditLog(
        {
          actorId: user.id,
          action: auditActions.AUTH_LOGIN_SUCCESS,
          entityType: "User",
          entityId: user.id,
          metadata: { email: user.email, role: user.role, surface: "portal" },
          ipAddress,
          userAgent,
        },
        tx,
      );
    });

    clearFailedLogins(rateLimitKey);
    await setPortalSessionCookie({
      sub: user.id,
      email: user.email,
      role: "USER",
    });
  } catch {
    return {
      error:
        "La connexion au portail est temporairement indisponible. Réessayez plus tard.",
    };
  }

  redirect(safePortalCallbackUrl(callbackUrl));
}

export async function logoutPortalUser() {
  await clearPortalSessionCookie();
  redirect(authRoutes.signIn);
}
