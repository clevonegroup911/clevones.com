import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getOptionalAdminActor } from "@/lib/auth/require-admin";
import { canAccessAdminPayments } from "@/lib/payments/access";
import { createPaymentGateway } from "@/lib/payments/gateway";
import { persistPaymentChain } from "@/lib/payments/persist";
import { adminSandboxCreateSchema } from "@/lib/payments/schemas";

export const runtime = "nodejs";

/**
 * Crée une chaîne sandbox en base (commande → facture → paiement [→ reçu]).
 * Aucun rail PSP réel. Réservé SUPER_ADMIN / ADMIN.
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

  const parsed = adminSandboxCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const input = parsed.data;
  const gateway = createPaymentGateway();
  const { order, invoice } = await gateway.createOrderWithInvoice({
    userId: input.userId ?? actor.id,
    serviceCode: input.serviceCode,
    title: input.title,
    amountCents: input.amountCents,
    currency: input.currency,
    idempotencyKey: `admin-sandbox:${actor.id}:${randomUUID()}`,
  });

  const linked = await gateway.linkSandboxPayment({
    invoiceId: invoice.id,
    method: input.method,
    idempotencyKey: `admin-sandbox-pay:${invoice.id}`,
    customerRef: actor.email,
  });

  let chain = await gateway.getChainByOrderId(order.id);
  if (!chain) {
    return NextResponse.json({ error: "Chaîne introuvable." }, { status: 500 });
  }

  if (input.settle) {
    chain = await gateway.activateFromClevoneEvent({
      idempotencyKey: `admin-sandbox-settle:${linked.payment.id}`,
      paymentId: linked.payment.id,
    });
  }

  await persistPaymentChain(chain);

  return NextResponse.json({
    orderId: chain.order.id,
    invoiceId: chain.invoice.id,
    paymentId: chain.payment?.id ?? null,
    invoiceStatus: chain.invoice.status,
    paymentStatus: chain.payment?.status ?? null,
    receiptNumber: chain.receipt?.receiptNumber ?? null,
    message: input.settle
      ? "Chaîne sandbox créée et acquittée (reçu émis)."
      : "Chaîne sandbox créée (en attente de paiement / preuve).",
  });
}
