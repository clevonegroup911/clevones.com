import { NextResponse } from "next/server";

import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import { canAccessAdminPayments } from "@/lib/payments/access";
import {
  listAdminPaymentChains,
  listHumanReviewDecisions,
  listRecentReconciliationDecisions,
} from "@/lib/payments/catalog";
import { adminPaymentListQuerySchema } from "@/lib/payments/schemas";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const actor = await getOptionalAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (!canAccessAdminPayments(actor.role)) {
    return NextResponse.json({ error: "Accès admin paiements refusé." }, { status: 403 });
  }

  const url = new URL(request.url);
  const parsed = adminPaymentListQuerySchema.safeParse({
    status: url.searchParams.get("status") ?? "ALL",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Query invalide." }, { status: 400 });
  }

  const [orders, humanReview, decisions] = await Promise.all([
    listAdminPaymentChains(),
    listHumanReviewDecisions(),
    listRecentReconciliationDecisions(),
  ]);

  const filteredDecisions =
    parsed.data.status === "ALL"
      ? decisions
      : decisions.filter((row) => row.status === parsed.data.status);

  return NextResponse.json({
    filter: parsed.data.status,
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
    decisions: filteredDecisions.map((row) => ({
      id: row.id,
      paymentId: row.paymentId,
      status: row.status,
      decidedAt: row.decidedAt,
    })),
  });
}
