import { createPageMetadata } from "@/lib/metadata";

import Link from "next/link";

import { DocumentUploadForm } from "@/app/(dashboard)/portal/upload-form";
import { SoftDeleteButton } from "@/app/(dashboard)/portal/soft-delete-button";
import { requirePortalActor } from "@/lib/auth/require-portal";
import { listDocumentsForActor } from "@/lib/documents/service";

export const metadata = createPageMetadata({
  title: "Client portal",
  description: "Authenticated private document portal for Clevones partners.",
  path: "/portal",
  robots: { index: false, follow: false },
});

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function PortalPage({ searchParams }: PageProps) {
  const actor = await requirePortalActor();
  const query = (await searchParams).q?.trim() || "";
  const documents = await listDocumentsForActor(
    { id: actor.id, role: actor.role },
    { query },
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-white">
          Portail documents
        </h1>
        <p className="mt-2 text-sm text-gray-muted">
          Espace authentifié ({actor.firstName}). Stockage privé hors{" "}
          <code className="text-gold-muted">public/</code>.{" "}
          <Link href="/portal/payments" className="text-gold-muted hover:text-gold">
            Mes paiements
          </Link>
          {" · "}
          <Link href="/sign-out" className="text-gold-muted hover:text-gold">
            Déconnexion
          </Link>
        </p>
      </div>

      <DocumentUploadForm />

      <form className="flex gap-2" method="get">
        <input
          name="q"
          defaultValue={query}
          placeholder="Rechercher titre, fichier, description"
          className="w-full rounded-sm border border-border-subtle bg-surface px-3 py-2 text-sm text-white"
        />
        <button
          type="submit"
          className="rounded-sm border border-gold/40 px-3 py-2 text-xs text-gold"
        >
          Chercher
        </button>
      </form>

      <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
        <h2 className="text-sm font-semibold text-white">Documents</h2>
        {documents.length === 0 ? (
          <p className="mt-3 text-sm text-gray-muted">Aucun document.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border-subtle">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{doc.title}</p>
                  <p className="text-xs text-gray-muted">
                    {doc.fileName} · {doc.category} · {doc.accessLevel} ·{" "}
                    {doc.sizeBytes} o
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/api/portal/documents/${doc.id}`}
                    className="text-xs text-gold-muted hover:text-gold"
                  >
                    Télécharger
                  </Link>
                  <SoftDeleteButton documentId={doc.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
