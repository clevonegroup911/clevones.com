import { createPageMetadata } from "@/lib/metadata";

import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminClevoneReconcileForms } from "@/app/admin/payments/clevone-reconcile-forms";
import { ActivateVerifiedButton } from "@/app/admin/payments/activate-verified-button";
import { adminRoutes } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessAdminPayments } from "@/lib/payments/access";
import {
  getAdminOrderDetail,
  listDecisionsForPaymentIds,
  listProofsForPaymentIds,
  listReconcileClevoneEventsForPaymentIds,
} from "@/lib/payments/catalog";
import { parseClevoneReconcilePayload } from "@/lib/payments/clevone-events";

export const metadata = createPageMetadata({
  title: "Détail paiement gateway",
  description: "Détail commande/facture/paiement sandbox.",
  path: "/admin/payments",
  robots: { index: false, follow: false },
});

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function AdminPaymentDetailPage({ params }: PageProps) {
  const actor = await requireAdmin();
  if (!canAccessAdminPayments(actor.role)) {
    return (
      <div className="px-4 py-10 text-sm text-gray-muted">
        Accès réservé SUPER_ADMIN / ADMIN.
      </div>
    );
  }

  const { orderId } = await params;
  const order = await getAdminOrderDetail(orderId);
  if (!order) {
    notFound();
  }
  const invoice = order.invoices[0];
  const paymentIds = order.invoices
    .map((row) => row.paymentId)
    .filter((id): id is string => Boolean(id));
  const [proofs, decisions, clevoneEvents] = await Promise.all([
    listProofsForPaymentIds(paymentIds),
    listDecisionsForPaymentIds(paymentIds),
    listReconcileClevoneEventsForPaymentIds(paymentIds),
  ]);

  const latestClientProof = proofs.find((row) => row.source === "CLIENT_UPLOAD");
  const verifiedDecision = decisions.find((row) => row.status === "VERIFIED");
  const alreadySettled = Boolean(invoice?.receipt) || invoice?.status === "SETTLED";

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs text-gray-muted">
        <Link href={adminRoutes.payments} className="text-gold-muted hover:text-gold">
          Paiements
        </Link>
      </p>
      <h1 className="font-heading text-2xl font-semibold text-white">
        {order.title}
      </h1>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-gray-muted">Statut commande</dt>
          <dd className="text-white">{order.status}</dd>
        </div>
        <div>
          <dt className="text-gray-muted">Montant</dt>
          <dd className="text-white">
            {order.amountCents} {order.currency}
          </dd>
        </div>
        <div>
          <dt className="text-gray-muted">Facture</dt>
          <dd className="text-white">
            {invoice
              ? `${invoice.invoiceNumber} (${invoice.status})`
              : "aucune"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-muted">Paiement</dt>
          <dd className="text-white">
            {invoice?.payment
              ? `${invoice.payment.id.slice(0, 8)}… (${invoice.payment.status})`
              : "non lié"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-muted">Reçu</dt>
          <dd className="text-white">
            {invoice?.receipt ? invoice.receipt.receiptNumber : "non émis"}
          </dd>
        </div>
      </dl>

      {invoice?.payment ? (
        <AdminClevoneReconcileForms
          paymentId={invoice.payment.id}
          invoiceId={invoice.id}
          defaultAmountCents={invoice.payment.amountCents}
          defaultCurrency={invoice.payment.currency}
          defaultReference={latestClientProof?.reference ?? ""}
        />
      ) : null}

      {invoice?.payment && verifiedDecision && !alreadySettled ? (
        <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
          <h2 className="text-sm font-semibold text-white">
            Activation VERIFIED
          </h2>
          <p className="mt-2 text-xs text-gray-muted">
            Décision VERIFIED détectée — activation via chaîne gateway (pas le
            shortcut seed settle).
          </p>
          <ActivateVerifiedButton
            paymentId={invoice.payment.id}
            decisionId={verifiedDecision.id}
            canActivate
          />
        </section>
      ) : null}

      <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
        <h2 className="text-sm font-semibold text-white">
          Preuves ({proofs.length})
        </h2>
        {proofs.length === 0 ? (
          <p className="mt-3 text-sm text-gray-muted">Aucune preuve enregistrée.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border-subtle">
            {proofs.map((proof) => (
              <li key={proof.id} className="py-2 text-sm">
                <span className="text-white">{proof.source}</span>
                <span className="text-gray-muted">
                  {" "}
                  · {proof.fileName} · {proof.authenticated ? "auth" : "non-auth"}
                  {proof.reference ? ` · réf ${proof.reference}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
        <h2 className="text-sm font-semibold text-white">
          Événements CLEVONE rapprochement ({clevoneEvents.length})
        </h2>
        {clevoneEvents.length === 0 ? (
          <p className="mt-3 text-sm text-gray-muted">
            Aucun événement RECONCILE_* persisté.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border-subtle">
            {clevoneEvents.map((event) => {
              const payload = parseClevoneReconcilePayload(event.payload);
              return (
                <li key={event.id} className="py-2 text-sm">
                  <span className="text-white">{event.eventType}</span>
                  <span className="text-gray-muted">
                    {" "}
                    · {event.idempotencyKey.slice(0, 18)}…
                    {payload
                      ? ` · ${payload.reference} · ${payload.amountCents} ${payload.currency}`
                      : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
        <h2 className="text-sm font-semibold text-white">
          Décisions de rapprochement ({decisions.length})
        </h2>
        {decisions.length === 0 ? (
          <p className="mt-3 text-sm text-gray-muted">Aucune décision.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border-subtle">
            {decisions.map((row) => (
              <li key={row.id} className="py-2 text-sm">
                <span className="text-white">{row.status}</span>
                <span className="text-gray-muted">
                  {" "}
                  · score {row.score} ·{" "}
                  {row.decidedAt.toISOString().slice(0, 19)}
                  {row.reviewDueAt
                    ? ` · revue ≤ ${row.reviewDueAt.toISOString().slice(0, 16)}`
                    : ""}
                </span>
                <p className="text-xs text-gray-muted">
                  {Array.isArray(row.reasons)
                    ? row.reasons.map(String).join(", ")
                    : String(row.reasons ?? "")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
