import { createHash, randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import { canAccessAdminPayments } from "@/lib/payments/access";
import { findPaymentWithInvoice } from "@/lib/payments/catalog";
import {
  createHydratedReconciliationService,
  persistDecision,
} from "@/lib/payments/persist";
import { adminReconcileSchema } from "@/lib/payments/schemas";

export const runtime = "nodejs";

/**
 * Rapprochement HTTP : recharge preuves + événements CLEVONE depuis Prisma,
 * décide, persiste. Preuve client seule → jamais VERIFIED / jamais capture.
 */
export async function POST(request: Request) {
  const actor = await getOptionalAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (!canAccessAdminPayments(actor.role)) {
    return NextResponse.json({ error: "Accès admin paiements refusé." }, { status: 403 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = adminReconcileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const input = parsed.data;
  const payment = await findPaymentWithInvoice(input.paymentId);
  if (!payment) {
    return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });
  }

  const invoiceId = input.invoiceId ?? payment.invoice?.id;
  if (input.invoiceId && payment.invoice && input.invoiceId !== payment.invoice.id) {
    return NextResponse.json({ error: "Facture non liée à ce paiement." }, { status: 400 });
  }

  const { service, proofs, events } = await createHydratedReconciliationService(
    payment.id,
  );

  const clientProof =
    (input.clientProofId
      ? proofs.find((row) => row.id === input.clientProofId)
      : undefined) ??
    [...proofs]
      .reverse()
      .find((row) => row.source === "CLIENT_UPLOAD");

  if (input.clientProofId && !clientProof) {
    return NextResponse.json({ error: "Preuve client introuvable." }, { status: 404 });
  }

  const eventKeys = events
    .map((event) => event.eventKey)
    .sort()
    .join(",");
  const eventFingerprint = createHash("sha256")
    .update(eventKeys || "none")
    .digest("hex")
    .slice(0, 16);
  const idempotencyKey =
    input.idempotencyKey ??
    `admin-reconcile:${payment.id}:${clientProof?.id ?? "none"}:${eventFingerprint}`;

  const decision = service.reconcile({
    idempotencyKey,
    paymentId: payment.id,
    invoiceId,
    clientProofId: clientProof?.id,
    expectedAmountCents: payment.amountCents,
    expectedCurrency: payment.currency.toUpperCase(),
  });

  // Invariant surface HTTP : preuve client seule ne doit jamais capturer.
  if (
    events.length === 0 &&
    (decision.status === "VERIFIED" || service.allowsCapture(decision))
  ) {
    return NextResponse.json(
      { error: "Invariant violé : preuve client seule." },
      { status: 500 },
    );
  }

  await persistDecision(decision);

  return NextResponse.json({
    decisionId: decision.id,
    status: decision.status,
    score: decision.score,
    reasons: decision.reasons,
    reviewDueAt: decision.reviewDueAt ?? null,
    matchedEventKey: decision.matchedEventKey ?? null,
    clientProofId: decision.clientProofId ?? null,
    allowsCapture: service.allowsCapture(decision),
    hydrated: {
      proofs: proofs.length,
      clevoneEvents: events.length,
    },
    message: `Décision ${decision.status}.`,
    actorId: actor.id,
    requestId: randomUUID(),
  });
}
