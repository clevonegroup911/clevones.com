import type { PaymentsClient } from "@/lib/payments/catalog";
import { findPaymentWithInvoice } from "@/lib/payments/catalog";
import {
  createPaymentGateway,
  type InvoiceRecord,
  type PaymentChain,
  type ReceiptRecord,
  type ServiceOrderRecord,
} from "@/lib/payments/gateway";
import { persistDecision, persistPaymentChain } from "@/lib/payments/persist";
import {
  createReconciliationService,
  type ReconciliationDecisionRecord,
} from "@/lib/payments/reconciliation";
import { createSandboxPaymentProvider } from "@/lib/payments/sandbox";
import type { PaymentMethod, PaymentRecord, PaymentStatus } from "@/lib/payments/types";
import { prisma } from "@/lib/db/prisma";

function asMetadata(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === "string") {
      out[key] = entry;
    }
  }
  return out;
}

/**
 * Active une chaîne Prisma uniquement si une décision VERIFIED existe
 * (pas de bypass rapprochement). Utilise `activateFromClevoneEvent` sandbox.
 */
export async function activateVerifiedPayment(input: {
  paymentId: string;
  decisionId?: string;
  actorId?: string;
  client?: PaymentsClient;
}): Promise<{
  chain: PaymentChain;
  decision: ReconciliationDecisionRecord;
}> {
  const client = input.client ?? prisma;
  const paymentRow = await findPaymentWithInvoice(input.paymentId, client);
  if (!paymentRow || !paymentRow.invoice) {
    throw new Error("payment_or_invoice_not_found");
  }

  const decisionRow = input.decisionId
    ? await client.reconciliationDecision.findUnique({
        where: { id: input.decisionId },
      })
    : await client.reconciliationDecision.findFirst({
        where: { paymentId: input.paymentId, status: "VERIFIED" },
        orderBy: { decidedAt: "desc" },
      });

  if (!decisionRow || decisionRow.status !== "VERIFIED") {
    throw new Error("verified_decision_required");
  }
  if (decisionRow.paymentId !== input.paymentId) {
    throw new Error("decision_payment_mismatch");
  }

  const invoiceRow = paymentRow.invoice;
  const orderRow = invoiceRow.order;
  if (!orderRow) {
    throw new Error("order_not_found");
  }

  const provider = createSandboxPaymentProvider();
  const payment: PaymentRecord = {
    id: paymentRow.id,
    amountCents: paymentRow.amountCents,
    currency: paymentRow.currency,
    method: paymentRow.method as PaymentMethod,
    status: paymentRow.status as PaymentStatus,
    idempotencyKey: paymentRow.idempotencyKey,
    providerRef: paymentRow.providerRef,
    customerRef: paymentRow.customerRef ?? undefined,
    metadata: asMetadata(paymentRow.metadata),
    createdAt: paymentRow.createdAt.toISOString(),
    updatedAt: paymentRow.updatedAt.toISOString(),
  };
  provider.store.payments.set(payment.id, payment);
  provider.store.byIdempotency.set(payment.idempotencyKey, payment.id);

  const order: ServiceOrderRecord = {
    id: orderRow.id,
    userId: orderRow.userId ?? undefined,
    serviceCode: orderRow.serviceCode,
    title: orderRow.title,
    description: orderRow.description,
    amountCents: orderRow.amountCents,
    currency: orderRow.currency,
    status: orderRow.status as ServiceOrderRecord["status"],
    idempotencyKey: orderRow.idempotencyKey,
    metadata: asMetadata(orderRow.metadata),
    activatedAt: orderRow.activatedAt?.toISOString(),
    createdAt: orderRow.createdAt.toISOString(),
    updatedAt: orderRow.updatedAt.toISOString(),
  };

  const invoice: InvoiceRecord = {
    id: invoiceRow.id,
    orderId: invoiceRow.orderId,
    invoiceNumber: invoiceRow.invoiceNumber,
    amountCents: invoiceRow.amountCents,
    currency: invoiceRow.currency,
    status: invoiceRow.status as InvoiceRecord["status"],
    issuedAt: invoiceRow.issuedAt?.toISOString(),
    settledAt: invoiceRow.settledAt?.toISOString(),
    paymentId: invoiceRow.paymentId ?? payment.id,
    createdAt: invoiceRow.createdAt.toISOString(),
    updatedAt: invoiceRow.updatedAt.toISOString(),
  };

  const gateway = createPaymentGateway({ provider });
  gateway.store.orders.set(order.id, order);
  gateway.store.ordersByIdempotency.set(order.idempotencyKey, order.id);
  gateway.store.invoices.set(invoice.id, invoice);
  gateway.store.invoicesByOrder.set(order.id, invoice.id);

  if (invoiceRow.receipt) {
    const receipt: ReceiptRecord = {
      id: invoiceRow.receipt.id,
      invoiceId: invoiceRow.receipt.invoiceId,
      paymentId: invoiceRow.receipt.paymentId,
      receiptNumber: invoiceRow.receipt.receiptNumber,
      status: invoiceRow.receipt.status as ReceiptRecord["status"],
      issuedAt: invoiceRow.receipt.issuedAt.toISOString(),
      createdAt: invoiceRow.receipt.createdAt.toISOString(),
    };
    gateway.store.receipts.set(receipt.id, receipt);
    gateway.store.receiptsByInvoice.set(invoice.id, receipt.id);
  }

  const chain = await gateway.activateFromClevoneEvent({
    idempotencyKey: `activate-verified:${decisionRow.id}`,
    paymentId: payment.id,
  });
  await persistPaymentChain(chain, chain.events, client);

  const decision: ReconciliationDecisionRecord = {
    id: decisionRow.id,
    paymentId: decisionRow.paymentId,
    invoiceId: decisionRow.invoiceId ?? undefined,
    status: "VERIFIED",
    score: decisionRow.score,
    reasons: Array.isArray(decisionRow.reasons)
      ? decisionRow.reasons.map(String)
      : [],
    idempotencyKey: decisionRow.idempotencyKey,
    clientProofId: decisionRow.clientProofId ?? undefined,
    matchedEventKey: decisionRow.matchedEventKey ?? undefined,
    decidedAt: decisionRow.decidedAt.toISOString(),
    createdAt: decisionRow.createdAt.toISOString(),
  };

  return { chain, decision };
}

