import { NextResponse } from "next/server";

import { getOptionalPortalActor } from "@/lib/auth/require-portal";
import { canAccessClientPayments } from "@/lib/payments/access";
import { createReconciliationService } from "@/lib/payments/reconciliation";
import {
  findOwnedPaymentForUser,
  persistProofAndDecision,
} from "@/lib/payments/persist";
import { paymentProofUploadSchema } from "@/lib/payments/schemas";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

/** Upload preuve client : stocke + rapproche ; n'élève jamais seul à VERIFIED. */
export async function POST(request: Request) {
  const actor = await getOptionalPortalActor();
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

  const owned = await findOwnedPaymentForUser(parsed.data.paymentId, actor.id);
  if (!owned || !owned.payment) {
    return NextResponse.json(
      { error: "Paiement introuvable ou non autorisé." },
      { status: 403 },
    );
  }
  if (parsed.data.invoiceId && parsed.data.invoiceId !== owned.id) {
    return NextResponse.json({ error: "Facture non concordante." }, { status: 400 });
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
    paymentId: owned.payment.id,
    invoiceId: owned.id,
    fileName: file.name || "proof.bin",
    mimeType: file.type || "application/octet-stream",
    bytes,
    reference: parsed.data.reference,
    amountCents: parsed.data.amountCents ?? owned.amountCents,
    currency: parsed.data.currency ?? owned.currency,
  });

  const decision = service.reconcile({
    idempotencyKey: `portal-proof:${proof.id}`,
    paymentId: owned.payment.id,
    invoiceId: owned.id,
    clientProofId: proof.id,
    expectedAmountCents: owned.amountCents,
    expectedCurrency: owned.currency.toUpperCase(),
  });

  // Invariant explicite pour la surface client.
  if (decision.status === "VERIFIED") {
    return NextResponse.json(
      { error: "Invariant violé : preuve client seule." },
      { status: 500 },
    );
  }

  await persistProofAndDecision(proof, decision);

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
