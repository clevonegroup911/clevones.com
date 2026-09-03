import "server-only";

import { redirect } from "next/navigation";

import {
  canAccessAdminConsole,
  toAdminActor,
  type AdminActor,
} from "@/lib/auth/admin-access";
import { adminRoutes, safeAdminCallbackUrl } from "@/lib/auth/routes";
import {
  clearAdminSessionCookie,
  readAdminSessionClaims,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function getOptionalAdminActor(): Promise<AdminActor | null> {
  const claims = await readAdminSessionClaims();
  if (!claims) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      mfaEnabled: true,
    },
  });

  if (!user || !canAccessAdminConsole(user)) {
    return null;
  }

  return toAdminActor(user);
}

export async function requireAdmin(): Promise<AdminActor> {
  const actor = await getOptionalAdminActor();
  if (actor) {
    return actor;
  }

  await clearAdminSessionCookie();
  redirect(adminRoutes.login);
}

export async function redirectIfAdminAuthenticated(callbackUrl?: string) {
  const actor = await getOptionalAdminActor();
  if (actor) {
    redirect(safeAdminCallbackUrl(callbackUrl));
  }
}
