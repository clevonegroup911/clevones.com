import { NextResponse } from "next/server";

import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import { activateVerifiedPayment } from "@/lib/payments/activation";
import { canAccessAdminPayments } from "@/lib/payments/access";
import { adminActivateVerifiedSchema } from "@/lib/payments/schemas";

export const runtime = "nodejs";

/**
 * Active une commande/facture/reçu uniquement si une décision VERIFIED existe.
 * Pas de shortcut seed settle ; chaîne gateway sandbox.
 */
export async function POST(request: Request) {
  const actor = await getOptionalAdminActor();
  if (!actor) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (!canAccessAdminPayments(actor.role)) {
    return NextResponse.json({ error: "Accès admin paiements refusé." }, { status: 403 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = adminActivateVerifiedSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  try {
    const { chain, decision } = await activateVerifiedPayment({
      paymentId: parsed.data.paymentId,
      decisionId: parsed.data.decisionId,
      actorId: actor.id,
    });

    return NextResponse.json({
      decisionId: decision.id,
      decisionStatus: decision.status,
      orderId: chain.order.id,
      orderStatus: chain.order.status,
      invoiceStatus: chain.invoice.status,
      paymentStatus: chain.payment?.status ?? null,
      receiptNumber: chain.receipt?.receiptNumber ?? null,
      message: "Activation sandbox idempotente après VERIFIED.",
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "activation_failed";
    const status =
      code === "payment_or_invoice_not_found" || code === "order_not_found"
        ? 404
        : code === "verified_decision_required"
          ? 409
          : 400;
    return NextResponse.json({ error: code }, { status });
  }
}
