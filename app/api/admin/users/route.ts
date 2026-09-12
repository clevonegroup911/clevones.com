import { NextResponse } from "next/server";

import { auditActions, writeAuditLog } from "@/lib/admin/audit";
import { getRequestAuditContext } from "@/lib/auth/request-context";
import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import {
  createManagedUser,
  createManagedUserSchema,
  listManagedUsers,
  ManagedUserError,
} from "@/lib/auth/managed-users";

export const runtime = "nodejs";

export async function GET() {
  const actor = await getOptionalAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const users = await listManagedUsers();
  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      mfaEnabled: user.mfaEnabled,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const actor = await getOptionalAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = createManagedUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  try {
    const user = await createManagedUser(parsed.data);
    const ctx = await getRequestAuditContext();
    await writeAuditLog({
      actorId: actor.id,
      action: auditActions.USER_CREATED,
      entityType: "User",
      entityId: user.id,
      metadata: { email: user.email, role: user.role, status: user.status },
      ...ctx,
    });
    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  } catch (error) {
    if (error instanceof ManagedUserError) {
      const status = error.code === "EMAIL_TAKEN" ? 409 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Création impossible." }, { status: 500 });
  }
}
