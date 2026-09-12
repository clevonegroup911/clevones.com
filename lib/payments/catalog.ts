import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export type PaymentsClient = PrismaClient | Prisma.TransactionClient;

export async function listAdminPaymentChains(client: PaymentsClient = prisma) {
  return client.serviceOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      invoices: {
        include: {
          payment: true,
          receipt: true,
        },
      },
    },
  });
}

export async function listHumanReviewDecisions(client: PaymentsClient = prisma) {
  return client.reconciliationDecision.findMany({
    where: { status: "HUMAN_REVIEW" },
    orderBy: [{ reviewDueAt: "asc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function listRecentReconciliationDecisions(
  client: PaymentsClient = prisma,
) {
  return client.reconciliationDecision.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listClientOrdersForUser(
  userId: string,
  client: PaymentsClient = prisma,
) {
  return client.serviceOrder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      invoices: {
        include: {
          payment: true,
          receipt: true,
        },
      },
    },
  });
}

export async function getClientInvoiceForUser(
  invoiceId: string,
  userId: string,
  client: PaymentsClient = prisma,
) {
  return client.invoice.findFirst({
    where: {
      id: invoiceId,
      order: { userId },
    },
    include: {
      order: true,
      payment: true,
      receipt: true,
    },
  });
}

export async function getAdminOrderDetail(
  orderId: string,
  client: PaymentsClient = prisma,
) {
  return client.serviceOrder.findUnique({
    where: { id: orderId },
    include: {
      invoices: {
        include: { payment: true, receipt: true },
      },
    },
  });
}

export async function listProofsForPaymentIds(
  paymentIds: string[],
  client: PaymentsClient = prisma,
) {
  if (paymentIds.length === 0) {
    return [];
  }
  return client.paymentProof.findMany({
    where: { paymentId: { in: paymentIds } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listDecisionsForPaymentIds(
  paymentIds: string[],
  client: PaymentsClient = prisma,
) {
  if (paymentIds.length === 0) {
    return [];
  }
  return client.reconciliationDecision.findMany({
    where: { paymentId: { in: paymentIds } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
