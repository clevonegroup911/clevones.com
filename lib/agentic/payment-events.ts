import type { ClevoneReconcilePayload } from "@/lib/payments/clevone-events";
import type { RecordEventInput } from "@/lib/agentic/events";

/**
 * Maps persisted ClevoneGatewayEvent identity onto the agentic envelope.
 * Does not write to Prisma — persist.ts remains the payment source of truth.
 */
export function envelopeFromClevoneGatewayEvent(input: {
  idempotencyKey: string;
  eventType: string;
  payload: ClevoneReconcilePayload;
  paymentId?: string | null;
  invoiceId?: string | null;
  createdAt?: Date | string;
}): RecordEventInput {
  const timestamp =
    input.createdAt instanceof Date
      ? input.createdAt.toISOString()
      : input.createdAt ?? new Date().toISOString();
  return {
    eventId: input.idempotencyKey,
    eventType: "payment.received",
    idempotencyKey: input.idempotencyKey,
    correlationId: input.invoiceId || input.paymentId || input.idempotencyKey,
    source:
      input.payload.source === "CLEVONE_OFFICIAL"
        ? "clevone.official"
        : "clevone.sandbox",
    actor: { type: "system", id: "clevone-gateway" },
    risk: "MEDIUM",
    timestamp,
    payload: {
      gatewayEventType: input.eventType,
      paymentId: input.paymentId ?? null,
      invoiceId: input.invoiceId ?? null,
      reference: input.payload.reference,
      amountCents: input.payload.amountCents,
      currency: input.payload.currency,
      authenticated: input.payload.authenticated,
    },
    contentLayer: "BUSINESS",
  };
}

export function proofUploadedEnvelope(input: {
  idempotencyKey: string;
  paymentId: string;
  proofId: string;
  source: "CLIENT_UPLOAD" | "CLEVONE_SANDBOX" | "CLEVONE_OFFICIAL";
  authenticated: boolean;
}): RecordEventInput {
  return {
    eventType: "payment.proof_uploaded",
    idempotencyKey: input.idempotencyKey,
    correlationId: input.paymentId,
    source: input.source === "CLIENT_UPLOAD" ? "client.upload" : "clevone.sandbox",
    actor: { type: "user", id: "portal" },
    risk: "LOW",
    timestamp: new Date().toISOString(),
    payload: {
      paymentId: input.paymentId,
      proofId: input.proofId,
      proofSource: input.source,
      authenticated: input.authenticated,
    },
    contentLayer: input.source === "CLIENT_UPLOAD" ? "EXTERNAL" : "BUSINESS",
  };
}
