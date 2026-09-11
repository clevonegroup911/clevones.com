"use client";

import { useActionState } from "react";

import {
  createCmsPageAction,
  type CmsActionState,
} from "@/app/admin/cms/actions";

const initial: CmsActionState = {};

export function CreatePageForm() {
  const [state, action, pending] = useActionState(createCmsPageAction, initial);

  return (
    <form
      action={action}
      className="rounded-sm border border-border-subtle bg-surface-elevated p-5"
    >
      <h2 className="text-sm font-semibold text-white">Nouvelle page</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-gray-muted">
          Titre
          <input
            name="title"
            required
            className="mt-1 w-full rounded-sm border border-border-subtle bg-surface px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="block text-xs text-gray-muted">
          Slug (optionnel)
          <input
            name="slug"
            placeholder="auto depuis le titre"
            className="mt-1 w-full rounded-sm border border-border-subtle bg-surface px-3 py-2 text-sm text-white"
          />
        </label>
      </div>
      <label className="mt-3 block text-xs text-gray-muted">
        Description
        <textarea
          name="description"
          rows={2}
          className="mt-1 w-full rounded-sm border border-border-subtle bg-surface px-3 py-2 text-sm text-white"
        />
      </label>
      {state.error ? (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-sm border border-gold/40 px-3 py-1.5 text-xs font-medium text-gold disabled:opacity-50"
      >
        {pending ? "Création…" : "Créer"}
      </button>
    </form>
  );
}
