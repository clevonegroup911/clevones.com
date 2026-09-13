import { createHash, randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { auditActions, writeAuditLog } from "@/lib/admin/audit";
import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import { readJsonBody } from "@/lib/http/read-json-body";
import { canAccessAdminPayments } from "@/lib/payments/access";
import { findPaymentWithInvoice } from "@/lib/payments/catalog";
import {
  ClevoneEventConflictError,
  persistClevoneOfficialEvent,
} from "@/lib/payments/persist";
import type { ClevoneOfficialEvent } from "@/lib/payments/reconciliation";
import { adminClevoneEventSchema } from "@/lib/payments/schemas";

export const runtime = "nodejs";

/**
 * Enregistre un événement CLEVONE sandbox authentifié (Prisma `ClevoneGatewayEvent`).
 * eventKey immuable ; conflit d'identité → 409. Aucun webhook réseau, aucune clé PSP.
 */
export async function POST(request: Request) {
  const actor = await getOptionalAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (!canAccessAdminPayments(actor.role)) {
    return NextResponse.json({ error: "Accès admin paiements refusé." }, { status: 403 });
  }

  const json = await readJsonBody(request);
  if (!json.ok) {
    return json.response;
  }

  const parsed = adminClevoneEventSchema.safeParse(json.body);
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

  const eventKey =
    input.eventKey ??
    `clevone-sandbox:${input.paymentId}:${createHash("sha256")
      .update(
        `${input.reference}|${input.amountCents}|${input.currency}|${input.source}`,
      )
      .digest("hex")
      .slice(0, 24)}`;

  const event: ClevoneOfficialEvent = {
    eventKey,
    paymentId: payment.id,
    invoiceId,
    reference: input.reference,
    amountCents: input.amountCents,
    currency: input.currency.toUpperCase(),
    authenticated: true,
    source: input.source,
  };

  try {
    const result = await persistClevoneOfficialEvent(event, {
      orderId: payment.invoice?.orderId,
    });

    await writeAuditLog({
      actorId: actor.id,
      action: auditActions.PAYMENT_CLEVONE_EVENT_CREATED,
      entityType: "ClevoneGatewayEvent",
      entityId: event.eventKey,
      metadata: {
        decisionId: "",
        paymentId: event.paymentId,
        invoiceId: event.invoiceId ?? "",
        eventKey: event.eventKey,
        statusBefore: "",
        statusAfter: result.created ? "created" : "idempotent",
        result: result.created ? "created" : "idempotent",
      },
    });

    return NextResponse.json({
      eventKey: event.eventKey,
      paymentId: event.paymentId,
      invoiceId: event.invoiceId ?? null,
      source: event.source,
      authenticated: true,
      reference: event.reference,
      amountCents: event.amountCents,
      currency: event.currency,
      created: result.created,
      message: result.created
        ? "Événement CLEVONE sandbox persisté. Lancer reconcile pour produire une décision."
        : "Événement CLEVONE déjà présent (idempotent).",
      actorId: actor.id,
      requestId: randomUUID(),
    });
  } catch (error) {
    if (error instanceof ClevoneEventConflictError) {
      return NextResponse.json(
        { error: "clevone_event_conflict", message: error.message },
        { status: 409 },
      );
    }
    throw error;
  }
}
