import { NextResponse } from "next/server";

import { auditActions, writeAuditLog } from "@/lib/admin/audit";
import { getRequestAuditContext } from "@/lib/auth/request-context";
import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import {
  disableManagedUser,
  ManagedUserError,
} from "@/lib/auth/managed-users";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ userId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const actor = await getOptionalAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { userId } = await context.params;
  try {
    const user = await disableManagedUser(userId);
    const ctx = await getRequestAuditContext();
    await writeAuditLog({
      actorId: actor.id,
      action: auditActions.USER_DISABLED,
      entityType: "User",
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
      ...ctx,
    });
    return NextResponse.json({
      id: user.id,
      status: user.status,
      email: user.email,
    });
  } catch (error) {
    if (error instanceof ManagedUserError) {
      const status =
        error.code === "NOT_FOUND"
          ? 404
          : error.code === "FORBIDDEN_TARGET"
            ? 403
            : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Désactivation impossible." }, { status: 500 });
  }
}
