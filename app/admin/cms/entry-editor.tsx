"use client";

import { useActionState } from "react";

import {
  upsertCmsEntryAction,
  type CmsActionState,
} from "@/app/admin/cms/actions";
import type { ContentLocale, ContentStatus } from "@prisma/client";

import { StatusForm } from "@/app/admin/cms/status-form";

const initial: CmsActionState = {};

type EntryEditorProps = {
  pageId: string;
  locale: ContentLocale;
  entry: {
    id: string;
    title: string;
    summary: string;
    body: string;
    status: ContentStatus;
  } | null;
};

export function EntryEditor({ pageId, locale, entry }: EntryEditorProps) {
  const [state, action, pending] = useActionState(upsertCmsEntryAction, initial);

  return (
    <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
          {locale}
        </h2>
        {entry ? <StatusForm kind="entry" id={entry.id} current={entry.status} /> : null}
      </div>
      <form action={action} className="mt-4 space-y-3">
        <input type="hidden" name="pageId" value={pageId} />
        <input type="hidden" name="locale" value={locale} />
        <label className="block text-xs text-gray-muted">
          Titre
          <input
            name="title"
            required
            defaultValue={entry?.title ?? ""}
            className="mt-1 w-full rounded-sm border border-border-subtle bg-surface px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="block text-xs text-gray-muted">
          Résumé
          <textarea
            name="summary"
            rows={2}
            defaultValue={entry?.summary ?? ""}
            className="mt-1 w-full rounded-sm border border-border-subtle bg-surface px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="block text-xs text-gray-muted">
          Corps
          <textarea
            name="body"
            rows={8}
            defaultValue={entry?.body ?? ""}
            className="mt-1 w-full rounded-sm border border-border-subtle bg-surface px-3 py-2 text-sm text-white"
          />
        </label>
        {state.error ? (
          <p className="text-sm text-red-400" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.ok ? (
          <p className="text-sm text-emerald-400" role="status">
            Enregistré.
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm border border-gold/40 px-3 py-1.5 text-xs font-medium text-gold disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </section>
  );
}
