import { createHash, randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { auditActions, writeAuditLog } from "@/lib/admin/audit";
import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import { withPaymentsTransaction } from "@/lib/payments/activation";
import { canAccessAdminPayments } from "@/lib/payments/access";
import { findPaymentWithInvoice } from "@/lib/payments/catalog";
import {
  createHydratedReconciliationService,
  persistDecisionWithReplayProtection,
} from "@/lib/payments/persist";
import { adminReconcileSchema } from "@/lib/payments/schemas";

export const runtime = "nodejs";

/**
 * Rapprochement HTTP : recharge preuves + événements CLEVONE + claims globaux,
 * décide, persiste avec anti-rejeu durable. Preuve client seule → jamais VERIFIED.
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

  const result = await withPaymentsTransaction(undefined, async (tx) => {
    const { service, proofs, events } = await createHydratedReconciliationService(
      payment.id,
      tx,
    );

    const clientProof =
      (input.clientProofId
        ? proofs.find((row) => row.id === input.clientProofId)
        : undefined) ??
      [...proofs]
        .reverse()
        .find((row) => row.source === "CLIENT_UPLOAD");

    if (input.clientProofId && !clientProof) {
      return { kind: "proof_missing" as const };
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

    if (
      events.length === 0 &&
      (decision.status === "VERIFIED" || service.allowsCapture(decision))
    ) {
      return { kind: "invariant" as const };
    }

    const persisted = await persistDecisionWithReplayProtection(
      decision,
      { events, proofs },
      tx,
    );

    await writeAuditLog(
      {
        actorId: actor.id,
        action: auditActions.PAYMENT_RECONCILE_EXECUTED,
        entityType: "ReconciliationDecision",
        entityId: persisted.id,
        metadata: {
          decisionId: persisted.id,
          paymentId: persisted.paymentId,
          invoiceId: persisted.invoiceId ?? "",
          eventKey: persisted.matchedEventKey ?? "",
          statusBefore: "",
          statusAfter: persisted.status,
          result: persisted.status,
          score: persisted.score,
        },
      },
      tx,
    );

    return {
      kind: "ok" as const,
      persisted,
      allowsCapture: service.allowsCapture(persisted),
      proofs: proofs.length,
      clevoneEvents: events.length,
    };
  });

  if (result.kind === "proof_missing") {
    return NextResponse.json({ error: "Preuve client introuvable." }, { status: 404 });
  }
  if (result.kind === "invariant") {
    return NextResponse.json(
      { error: "Invariant violé : preuve client seule." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    decisionId: result.persisted.id,
    status: result.persisted.status,
    score: result.persisted.score,
    reasons: result.persisted.reasons,
    reviewDueAt: result.persisted.reviewDueAt ?? null,
    matchedEventKey: result.persisted.matchedEventKey ?? null,
    clientProofId: result.persisted.clientProofId ?? null,
    allowsCapture: result.allowsCapture,
    hydrated: {
      proofs: result.proofs,
      clevoneEvents: result.clevoneEvents,
    },
    message: `Décision ${result.persisted.status}.`,
    actorId: actor.id,
    requestId: randomUUID(),
  });
}
