import type { Prisma } from "@prisma/client";

import type { PaymentsClient } from "@/lib/payments/catalog";
import {
  isReconcileClevoneEventType,
  parseClevoneReconcilePayload,
  reconcileEventTypeForSource,
  RECONCILE_EVENT_TYPES,
  sourceFromReconcileEventType,
  type ClevoneReconcilePayload,
} from "@/lib/payments/clevone-events";
import type {
  ClevoneGatewayEventRecord,
  InvoiceRecord,
  PaymentChain,
  ReceiptRecord,
  ServiceOrderRecord,
} from "@/lib/payments/gateway";
import type {
  ClevoneOfficialEvent,
  PaymentProofRecord,
  PaymentProofSource,
  ReconciliationDecisionRecord,
  ReconciliationStatus,
  ReconciliationService,
} from "@/lib/payments/reconciliation";
import { createReconciliationService } from "@/lib/payments/reconciliation";
import {
  claimVerifiedReferences,
  collectSignificantReferences,
  decisionAsDuplicateSuspect,
  listClaimedNormalizedReferences,
  ReferenceClaimConflictError,
} from "@/lib/payments/reference-claims";
import type { PaymentRecord } from "@/lib/payments/types";
import { prisma } from "@/lib/db/prisma";

function asJson(
  value: Record<string, unknown> | string[] | Record<string, string>,
): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    Boolean(error) &&
    typeof error === "object" &&
    (error as { code?: string }).code === "P2002"
  );
}

export class ClevoneEventConflictError extends Error {
  constructor(message = "clevone_event_conflict") {
    super(message);
    this.name = "ClevoneEventConflictError";
  }
}

function canonicalEventIdentity(input: {
  paymentId?: string | null;
  invoiceId?: string | null;
  eventType: string;
  payload: ClevoneReconcilePayload;
}): string {
  return [
    input.paymentId ?? "",
    input.invoiceId ?? "",
    input.eventType,
    input.payload.source,
    input.payload.reference.trim().toUpperCase(),
    String(input.payload.amountCents),
    input.payload.currency.toUpperCase(),
    input.payload.authenticated ? "1" : "0",
  ].join("|");
}

function assertEventUnchanged(
  existing: {
    paymentId: string | null;
    invoiceId: string | null;
    eventType: string;
    payload: Prisma.JsonValue;
  },
  next: {
    paymentId: string;
    invoiceId?: string;
    eventType: string;
    payload: ClevoneReconcilePayload;
  },
): void {
  const existingPayload = parseClevoneReconcilePayload(existing.payload);
  if (!existingPayload) {
    throw new ClevoneEventConflictError("clevone_event_conflict_unreadable");
  }
  const left = canonicalEventIdentity({
    paymentId: existing.paymentId,
    invoiceId: existing.invoiceId,
    eventType: existing.eventType,
    payload: existingPayload,
  });
  const right = canonicalEventIdentity({
    paymentId: next.paymentId,
    invoiceId: next.invoiceId,
    eventType: next.eventType,
    payload: next.payload,
  });
  if (left !== right) {
    throw new ClevoneEventConflictError();
  }
}

/** Persist a sandbox gateway chain (order → invoice → payment → receipt/events). */
export async function persistPaymentChain(
  chain: PaymentChain,
  events: ClevoneGatewayEventRecord[] = chain.events,
  client: PaymentsClient = prisma,
): Promise<void> {
  const { order, invoice, payment, receipt } = chain;

  await client.serviceOrder.upsert({
    where: { id: order.id },
    create: mapOrderCreate(order),
    update: mapOrderUpdate(order),
  });

  if (payment) {
    await client.payment.upsert({
      where: { id: payment.id },
      create: mapPaymentCreate(payment),
      update: mapPaymentUpdate(payment),
    });
  }

  await client.invoice.upsert({
    where: { id: invoice.id },
    create: mapInvoiceCreate(invoice),
    update: mapInvoiceUpdate(invoice),
  });

  if (receipt) {
    await client.receipt.upsert({
      where: { id: receipt.id },
      create: mapReceiptCreate(receipt),
      update: {
        receiptNumber: receipt.receiptNumber,
        status: receipt.status,
        paymentId: receipt.paymentId,
        issuedAt: new Date(receipt.issuedAt),
      },
    });
  }

  for (const event of events) {
    // Identity fields are immutable once written (anti-tamper / anti-replay).
    await client.clevoneGatewayEvent.upsert({
      where: { idempotencyKey: event.idempotencyKey },
      create: {
        id: event.id,
        eventType: event.eventType,
        idempotencyKey: event.idempotencyKey,
        orderId: event.orderId,
        invoiceId: event.invoiceId,
        paymentId: event.paymentId,
        payload: asJson(event.payload),
        createdAt: new Date(event.createdAt),
      },
      update: {},
    });
  }
}

