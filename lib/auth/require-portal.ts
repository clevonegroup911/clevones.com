import "server-only";

import { redirect } from "next/navigation";

import { canAccessAdminConsole, toAdminActor } from "@/lib/auth/admin-access";
import {
  canAccessPortal,
  canSignInAsPortalUser,
  toPortalActor,
  type PortalActor,
} from "@/lib/auth/portal-access";
import {
  clearPortalSessionCookie,
  readPortalSessionClaims,
} from "@/lib/auth/portal-session";
import { authRoutes, safePortalCallbackUrl } from "@/lib/auth/routes";
import { readAdminSessionClaims } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  mfaEnabled: true,
} as const;

/**
 * Portal actor: ACTIVE USER via portal_session, or ACTIVE admin via admin_session.
 * USER never becomes an admin actor through this helper.
 */
export async function getOptionalPortalActor(): Promise<PortalActor | null> {
  const portalClaims = await readPortalSessionClaims();
  if (portalClaims) {
    const user = await prisma.user.findUnique({
      where: { id: portalClaims.sub },
      select: userSelect,
    });

    if (user && canSignInAsPortalUser(user) && canAccessPortal(user)) {
      return toPortalActor(user);
    }

    await clearPortalSessionCookie();
  }

  const adminClaims = await readAdminSessionClaims();
  if (!adminClaims) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: adminClaims.sub },
    select: userSelect,
  });

  if (!user || !canAccessAdminConsole(user)) {
    return null;
  }

  const admin = toAdminActor(user);
  if (!admin) {
    return null;
  }

  return toPortalActor(admin);
}

export async function requirePortalActor(): Promise<PortalActor> {
  const actor = await getOptionalPortalActor();
  if (actor) {
    return actor;
  }

  await clearPortalSessionCookie();
  redirect(authRoutes.signIn);
}

export async function redirectIfPortalAuthenticated(callbackUrl?: string) {
  const actor = await getOptionalPortalActor();
  if (actor) {
    redirect(safePortalCallbackUrl(callbackUrl));
  }
}
