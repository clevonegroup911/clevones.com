import { NextResponse } from "next/server";

import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import { canAccessClientPayments } from "@/lib/payments/access";
import { createReconciliationService } from "@/lib/payments/reconciliation";
import { paymentProofUploadSchema } from "@/lib/payments/schemas";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

/** Upload preuve client : stocke + rapproche ; n'élève jamais seul à VERIFIED. */
export async function POST(request: Request) {
  const actor = await getOptionalAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (!canAccessClientPayments(actor.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const form = await request.formData();
  const parsed = paymentProofUploadSchema.safeParse({
    paymentId: form.get("paymentId"),
    invoiceId: form.get("invoiceId") || undefined,
    reference: form.get("reference") || undefined,
    amountCents: form.get("amountCents") || undefined,
    currency: form.get("currency") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Métadonnées invalides." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis." }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Taille de fichier invalide." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const service = createReconciliationService();
  const proof = await service.storeClientProof({
    paymentId: parsed.data.paymentId,
    invoiceId: parsed.data.invoiceId,
    fileName: file.name || "proof.bin",
    mimeType: file.type || "application/octet-stream",
    bytes,
    reference: parsed.data.reference,
    amountCents: parsed.data.amountCents,
    currency: parsed.data.currency,
  });

  const decision = service.reconcile({
    idempotencyKey: `portal-proof:${proof.id}`,
    paymentId: parsed.data.paymentId,
    invoiceId: parsed.data.invoiceId,
    clientProofId: proof.id,
    expectedAmountCents: parsed.data.amountCents ?? 0,
    expectedCurrency: (parsed.data.currency || "USD").toUpperCase(),
  });

  // Invariant explicite pour la surface client.
  if (decision.status === "VERIFIED" && !service.store.officialEvents.size) {
    return NextResponse.json(
      { error: "Invariant violé : preuve client seule." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    proofId: proof.id,
    status: decision.status,
    allowsCapture: service.allowsCapture(decision),
    message:
      decision.status === "PENDING"
        ? "Preuve enregistrée. Une source CLEVONE authentifiée est requise pour validation."
        : `Décision ${decision.status}.`,
  });
}