export async function persistProofAndDecision(
  proof: PaymentProofRecord,
  decision: ReconciliationDecisionRecord,
  client: PaymentsClient = prisma,
): Promise<void> {
  await client.paymentProof.upsert({
    where: { storageKey: proof.storageKey },
    create: {
      id: proof.id,
      paymentId: proof.paymentId,
      invoiceId: proof.invoiceId,
      source: proof.source,
      storageKey: proof.storageKey,
      fileName: proof.fileName,
      mimeType: proof.mimeType,
      sizeBytes: proof.sizeBytes,
      checksumSha256: proof.checksumSha256,
      reference: proof.reference,
      amountCents: proof.amountCents,
      currency: proof.currency,
      authenticated: proof.authenticated,
      createdAt: new Date(proof.createdAt),
    },
    update: {
      reference: proof.reference,
      amountCents: proof.amountCents,
      currency: proof.currency,
    },
  });

  await persistDecision(decision, client);
}

export async function persistDecision(
  decision: ReconciliationDecisionRecord,
  client: PaymentsClient = prisma,
): Promise<void> {
  await client.reconciliationDecision.upsert({
    where: { idempotencyKey: decision.idempotencyKey },
    create: {
      id: decision.id,
      paymentId: decision.paymentId,
      invoiceId: decision.invoiceId,
      status: decision.status,
      score: decision.score,
      reasons: asJson(decision.reasons),
      idempotencyKey: decision.idempotencyKey,
      clientProofId: decision.clientProofId,
      matchedEventKey: decision.matchedEventKey,
      reviewDueAt: decision.reviewDueAt
        ? new Date(decision.reviewDueAt)
        : null,
      decidedAt: new Date(decision.decidedAt),
      createdAt: new Date(decision.createdAt),
    },
    update: {
      status: decision.status,
      score: decision.score,
      reasons: asJson(decision.reasons),
      clientProofId: decision.clientProofId,
      matchedEventKey: decision.matchedEventKey,
      reviewDueAt: decision.reviewDueAt
        ? new Date(decision.reviewDueAt)
        : null,
      decidedAt: new Date(decision.decidedAt),
    },
  });
}

/**
 * Persist a decision and, when VERIFIED, claim references globally in the same
 * client/transaction. Conflicting claims become DUPLICATE_SUSPECTED.
 */
export async function persistDecisionWithReplayProtection(
  decision: ReconciliationDecisionRecord,
  context: {
    events?: ClevoneOfficialEvent[];
    proofs?: PaymentProofRecord[];
  } = {},
  client: PaymentsClient = prisma,
): Promise<ReconciliationDecisionRecord> {
  if (decision.status !== "VERIFIED") {
    await persistDecision(decision, client);
    return decision;
  }

  const references = collectSignificantReferences({
    decision,
    events: context.events,
    proofs: context.proofs,
  });

  try {
    await claimVerifiedReferences(
      {
        references,
        paymentId: decision.paymentId,
        decisionId: decision.id,
        eventKey: decision.matchedEventKey,
      },
      client,
    );
    await persistDecision(decision, client);
    return decision;
  } catch (error) {
    if (error instanceof ReferenceClaimConflictError) {
      const duplicate = decisionAsDuplicateSuspect(decision);
      await persistDecision(duplicate, client);
      return duplicate;
    }
    throw error;
  }
}

/**
 * Persiste un événement CLEVONE de rapprochement dans `ClevoneGatewayEvent`
 * (idempotencyKey = eventKey). eventKey immuable après création.
 */
