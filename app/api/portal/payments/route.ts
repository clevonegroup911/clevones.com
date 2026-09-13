import { NextResponse } from "next/server";

import { getOptionalPortalActor } from "@/lib/auth/require-portal";
import { canAccessClientPayments } from "@/lib/payments/access";
import { listClientOrdersForUser } from "@/lib/payments/catalog";

export const runtime = "nodejs";

export async function GET() {
  const actor = await getOptionalPortalActor();
  if (!actor) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (!canAccessClientPayments(actor.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const orders = await listClientOrdersForUser(actor.id);
  return NextResponse.json({
    orders: orders.map((order) => ({
      id: order.id,
      title: order.title,
      status: order.status,
      amountCents: order.amountCents,
      currency: order.currency,
      invoices: order.invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        paymentId: invoice.payment?.id ?? null,
        paymentStatus: invoice.payment?.status ?? null,
        receiptNumber: invoice.receipt?.receiptNumber ?? null,
      })),
    })),
  });
}
