import { NextResponse } from "next/server";
import { z } from "zod";

import { auditActions, writeAuditLog } from "@/lib/admin/audit";
import { getRequestAuditContext } from "@/lib/auth/request-context";
import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import {
  createDocumentGrant,
  DocumentGrantError,
  listDocumentGrants,
  revokeDocumentGrant,
} from "@/lib/documents/grants";

export const runtime = "nodejs";

const grantBodySchema = z.object({
  documentId: z.string().min(1),
  userId: z.string().min(1),
  canRead: z.boolean().optional(),
  canWrite: z.boolean().optional(),
});

export async function GET(request: Request) {
  const actor = await getOptionalAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const documentId =
    new URL(request.url).searchParams.get("documentId") || undefined;
  const grants = await listDocumentGrants(documentId);
  return NextResponse.json({
    grants: grants.map((grant) => ({
      id: grant.id,
      documentId: grant.documentId,
      userId: grant.userId,
      canRead: grant.canRead,
      canWrite: grant.canWrite,
      email: grant.user.email,
      title: grant.document.title,
      createdAt: grant.createdAt.toISOString(),
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

  const parsed = grantBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  try {
    const grant = await createDocumentGrant(parsed.data);
    const ctx = await getRequestAuditContext();
    await writeAuditLog({
      actorId: actor.id,
      action: auditActions.DOCUMENT_GRANT_CREATED,
      entityType: "DocumentGrant",
      entityId: grant.id,
      metadata: {
        documentId: grant.documentId,
        userId: grant.userId,
        canRead: grant.canRead,
        canWrite: grant.canWrite,
      },
      ...ctx,
    });
    return NextResponse.json(grant);
  } catch (error) {
    if (error instanceof DocumentGrantError) {
      const status =
        error.code === "GRANT_EXISTS"
          ? 409
          : error.code === "DOCUMENT_NOT_FOUND" || error.code === "USER_NOT_FOUND"
            ? 404
            : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Création impossible." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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

  const parsed = grantBodySchema
    .pick({ documentId: true, userId: true })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  try {
    const grant = await revokeDocumentGrant(parsed.data);
    const ctx = await getRequestAuditContext();
    await writeAuditLog({
      actorId: actor.id,
      action: auditActions.DOCUMENT_GRANT_REVOKED,
      entityType: "DocumentGrant",
      entityId: grant.id,
      metadata: { documentId: grant.documentId, userId: grant.userId },
      ...ctx,
    });
    return NextResponse.json({ revoked: true, id: grant.id });
  } catch (error) {
    if (error instanceof DocumentGrantError) {
      const status = error.code === "GRANT_NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Révocation impossible." }, { status: 500 });
  }
}
