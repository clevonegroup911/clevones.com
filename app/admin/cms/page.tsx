import { createPageMetadata } from "@/lib/metadata";

import Link from "next/link";

import { CreatePageForm } from "@/app/admin/cms/create-page-form";
import { adminRoutes } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listContentPages } from "@/lib/cms/content";

export const metadata = createPageMetadata({
  title: "CMS interne",
  description: "Gestion des contenus administratifs.",
  path: "/admin/cms",
  robots: { index: false, follow: false },
});

export default async function AdminCmsIndexPage() {
  await requireAdmin();
  const pages = await listContentPages();

  return (
    <div className="flex w-full flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-white">CMS</h1>
        <p className="mt-2 text-sm text-gray-muted">
          Pages et entrées FR/EN. Brouillon, publication, archive. Aucun accès USER.
        </p>
      </div>

      <CreatePageForm />

      <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
        <h2 className="text-sm font-semibold text-white">Pages</h2>
        {pages.length === 0 ? (
          <p className="mt-3 text-sm text-gray-muted">Aucune page pour le moment.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border-subtle">
            {pages.map((page) => (
              <li key={page.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link
                    href={`${adminRoutes.cms}/${page.id}`}
                    className="text-sm font-medium text-gold-muted hover:text-gold"
                  >
                    {page.title}
                  </Link>
                  <p className="text-xs text-gray-muted">
                    /{page.slug} · {page.status}
                    {page.entries.length
                      ? ` · ${page.entries.map((entry) => `${entry.locale}:${entry.status}`).join(", ")}`
                      : ""}
                  </p>
                </div>
                <Link
                  href={`${adminRoutes.cms}/${page.id}/preview`}
                  className="text-xs text-gold-muted hover:text-gold"
                >
                  Preview
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
