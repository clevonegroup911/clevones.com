import { NextResponse } from "next/server";

import { auditActions, writeAuditLog } from "@/lib/admin/audit";
import { actorKindFromRole, trackEvent } from "@/lib/analytics";
import { getRequestAuditContext } from "@/lib/auth/request-context";
import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import {
  getActiveDocument,
  readDocumentBytes,
  softDeleteDocument,
} from "@/lib/documents/service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ documentId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const actor = await getOptionalAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { documentId } = await context.params;
  const document = await getActiveDocument(documentId);
  if (!document) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }

  const bytes = await readDocumentBytes(document.storageKey);
  const ctx = await getRequestAuditContext();
  await writeAuditLog({
    actorId: actor.id,
    action: auditActions.DOCUMENT_DOWNLOADED,
    entityType: "Document",
    entityId: document.id,
    metadata: { sizeBytes: document.sizeBytes },
    ...ctx,
  });
  await trackEvent({
    name: "document_download",
    category: "DOCUMENT",
    path: `/api/portal/documents/${document.id}`,
    actorKind: actorKindFromRole(actor.role),
  });

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `attachment; filename="${document.fileName.replace(/"/g, "")}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const actor = await getOptionalAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { documentId } = await context.params;
  const document = await getActiveDocument(documentId);
  if (!document) {
    return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  }

  await softDeleteDocument(document.id);
  const ctx = await getRequestAuditContext();
  await writeAuditLog({
    actorId: actor.id,
    action: auditActions.DOCUMENT_SOFT_DELETED,
    entityType: "Document",
    entityId: document.id,
    metadata: {},
    ...ctx,
  });
  await trackEvent({
    name: "document_delete",
    category: "DOCUMENT",
    path: `/api/portal/documents/${document.id}`,
    actorKind: actorKindFromRole(actor.role),
  });

  return NextResponse.json({ ok: true });
}
