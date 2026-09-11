import { createPageMetadata } from "@/lib/metadata";

import Link from "next/link";

import { getAnalyticsDashboard, summarizeTotals } from "@/lib/analytics/track";
import { adminRoutes } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata = createPageMetadata({
  title: "Analytics first-party",
  description: "Privacy-preserving first-party analytics dashboard.",
  path: "/admin/analytics",
  robots: { index: false, follow: false },
});

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const dashboard = await getAnalyticsDashboard(30);
  const summary = summarizeTotals(dashboard.totals);

  return (
    <div className="flex w-full flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs text-gray-muted">
          <Link href={adminRoutes.dashboard} className="text-gold-muted hover:text-gold">
            Dashboard
          </Link>
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold text-white">
          Analytics first-party
        </h1>
        <p className="mt-2 text-sm text-gray-muted">
          Compteurs serveur sans tracker tiers. Aucune IP / user-agent stockés dans
          AnalyticsEvent. Fenêtre : 30 jours depuis {dashboard.since.slice(0, 10)}.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Vues pages", summary.visitorsProxy],
          ["Formulaires", summary.forms],
          ["Connexions admin", summary.adminLogins],
          ["Documents", summary.documents],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-sm border border-border-subtle bg-surface-elevated p-4"
          >
            <p className="text-xs text-gray-muted">{label}</p>
            <p className="mt-2 font-heading text-2xl text-white">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
        <h2 className="text-sm font-semibold text-white">Pages les plus vues</h2>
        {dashboard.topPages.length === 0 ? (
          <p className="mt-3 text-sm text-gray-muted">Aucune vue enregistrée.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border-subtle">
            {dashboard.topPages.map((row) => (
              <li key={row.path} className="flex justify-between py-2 text-sm">
                <span className="text-gray-muted">{row.path || "/"}</span>
                <span className="text-white">{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
        <h2 className="text-sm font-semibold text-white">Événements récents</h2>
        {dashboard.recent.length === 0 ? (
          <p className="mt-3 text-sm text-gray-muted">Aucun événement.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border-subtle">
            {dashboard.recent.map((event) => (
              <li key={event.id} className="py-2 text-sm">
                <p className="text-white">
                  {event.name}
                  {event.label ? ` · ${event.label}` : ""}
                </p>
                <p className="text-xs text-gray-muted">
                  {event.path || "—"} · {event.createdAt}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
