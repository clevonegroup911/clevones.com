import { createPageMetadata } from "@/lib/metadata";

import { getAnalyticsDashboardSnapshot } from "@/lib/analytics";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata = createPageMetadata({
  title: "Analytics first-party",
  description: "Aggregated first-party server analytics for administrators.",
  path: "/admin/analytics",
  robots: { index: false, follow: false },
});

function CountTable({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; count: number }[];
}) {
  return (
    <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-gray-muted">Aucune donnée sur la fenêtre.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border-subtle">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="truncate text-gray-muted">{row.key}</span>
              <span className="font-medium text-white">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const snapshot = await getAnalyticsDashboardSnapshot(7);

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-white">
          Analytics first-party
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-pretty text-gray-muted">
          Compteurs serveur agrégés sur {snapshot.windowDays} jours. Aucun tracker
          tiers, aucune IP, aucun e-mail, aucun identifiant utilisateur. Les
          chemins sont normalisés (requêtes et identifiants retirés).
        </p>
      </div>

      <div className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
        <p className="text-sm text-gray-muted">Événements depuis</p>
        <p className="mt-1 font-heading text-3xl font-semibold text-white">
          {snapshot.total}
        </p>
        <p className="mt-2 text-xs text-gray-muted">
          Fenêtre UTC {snapshot.since.slice(0, 10)} → aujourd’hui
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CountTable title="Par catégorie" rows={snapshot.byCategory} />
        <CountTable title="Par événement" rows={snapshot.byName} />
        <CountTable title="Par type d’acteur" rows={snapshot.byActorKind} />
        <CountTable title="Par jour" rows={snapshot.byDay} />
      </div>

      <CountTable title="Chemins les plus vus" rows={snapshot.topPaths} />
    </div>
  );
}
