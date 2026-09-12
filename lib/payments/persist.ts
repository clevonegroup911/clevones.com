import type { Prisma } from "@prisma/client";

import type { PaymentsClient } from "@/lib/payments/catalog";
import type {
  ClevoneGatewayEventRecord,
  InvoiceRecord,
  PaymentChain,
  ReceiptRecord,
  ServiceOrderRecord,
} from "@/lib/payments/gateway";
import type {
  PaymentProofRecord,
  ReconciliationDecisionRecord,
} from "@/lib/payments/reconciliation";
import type { PaymentRecord } from "@/lib/payments/types";
import { prisma } from "@/lib/db/prisma";

function asJson(
  value: Record<string, unknown> | string[] | Record<string, string>,
): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
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
      update: {
        eventType: event.eventType,
        orderId: event.orderId,
        invoiceId: event.invoiceId,
        paymentId: event.paymentId,
        payload: asJson(event.payload),
      },
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
