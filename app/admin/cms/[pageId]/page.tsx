import { createPageMetadata } from "@/lib/metadata";

import Link from "next/link";
import { notFound } from "next/navigation";

import { EntryEditor } from "@/app/admin/cms/entry-editor";
import { StatusForm } from "@/app/admin/cms/status-form";
import { adminRoutes } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth/require-admin";
import { CONTENT_LOCALES, getPageWithEntries } from "@/lib/cms/content";

type PageProps = {
  params: Promise<{ pageId: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { pageId } = await params;
  return createPageMetadata({
    title: `CMS · ${pageId}`,
    description: "Édition de contenu CMS.",
    path: `/admin/cms/${pageId}`,
    robots: { index: false, follow: false },
  });
}

export default async function AdminCmsPageDetail({ params }: PageProps) {
  await requireAdmin();
  const { pageId } = await params;
  const page = await getPageWithEntries(pageId);
  if (!page) {
    notFound();
  }

  return (
    <div className="flex w-full flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-gray-muted">
            <Link href={adminRoutes.cms} className="text-gold-muted hover:text-gold">
              CMS
            </Link>{" "}
            / {page.slug}
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-white">
            {page.title}
          </h1>
          <p className="mt-1 text-sm text-gray-muted">{page.description || "Sans description"}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusForm kind="page" id={page.id} current={page.status} />
          <Link
            href={`${adminRoutes.cms}/${page.id}/preview`}
            className="text-xs text-gold-muted hover:text-gold"
          >
            Preview avant publication
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {CONTENT_LOCALES.map((locale) => {
          const entry = page.entries.find((item) => item.locale === locale);
          return (
            <EntryEditor
              key={locale}
              pageId={page.id}
              locale={locale}
              entry={
                entry
                  ? {
                      id: entry.id,
                      title: entry.title,
                      summary: entry.summary,
                      body: entry.body,
                      status: entry.status,
                    }
                  : null
              }
            />
          );
        })}
      </div>
    </div>
  );
}
