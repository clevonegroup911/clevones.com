import { createPageMetadata } from "@/lib/metadata";

import Link from "next/link";
import { notFound } from "next/navigation";

import { adminRoutes } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth/require-admin";
import { CONTENT_LOCALES, previewPage } from "@/lib/cms/content";

type PageProps = {
  params: Promise<{ pageId: string }>;
  searchParams: Promise<{ locale?: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { pageId } = await params;
  return createPageMetadata({
    title: `Preview CMS · ${pageId}`,
    description: "Prévisualisation CMS avant publication.",
    path: `/admin/cms/${pageId}/preview`,
    robots: { index: false, follow: false },
  });
}

export default async function AdminCmsPreviewPage({ params, searchParams }: PageProps) {
  await requireAdmin();
  const { pageId } = await params;
  const query = await searchParams;
  const locale =
    query.locale === "en" || query.locale === "fr" ? query.locale : "fr";

  const { getPageWithEntries } = await import("@/lib/cms/content");
  const page = await getPageWithEntries(pageId);
  if (!page) {
    notFound();
  }

  const preview = await previewPage(page.slug, locale);

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-muted">
            <Link href={`${adminRoutes.cms}/${page.id}`} className="text-gold-muted hover:text-gold">
              Retour édition
            </Link>
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-white">
            Preview · {page.title}
          </h1>
          <p className="mt-1 text-sm text-gray-muted">
            Statut page : {page.status}. Les brouillons sont visibles ici pour les admins.
          </p>
        </div>
        <div className="flex gap-2">
          {CONTENT_LOCALES.map((item) => (
            <Link
              key={item}
              href={`${adminRoutes.cms}/${page.id}/preview?locale=${item}`}
              className={`rounded-sm border px-2 py-1 text-xs ${
                item === locale
                  ? "border-gold text-gold"
                  : "border-border-subtle text-gold-muted"
              }`}
            >
              {item.toUpperCase()}
            </Link>
          ))}
        </div>
      </div>

      <article className="rounded-sm border border-border-subtle bg-surface-elevated p-6">
        {preview?.entry ? (
          <>
            <p className="text-xs uppercase tracking-wide text-gray-muted">
              {locale} · {preview.entry.status}
            </p>
            <h2 className="mt-2 font-heading text-xl text-white">{preview.entry.title}</h2>
            {preview.entry.summary ? (
              <p className="mt-3 text-sm text-gray-muted">{preview.entry.summary}</p>
            ) : null}
            <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-gray-muted">
              {preview.entry.body || "Corps vide."}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-muted">
            Aucune entrée {locale} pour cette page. Enregistrez d’abord le contenu.
          </p>
        )}
      </article>
    </div>
  );
}