/**
 * Approve/reject d’une décision HUMAN_REVIEW persistée, avec audit.
 * Approve → VERIFIED puis activation gateway idempotente.
 */
export async function resolvePersistedHumanReview(input: {
  decisionId: string;
  action: "approve" | "reject";
  actorId: string;
  note?: string;
  client?: PaymentsClient;
}): Promise<{
  decision: ReconciliationDecisionRecord;
  chain: PaymentChain | null;
}> {
  const client = input.client ?? prisma;
  const row = await client.reconciliationDecision.findUnique({
    where: { id: input.decisionId },
  });
  if (!row) {
    throw new Error("decision_not_found");
  }
  if (row.status !== "HUMAN_REVIEW") {
    throw new Error("decision_not_in_human_review");
  }

  const service = createReconciliationService();
  service.hydratePersistedState({
    decisions: [
      {
        id: row.id,
        paymentId: row.paymentId,
        invoiceId: row.invoiceId ?? undefined,
        status: "HUMAN_REVIEW",
        score: row.score,
        reasons: Array.isArray(row.reasons) ? row.reasons.map(String) : [],
        idempotencyKey: row.idempotencyKey,
        clientProofId: row.clientProofId ?? undefined,
        matchedEventKey: row.matchedEventKey ?? undefined,
        reviewDueAt: row.reviewDueAt?.toISOString(),
        decidedAt: row.decidedAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
      },
    ],
  });

  const decision = service.resolveHumanReview({
    decisionId: row.id,
    action: input.action,
    actorId: input.actorId,
    note: input.note,
  });
  await persistDecision(decision, client);

  if (input.action === "reject") {
    return { decision, chain: null };
  }

  const { chain } = await activateVerifiedPayment({
    paymentId: decision.paymentId,
    decisionId: decision.id,
    actorId: input.actorId,
    client,
  });
  return { decision, chain };
}