export async function persistClevoneOfficialEvent(
  event: ClevoneOfficialEvent,
  options?: { orderId?: string; client?: PaymentsClient },
): Promise<{ created: boolean }> {
  const client = options?.client ?? prisma;
  const eventType = reconcileEventTypeForSource(event.source);
  const payload: ClevoneReconcilePayload = {
    reference: event.reference,
    amountCents: event.amountCents,
    currency: event.currency.toUpperCase(),
    source: event.source,
    authenticated: true,
  };

  const existing = await client.clevoneGatewayEvent.findUnique({
    where: { idempotencyKey: event.eventKey },
  });
  if (existing) {
    assertEventUnchanged(existing, {
      paymentId: event.paymentId,
      invoiceId: event.invoiceId,
      eventType,
      payload,
    });
    return { created: false };
  }

  try {
    await client.clevoneGatewayEvent.create({
      data: {
        id: event.eventKey,
        eventType,
        idempotencyKey: event.eventKey,
        orderId: options?.orderId,
        invoiceId: event.invoiceId,
        paymentId: event.paymentId,
        payload: asJson(payload),
      },
    });
    return { created: true };
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
    const raced = await client.clevoneGatewayEvent.findUnique({
      where: { idempotencyKey: event.eventKey },
    });
    if (!raced) {
      throw error;
    }
    assertEventUnchanged(raced, {
      paymentId: event.paymentId,
      invoiceId: event.invoiceId,
      eventType,
      payload,
    });
    return { created: false };
  }
}

