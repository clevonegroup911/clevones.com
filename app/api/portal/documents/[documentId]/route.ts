import { NextResponse } from "next/server";

import { auditActions, writeAuditLog } from "@/lib/admin/audit";
import { trackAnalyticsEvent } from "@/lib/analytics/track";
import { getRequestAuditContext } from "@/lib/auth/request-context";
import { getOptionalPortalActor } from "@/lib/auth/require-portal";
import {
  DocumentAccessError,
  assertCanAccessDocument,
  readDocumentBytes,
  softDeleteDocument,
} from "@/lib/documents/service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ documentId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const actor = await getOptionalPortalActor();
  if (!actor) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { documentId } = await context.params;
  const ctx = await getRequestAuditContext();

  try {
    const document = await assertCanAccessDocument(
      { id: actor.id, role: actor.role },
      documentId,
      "read",
    );
    if (!document) {
      return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
    }

    const bytes = await readDocumentBytes(document.storageKey);
    await writeAuditLog({
      actorId: actor.id,
      action: auditActions.DOCUMENT_DOWNLOADED,
      entityType: "Document",
      entityId: document.id,
      metadata: { sizeBytes: document.sizeBytes },
      ...ctx,
    });
    await trackAnalyticsEvent({
      name: "DOCUMENT_DOWNLOAD",
      path: "/portal",
      label: document.category,
      actorId: actor.id,
    });

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `attachment; filename="${document.fileName.replace(/"/g, "")}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof DocumentAccessError) {
      await writeAuditLog({
        actorId: actor.id,
        action: auditActions.DOCUMENT_ACCESS_DENIED,
        entityType: "Document",
        entityId: documentId,
        metadata: { reason: error.reason, op: "download" },
        ...ctx,
      });
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const actor = await getOptionalPortalActor();
  if (!actor) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { documentId } = await context.params;
  const ctx = await getRequestAuditContext();

  try {
    const document = await assertCanAccessDocument(
      { id: actor.id, role: actor.role },
      documentId,
      "delete",
    );
    if (!document) {
      return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
    }

    await softDeleteDocument(document.id);
    await writeAuditLog({
      actorId: actor.id,
      action: auditActions.DOCUMENT_SOFT_DELETED,
      entityType: "Document",
      entityId: document.id,
      metadata: {},
      ...ctx,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof DocumentAccessError) {
      await writeAuditLog({
        actorId: actor.id,
        action: auditActions.DOCUMENT_ACCESS_DENIED,
        entityType: "Document",
        entityId: documentId,
        metadata: { reason: error.reason, op: "delete" },
        ...ctx,
      });
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
    throw error;
  }
}
