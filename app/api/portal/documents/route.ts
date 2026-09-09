import { NextResponse } from "next/server";

import { auditActions, writeAuditLog } from "@/lib/admin/audit";
import { actorKindFromRole, trackEvent } from "@/lib/analytics";
import { getRequestAuditContext } from "@/lib/auth/request-context";
import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import { uploadDocument } from "@/lib/documents/service";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const actor = await getOptionalAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const form = await request.formData();
  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();
  const category = String(form.get("category") || "OTHER");
  const accessLevel = String(form.get("accessLevel") || "PRIVATE");
  const file = form.get("file");

  if (!title || !(file instanceof File)) {
    return NextResponse.json({ error: "Titre et fichier requis." }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Taille de fichier invalide." }, { status: 400 });
  }

  const allowedCategories = new Set(["CONTRACT", "DELIVERABLE", "EVIDENCE", "OTHER"]);
  const allowedAccess = new Set(["PRIVATE", "INTERNAL", "RESTRICTED"]);
  if (!allowedCategories.has(category) || !allowedAccess.has(accessLevel)) {
    return NextResponse.json({ error: "Métadonnées invalides." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const document = await uploadDocument({
    title,
    description,
    category: category as "CONTRACT" | "DELIVERABLE" | "EVIDENCE" | "OTHER",
    accessLevel: accessLevel as "PRIVATE" | "INTERNAL" | "RESTRICTED",
    fileName: file.name || "upload.bin",
    mimeType: file.type || "application/octet-stream",
    bytes,
    ownerId: actor.id,
    uploadedById: actor.id,
  });

  const ctx = await getRequestAuditContext();
  await writeAuditLog({
    actorId: actor.id,
    action: auditActions.DOCUMENT_UPLOADED,
    entityType: "Document",
    entityId: document.id,
    metadata: {
      category: document.category,
      accessLevel: document.accessLevel,
      sizeBytes: document.sizeBytes,
    },
    ...ctx,
  });
  await trackEvent({
    name: "document_upload",
    category: "DOCUMENT",
    path: "/api/portal/documents",
    actorKind: actorKindFromRole(actor.role),
  });

  return NextResponse.json({ id: document.id });
}
