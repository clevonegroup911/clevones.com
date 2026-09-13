import type { PrismaClient } from "@prisma/client";

import { auditActions, writeAuditLog } from "@/lib/admin/audit";
import type { PaymentsClient } from "@/lib/payments/catalog";
import { findPaymentWithInvoice } from "@/lib/payments/catalog";
import {
  createPaymentGateway,
  type InvoiceRecord,
  type PaymentChain,
  type ReceiptRecord,
  type ServiceOrderRecord,
} from "@/lib/payments/gateway";
import {
  loadPersistedReconciliationState,
  persistDecision,
  persistDecisionWithReplayProtection,
  persistPaymentChain,
} from "@/lib/payments/persist";
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

function isPrismaClient(client: PaymentsClient): client is PrismaClient {
  return typeof (client as PrismaClient).$transaction === "function";
}

/**
 * Open a transaction when the caller passed a root PrismaClient.
 * Reuse an existing TransactionClient without nesting.
 */
export async function withPaymentsTransaction<T>(
  client: PaymentsClient | undefined,
  fn: (tx: PaymentsClient) => Promise<T>,
): Promise<T> {
  const base = client ?? prisma;
  if (isPrismaClient(base)) {
    return base.$transaction((tx) => fn(tx));
  }
  return fn(base);
}

async function activateVerifiedPaymentWithClient(input: {
  paymentId: string;
  decisionId?: string;
  actorId?: string;
  client: PaymentsClient;
  /** When false, skip AuditLog (caller writes a combined audit). */
  writeAudit?: boolean;
}): Promise<{
  chain: PaymentChain;
  decision: ReconciliationDecisionRecord;
}> {
  const client = input.client;
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

  const statusBefore = {
    order: orderRow.status,
    invoice: invoiceRow.status,
    payment: paymentRow.status,
  };

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

  if (input.writeAudit !== false && input.actorId) {
    await writeAuditLog(
      {
        actorId: input.actorId,
        action: auditActions.PAYMENT_VERIFIED_ACTIVATED,
        entityType: "Payment",
        entityId: decision.paymentId,
        metadata: {
          decisionId: decision.id,
          paymentId: decision.paymentId,
          invoiceId: decision.invoiceId ?? "",
          eventKey: decision.matchedEventKey ?? "",
          statusBefore,
          statusAfter: {
            order: chain.order.status,
            invoice: chain.invoice.status,
            payment: chain.payment?.status ?? "",
            receipt: chain.receipt?.receiptNumber ?? "",
          },
          result: "activated",
        },
      },
      client,
    );
  }

  return { chain, decision };
}

/**
 * Active une chaîne Prisma uniquement si une décision VERIFIED existe
 * (pas de bypass rapprochement). Utilise `activateFromClevoneEvent` sandbox.
 * Écritures DB dans une transaction unique lorsque possible.
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
  return withPaymentsTransaction(input.client, (tx) =>
    activateVerifiedPaymentWithClient({
      paymentId: input.paymentId,
      decisionId: input.decisionId,
      actorId: input.actorId,
      client: tx,
    }),
  );
}

/**
 * Approve/reject d’une décision HUMAN_REVIEW persistée, avec audit durable.
 * Approve → VERIFIED + claim anti-rejeu + activation gateway, atomiques.
 */
export async function resolvePersistedHumanReview(input: {
  decisionId: string;
  action: "approve" | "reject";
  actorId: string;
  note?: string;
  client?: PaymentsClient;
  /** Test hook: throw after VERIFIED persist to prove rollback. */
  injectActivationFailure?: Error;
}): Promise<{
  decision: ReconciliationDecisionRecord;
  chain: PaymentChain | null;
}> {
  return withPaymentsTransaction(input.client, async (tx) => {
    const row = await tx.reconciliationDecision.findUnique({
      where: { id: input.decisionId },
    });
    if (!row) {
      throw new Error("decision_not_found");
    }
    if (row.status !== "HUMAN_REVIEW") {
      throw new Error("decision_not_in_human_review");
    }

    const statusBefore = row.status;
    const state = await loadPersistedReconciliationState(row.paymentId, tx);
    const service = createReconciliationService();
    service.hydratePersistedState({
      ...state,
      decisions: state.decisions.map((decision) =>
        decision.id === row.id
          ? {
              ...decision,
              status: "HUMAN_REVIEW",
            }
          : decision,
      ),
    });

    const decision = service.resolveHumanReview({
      decisionId: row.id,
      action: input.action,
      actorId: input.actorId,
      note: input.note,
    });

    if (input.action === "reject") {
      await persistDecision(decision, tx);
      await writeAuditLog(
        {
          actorId: input.actorId,
          action: auditActions.HUMAN_REVIEW_REJECTED,
          entityType: "ReconciliationDecision",
          entityId: decision.id,
          metadata: {
            decisionId: decision.id,
            paymentId: decision.paymentId,
            invoiceId: decision.invoiceId ?? "",
            eventKey: decision.matchedEventKey ?? "",
            statusBefore,
            statusAfter: decision.status,
            result: "rejected",
            action: "reject",
          },
        },
        tx,
      );
      return { decision, chain: null };
    }

    const persisted = await persistDecisionWithReplayProtection(
      decision,
      { events: state.events, proofs: state.proofs },
      tx,
    );

    if (persisted.status === "DUPLICATE_SUSPECTED") {
      await writeAuditLog(
        {
          actorId: input.actorId,
          action: auditActions.HUMAN_REVIEW_APPROVED,
          entityType: "ReconciliationDecision",
          entityId: persisted.id,
          metadata: {
            decisionId: persisted.id,
            paymentId: persisted.paymentId,
            invoiceId: persisted.invoiceId ?? "",
            eventKey: persisted.matchedEventKey ?? "",
            statusBefore,
            statusAfter: persisted.status,
            result: "duplicate_suspected",
            action: "approve",
          },
        },
        tx,
      );
      return { decision: persisted, chain: null };
    }

    await writeAuditLog(
      {
        actorId: input.actorId,
        action: auditActions.HUMAN_REVIEW_APPROVED,
        entityType: "ReconciliationDecision",
        entityId: persisted.id,
        metadata: {
          decisionId: persisted.id,
          paymentId: persisted.paymentId,
          invoiceId: persisted.invoiceId ?? "",
          eventKey: persisted.matchedEventKey ?? "",
          statusBefore,
          statusAfter: persisted.status,
          result: "approved",
          action: "approve",
        },
      },
      tx,
    );

    if (input.injectActivationFailure) {
      throw input.injectActivationFailure;
    }

    const { chain } = await activateVerifiedPaymentWithClient({
      paymentId: persisted.paymentId,
      decisionId: persisted.id,
      actorId: input.actorId,
      client: tx,
      writeAudit: true,
    });

    return { decision: persisted, chain };
  });
}
