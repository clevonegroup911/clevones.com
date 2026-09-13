"use client";

import { useState } from "react";

type Props = {
  paymentId: string;
  invoiceId: string;
};

export function ProofUploadForm({ paymentId, invoiceId }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("paymentId", paymentId);
    data.set("invoiceId", invoiceId);
    try {
      const response = await fetch("/api/portal/payments/proof", {
        method: "POST",
        body: data,
      });
      const payload = (await response.json()) as {
        error?: string;
        status?: string;
        message?: string;
      };
      if (!response.ok) {
        setMessage(payload.error || "Échec upload.");
        return;
      }
      setMessage(
        payload.message ||
          `Preuve enregistrée — décision ${payload.status || "PENDING"} (pas de validation auto).`,
      );
      form.reset();
    } catch {
      setMessage("Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1 text-xs text-gray-muted">
        Preuve (fichier)
        <input
          name="file"
          type="file"
          required
          className="text-sm text-white"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-gray-muted">
        Référence
        <input
          name="reference"
          className="rounded-sm border border-border-subtle bg-surface px-2 py-1 text-sm text-white"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded-sm border border-gold/40 px-3 py-2 text-xs text-gold disabled:opacity-50"
      >
        Envoyer preuve
      </button>
      {message ? <p className="basis-full text-xs text-gray-muted">{message}</p> : null}
    </form>
  );
}
