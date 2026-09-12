import { createPageMetadata } from "@/lib/metadata";

import Link from "next/link";

import { adminRoutes } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessAdminPayments } from "@/lib/payments/access";
import {
  listAdminPaymentChains,
  listHumanReviewDecisions,
  listRecentReconciliationDecisions,
} from "@/lib/payments/catalog";

export const metadata = createPageMetadata({
  title: "Paiements gateway",
  description: "Console admin CLEVONE Payment Gateway (sandbox).",
  path: "/admin/payments",
  robots: { index: false, follow: false },
});

export default async function AdminPaymentsPage() {
  const actor = await requireAdmin();
  if (!canAccessAdminPayments(actor.role)) {
    return (
      <div className="px-4 py-10 text-sm text-gray-muted">
        Accès réservé SUPER_ADMIN / ADMIN.
      </div>
    );
  }

  const [orders, humanReview, decisions] = await Promise.all([
    listAdminPaymentChains(),
    listHumanReviewDecisions(),
    listRecentReconciliationDecisions(),
  ]);

  return (
    <div className="flex w-full flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs text-gray-muted">
          <Link href={adminRoutes.dashboard} className="text-gold-muted hover:text-gold">
            Dashboard
          </Link>
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold text-white">
          Paiements gateway
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-muted">
          Sandbox uniquement — factures, paiements, décisions de rapprochement et
          file HUMAN_REVIEW. Aucun rail PSP réel.
        </p>
      </div>

      <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
        <h2 className="text-sm font-semibold text-white">
          File HUMAN_REVIEW ({humanReview.length})
        </h2>
        {humanReview.length === 0 ? (
          <p className="mt-3 text-sm text-gray-muted">Aucune décision en revue.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border-subtle">
            {humanReview.map((row) => (
              <li key={row.id} className="py-3 text-sm">
                <p className="text-white">
                  {row.paymentId} · score {row.score}
                </p>
                <p className="text-gray-muted">
                  échéance indicative{" "}
                  {row.reviewDueAt
                    ? row.reviewDueAt.toISOString().slice(0, 16)
                    : "n/a"}
                </p>
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

      <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
        <h2 className="text-sm font-semibold text-white">
          Commandes / factures ({orders.length})
        </h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-gray-muted">
            Aucune commande en base (migration CI/local ; sandbox mémoire possible
            hors UI).
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border-subtle">
            {orders.map((order) => {
              const invoice = order.invoices[0];
              return (
                <li key={order.id} className="py-3 text-sm">
                  <p className="text-white">
                    {order.serviceCode} — {order.title}{" "}
                    <span className="text-gray-muted">({order.status})</span>
                  </p>
                  <p className="text-gray-muted">
                    {order.amountCents} {order.currency}
                    {invoice
                      ? ` · facture ${invoice.invoiceNumber} (${invoice.status})`
                      : ""}
                    {invoice?.payment
                      ? ` · paiement ${invoice.payment.status}`
                      : ""}
                    {invoice?.receipt
                      ? ` · reçu ${invoice.receipt.receiptNumber}`
                      : ""}
                  </p>
                  <Link
                    href={`/admin/payments/${order.id}`}
                    className="text-xs text-gold-muted hover:text-gold"
                  >
                    Détail
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
        <h2 className="text-sm font-semibold text-white">
          Audit décisions récentes ({decisions.length})
        </h2>
        {decisions.length === 0 ? (
          <p className="mt-3 text-sm text-gray-muted">Aucune décision enregistrée.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border-subtle">
            {decisions.map((row) => (
              <li key={row.id} className="py-2 text-sm">
                <span className="text-white">{row.status}</span>
                <span className="text-gray-muted">
                  {" "}
                  · {row.paymentId} · {row.decidedAt.toISOString().slice(0, 19)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
