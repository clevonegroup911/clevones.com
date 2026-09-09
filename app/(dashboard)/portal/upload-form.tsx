"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DocumentUploadForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = event.currentTarget;
    const body = new FormData(form);
    const response = await fetch("/api/portal/documents", {
      method: "POST",
      body,
    });
    setPending(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError(payload?.error || "Échec de l'upload.");
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-sm border border-border-subtle bg-surface-elevated p-5"
      encType="multipart/form-data"
    >
      <h2 className="text-sm font-semibold text-white">Upload</h2>
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
          Catégorie
          <select
            name="category"
            className="mt-1 w-full rounded-sm border border-border-subtle bg-surface px-3 py-2 text-sm text-white"
            defaultValue="OTHER"
          >
            <option value="CONTRACT">CONTRACT</option>
            <option value="DELIVERABLE">DELIVERABLE</option>
            <option value="EVIDENCE">EVIDENCE</option>
            <option value="OTHER">OTHER</option>
          </select>
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
      <label className="mt-3 block text-xs text-gray-muted">
        Accès
        <select
          name="accessLevel"
          defaultValue="PRIVATE"
          className="mt-1 w-full rounded-sm border border-border-subtle bg-surface px-3 py-2 text-sm text-white"
        >
          <option value="PRIVATE">PRIVATE</option>
          <option value="INTERNAL">INTERNAL</option>
          <option value="RESTRICTED">RESTRICTED</option>
        </select>
      </label>
      <label className="mt-3 block text-xs text-gray-muted">
        Fichier
        <input
          name="file"
          type="file"
          required
          className="mt-1 block w-full text-sm text-gray-muted"
        />
      </label>
      {error ? (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-sm border border-gold/40 px-3 py-1.5 text-xs font-medium text-gold disabled:opacity-50"
      >
        {pending ? "Upload…" : "Uploader"}
      </button>
    </form>
  );
}
