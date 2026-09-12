import { createPageMetadata } from "@/lib/metadata";

import Link from "next/link";

import { ProofUploadForm } from "@/app/(dashboard)/portal/payments/proof-upload-form";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canAccessClientPayments } from "@/lib/payments/access";
import { listClientOrdersForUser } from "@/lib/payments/catalog";
import { platformRoutes } from "@/lib/auth/routes";

export const metadata = createPageMetadata({
  title: "Mes paiements",
  description: "État facture/paiement et reçu client (sandbox).",
  path: "/portal/payments",
  robots: { index: false, follow: false },
});

export default async function PortalPaymentsPage() {
  const actor = await requireAdmin();
  if (!canAccessClientPayments(actor.role)) {
    return (
      <div className="px-4 py-10 text-sm text-gray-muted">Non autorisé.</div>
    );
  }

  const orders = await listClientOrdersForUser(actor.id);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div>
        <p className="text-xs text-gray-muted">
          <Link href={platformRoutes.portal} className="text-gold-muted hover:text-gold">
            Portail
          </Link>
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold text-white">
          Mes paiements
        </h1>
        <p className="mt-2 text-sm text-gray-muted">
          Statut de vos factures et reçus. L’upload d’une preuve seule ne valide
          jamais le paiement.
        </p>
      </div>

      <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
        <h2 className="text-sm font-semibold text-white">Commandes</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-gray-muted">
            Aucune commande liée à votre compte pour le moment.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border-subtle">
            {orders.map((order) => {
              const invoice = order.invoices[0];
              return (
                <li key={order.id} className="py-3 text-sm">
                  <p className="text-white">
                    {order.title}{" "}
                    <span className="text-gray-muted">({order.status})</span>
                  </p>
                  <p className="text-gray-muted">
                    {invoice
                      ? `Facture ${invoice.invoiceNumber} · ${invoice.status}`
                      : "Pas de facture"}
                    {invoice?.payment ? ` · paiement ${invoice.payment.status}` : ""}
                    {invoice?.receipt
                      ? ` · reçu ${invoice.receipt.receiptNumber}`
                      : ""}
                  </p>
                  {invoice?.payment ? (
                    <div className="mt-3">
                      <ProofUploadForm
                        paymentId={invoice.payment.id}
                        invoiceId={invoice.id}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