function mapProofRow(row: {
  id: string;
  paymentId: string;
  invoiceId: string | null;
  source: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  reference: string | null;
  amountCents: number | null;
  currency: string | null;
  authenticated: boolean;
  createdAt: Date;
}): PaymentProofRecord {
  return {
    id: row.id,
    paymentId: row.paymentId,
    invoiceId: row.invoiceId ?? undefined,
    source: row.source as PaymentProofSource,
    storageKey: row.storageKey,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    checksumSha256: row.checksumSha256,
    reference: row.reference ?? undefined,
    amountCents: row.amountCents ?? undefined,
    currency: row.currency ?? undefined,
    authenticated: row.authenticated,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapDecisionRow(row: {
  id: string;
  paymentId: string;
  invoiceId: string | null;
  status: string;
  score: number;
  reasons: Prisma.JsonValue;
  idempotencyKey: string;
  clientProofId: string | null;
  matchedEventKey: string | null;
  reviewDueAt: Date | null;
  decidedAt: Date;
  createdAt: Date;
}): ReconciliationDecisionRecord {
  const reasons = Array.isArray(row.reasons)
    ? row.reasons.map(String)
    : [];
  return {
    id: row.id,
    paymentId: row.paymentId,
    invoiceId: row.invoiceId ?? undefined,
    status: row.status as ReconciliationStatus,
    score: row.score,
    reasons,
    idempotencyKey: row.idempotencyKey,
    clientProofId: row.clientProofId ?? undefined,
    matchedEventKey: row.matchedEventKey ?? undefined,
    reviewDueAt: row.reviewDueAt?.toISOString(),
    decidedAt: row.decidedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function mapGatewayEventToOfficial(
  row: {
    idempotencyKey: string;
    eventType: string;
    paymentId: string | null;
    invoiceId: string | null;
    payload: Prisma.JsonValue;
  },
): ClevoneOfficialEvent | null {
  if (!row.paymentId || !isReconcileClevoneEventType(row.eventType)) {
    return null;
  }
  const payload = parseClevoneReconcilePayload(row.payload);
  if (!payload) {
    return null;
  }
  return {
    eventKey: row.idempotencyKey,
    paymentId: row.paymentId,
    invoiceId: row.invoiceId ?? undefined,
    reference: payload.reference,
    amountCents: payload.amountCents,
    currency: payload.currency,
    authenticated: true,
    source: payload.source ?? sourceFromReconcileEventType(row.eventType),
  };
}

/** Charge preuves + événements CLEVONE rapprochement + décisions pour un paiement. */
export async function loadPersistedReconciliationState(
  paymentId: string,
  client: PaymentsClient = prisma,
): Promise<{
  proofs: PaymentProofRecord[];
  events: ClevoneOfficialEvent[];
  decisions: ReconciliationDecisionRecord[];
  verifiedReferences: string[];
}> {
  const [proofRows, eventRows, decisionRows, verifiedReferences] =
    await Promise.all([
      client.paymentProof.findMany({
        where: { paymentId },
        orderBy: { createdAt: "asc" },
      }),
      client.clevoneGatewayEvent.findMany({
        where: {
          paymentId,
          eventType: { in: [...RECONCILE_EVENT_TYPES] },
        },
        orderBy: { createdAt: "asc" },
      }),
      client.reconciliationDecision.findMany({
        where: { paymentId },
        orderBy: { createdAt: "asc" },
      }),
      listClaimedNormalizedReferences(client),
    ]);

  return {
    proofs: proofRows.map(mapProofRow),
    events: eventRows
      .map(mapGatewayEventToOfficial)
      .filter((row): row is ClevoneOfficialEvent => row !== null),
    decisions: decisionRows.map(mapDecisionRow),
    verifiedReferences,
  };
}

/**
 * Service de rapprochement hydraté depuis Prisma pour un paiement donné.
 * Une preuve client seule ne produit jamais VERIFIED (invariant service).
 * Les claims globaux alimentent l'anti-rejeu cross-payment.
 */
export async function createHydratedReconciliationService(
  paymentId: string,
  client: PaymentsClient = prisma,
): Promise<{
  service: ReconciliationService;
  proofs: PaymentProofRecord[];
  events: ClevoneOfficialEvent[];
  decisions: ReconciliationDecisionRecord[];
  verifiedReferences: string[];
}> {
  const state = await loadPersistedReconciliationState(paymentId, client);
  const service = createReconciliationService();
  service.hydratePersistedState(state);
  return { service, ...state };
}

/**
 * Client may only attach a proof to a payment linked to an invoice of their order.
 * Returns the invoice when ownership holds.
 */
export async function findOwnedPaymentForUser(
  paymentId: string,
  userId: string,
  client: PaymentsClient = prisma,
) {
  return client.invoice.findFirst({
    where: {
      paymentId,
      order: { userId },
    },
    include: {
      order: true,
      payment: true,
      receipt: true,
    },
  });
}

function mapOrderCreate(order: ServiceOrderRecord) {
  return {
    id: order.id,
    userId: order.userId,
    serviceCode: order.serviceCode,
    title: order.title,
    description: order.description,
    amountCents: order.amountCents,
    currency: order.currency,
    status: order.status,
    idempotencyKey: order.idempotencyKey,
    metadata: asJson(order.metadata),
    activatedAt: order.activatedAt ? new Date(order.activatedAt) : null,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
  };
}

function mapOrderUpdate(order: ServiceOrderRecord) {
  return {
    userId: order.userId,
    serviceCode: order.serviceCode,
    title: order.title,
    description: order.description,
    amountCents: order.amountCents,
    currency: order.currency,
    status: order.status,
    metadata: asJson(order.metadata),
    activatedAt: order.activatedAt ? new Date(order.activatedAt) : null,
    updatedAt: new Date(order.updatedAt),
  };
}

function mapPaymentCreate(payment: PaymentRecord) {
  return {
    id: payment.id,
    amountCents: payment.amountCents,
    currency: payment.currency,
    method: payment.method,
    status: payment.status,
    idempotencyKey: payment.idempotencyKey,
    provider: "sandbox",
    providerRef: payment.providerRef,
    customerRef: payment.customerRef,
    metadata: asJson(payment.metadata),
    createdAt: new Date(payment.createdAt),
    updatedAt: new Date(payment.updatedAt),
  };
}

function mapPaymentUpdate(payment: PaymentRecord) {
  return {
    amountCents: payment.amountCents,
    currency: payment.currency,
    method: payment.method,
    status: payment.status,
    providerRef: payment.providerRef,
    customerRef: payment.customerRef,
    metadata: asJson(payment.metadata),
    updatedAt: new Date(payment.updatedAt),
  };
}

function mapInvoiceCreate(invoice: InvoiceRecord) {
  return {
    id: invoice.id,
    orderId: invoice.orderId,
    invoiceNumber: invoice.invoiceNumber,
    amountCents: invoice.amountCents,
    currency: invoice.currency,
    status: invoice.status,
    issuedAt: invoice.issuedAt ? new Date(invoice.issuedAt) : null,
    settledAt: invoice.settledAt ? new Date(invoice.settledAt) : null,
    paymentId: invoice.paymentId,
    createdAt: new Date(invoice.createdAt),
    updatedAt: new Date(invoice.updatedAt),
  };
}

function mapInvoiceUpdate(invoice: InvoiceRecord) {
  return {
    invoiceNumber: invoice.invoiceNumber,
    amountCents: invoice.amountCents,
    currency: invoice.currency,
    status: invoice.status,
    issuedAt: invoice.issuedAt ? new Date(invoice.issuedAt) : null,
    settledAt: invoice.settledAt ? new Date(invoice.settledAt) : null,
    paymentId: invoice.paymentId,
    updatedAt: new Date(invoice.updatedAt),
  };
}

function mapReceiptCreate(receipt: ReceiptRecord) {
  return {
    id: receipt.id,
    invoiceId: receipt.invoiceId,
    paymentId: receipt.paymentId,
    receiptNumber: receipt.receiptNumber,
    status: receipt.status,
    issuedAt: new Date(receipt.issuedAt),
    createdAt: new Date(receipt.createdAt),
  };
}
