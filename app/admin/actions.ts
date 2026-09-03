"use server";

import { redirect } from "next/navigation";

import { auditActions, writeAuditLog } from "@/lib/admin/audit";
import {
  canAccessAdminConsole,
  getAdminAccessDenialReason,
  isAdminRole,
} from "@/lib/auth/admin-access";
import {
  clearFailedLogins,
  getLoginRateLimitKey,
  isLoginRateLimited,
  registerFailedLogin,
} from "@/lib/auth/rate-limit";
import { getRequestAuditContext } from "@/lib/auth/request-context";
import { adminRoutes, safeAdminCallbackUrl } from "@/lib/auth/routes";
import {
  hashPassword,
  verifyPassword,
  verifyPasswordAgainstDummy,
} from "@/lib/auth/password";
import {
  clearAdminSessionCookie,
  readAdminSessionClaims,
  setAdminSessionCookie,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import {
  adminLoginSchema,
  formatZodFieldErrors,
} from "@/lib/validation/admin-auth";

const GENERIC_LOGIN_ERROR =
  "Identifiants incorrects ou accès administratif refusé.";
const RATE_LIMIT_ERROR =
  "Trop de tentatives de connexion. Réessayez dans quelques minutes.";

export type AdminLoginState = {
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
    metadata: { email, reason },
    ipAddress,
    userAgent,
  });
}

export async function loginAdmin(
  _previousState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
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
  const rateLimitKey = getLoginRateLimitKey(email, ipAddress);

  if (isLoginRateLimited(rateLimitKey)) {
    await recordLoginFailure(
      "rate_limited",
      email,
      ipAddress,
      userAgent,
    );
    return { error: RATE_LIMIT_ERROR };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
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

    const denialReason = getAdminAccessDenialReason(user);
    if (denialReason || !canAccessAdminConsole(user) || !isAdminRole(user.role)) {
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
          metadata: { email: user.email, role: user.role },
          ipAddress,
          userAgent,
        },
        tx,
      );
    });

    clearFailedLogins(rateLimitKey);
    await setAdminSessionCookie({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  } catch {
    return {
      error:
        "La connexion administrative est temporairement indisponible. Réessayez plus tard.",
    };
  }

  redirect(safeAdminCallbackUrl(callbackUrl));
}

export async function logoutAdmin() {
  const claims = await readAdminSessionClaims();
  const { ipAddress, userAgent } = await getRequestAuditContext();

  if (claims) {
    await writeAuditLog({
      actorId: claims.sub,
      action: auditActions.AUTH_LOGOUT,
      entityType: "User",
      entityId: claims.sub,
      metadata: { email: claims.email },
      ipAddress,
      userAgent,
    });
  }

  await clearAdminSessionCookie();
  redirect(adminRoutes.login);
}

export async function assertNoPublicAdminProvisioning() {
  void hashPassword;
}
