import { createPageMetadata } from "@/lib/metadata";

import Link from "next/link";
import { notFound } from "next/navigation";

import { adminRoutes } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import { canAccessAdminPayments } from "@/lib/payments/access";

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
  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: {
      invoices: {
        include: { payment: true, receipt: true },
      },
    },
  });
  if (!order) {
    notFound();
  }
  const invoice = order.invoices[0];

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
    </div>
  );
}
