import { NextResponse } from "next/server";

import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import { canAccessAdminPayments } from "@/lib/payments/access";
import {
  listAdminPaymentChains,
  listHumanReviewDecisions,
  listRecentReconciliationDecisions,
} from "@/lib/payments/catalog";

export const runtime = "nodejs";

export async function GET() {
  const actor = await getOptionalAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (!canAccessAdminPayments(actor.role)) {
    return NextResponse.json({ error: "Accès admin paiements refusé." }, { status: 403 });
  }

  const [orders, humanReview, decisions] = await Promise.all([
    listAdminPaymentChains(),
    listHumanReviewDecisions(),
    listRecentReconciliationDecisions(),
  ]);

  return NextResponse.json({
    orders: orders.map((order) => ({
      id: order.id,
      status: order.status,
      serviceCode: order.serviceCode,
      title: order.title,
      amountCents: order.amountCents,
      currency: order.currency,
      invoices: order.invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        paymentStatus: invoice.payment?.status ?? null,
        receiptNumber: invoice.receipt?.receiptNumber ?? null,
      })),
    })),
    humanReview: humanReview.map((row) => ({
      id: row.id,
      paymentId: row.paymentId,
      status: row.status,
      score: row.score,
      reasons: row.reasons,
      reviewDueAt: row.reviewDueAt,
    })),
    decisions: decisions.map((row) => ({
      id: row.id,
      paymentId: row.paymentId,
      status: row.status,
      decidedAt: row.decidedAt,
    })),
  });
}
