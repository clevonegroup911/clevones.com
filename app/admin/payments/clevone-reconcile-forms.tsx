"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  paymentId: string;
  invoiceId?: string;
  defaultAmountCents: number;
  defaultCurrency: string;
  defaultReference?: string;
};

export function AdminClevoneReconcileForms({
  paymentId,
  invoiceId,
  defaultAmountCents,
  defaultCurrency,
  defaultReference = "",
}: Props) {
  const router = useRouter();
  const [reference, setReference] = useState(defaultReference);
  const [amountCents, setAmountCents] = useState(String(defaultAmountCents));
  const [currency, setCurrency] = useState(defaultCurrency);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function registerEvent(mismatch: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const amount = mismatch
        ? Math.max(1, Number(amountCents) + 1)
        : Number(amountCents);
      const response = await fetch("/api/admin/payments/clevone-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          invoiceId,
          reference: reference || `SANDBOX-${paymentId.slice(0, 8)}`,
          amountCents: amount,
          currency,
          source: "CLEVONE_SANDBOX",
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        eventKey?: string;
      };
      if (!response.ok) {
        setMessage(payload.error || "Échec enregistrement événement.");
        return;
      }
      setMessage(
        payload.message ||
          `Événement ${payload.eventKey?.slice(0, 12) ?? ""}… enregistré.`,
      );
      router.refresh();
    } catch {
      setMessage("Erreur réseau (événement).");
    } finally {
      setBusy(false);
    }
  }

  async function runReconcile() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/payments/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, invoiceId }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        status?: string;
        reviewDueAt?: string | null;
        allowsCapture?: boolean;
      };
      if (!response.ok) {
        setMessage(payload.error || "Échec reconcile.");
        return;
      }
      setMessage(
        `${payload.message ?? "OK"} · capture=${String(payload.allowsCapture)}` +
          (payload.reviewDueAt
            ? ` · revue ≤ ${payload.reviewDueAt.slice(0, 16)}`
            : ""),
      );
      router.refresh();
    } catch {
      setMessage("Erreur réseau (reconcile).");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
      <h2 className="text-sm font-semibold text-white">
        Événement CLEVONE sandbox + reconcile
      </h2>
      <p className="mt-2 text-xs text-gray-muted">
        Persistance Prisma (`ClevoneGatewayEvent`). Aucun webhook réseau, aucune
        clé PSP. Une preuve client seule ne produit jamais VERIFIED.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-gray-muted">
          Référence
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            className="rounded-sm border border-border-subtle bg-surface px-2 py-1.5 text-sm text-white"
            placeholder="REF-SANDBOX"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-muted">
          Montant (cents)
          <input
            value={amountCents}
            onChange={(event) => setAmountCents(event.target.value)}
            className="rounded-sm border border-border-subtle bg-surface px-2 py-1.5 text-sm text-white"
            inputMode="numeric"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-muted">
          Devise
          <input
            value={currency}
            onChange={(event) => setCurrency(event.target.value.toUpperCase())}
            className="rounded-sm border border-border-subtle bg-surface px-2 py-1.5 text-sm text-white"
            maxLength={8}
          />
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={busy}
          onClick={() => void registerEvent(false)}
          className="rounded-sm border border-gold/40 px-3 py-2 text-xs text-gold disabled:opacity-50"
        >
          Enregistrer événement concordant
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void registerEvent(true)}
          className="rounded-sm border border-border-subtle px-3 py-2 text-xs text-gray-muted hover:text-white disabled:opacity-50"
        >
          Enregistrer mismatch (revue)
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void runReconcile()}
          className="rounded-sm border border-border-subtle px-3 py-2 text-xs text-white disabled:opacity-50"
        >
          Lancer reconcile HTTP
        </button>
      </div>
      {message ? <p className="mt-3 text-xs text-gray-muted">{message}</p> : null}
    </section>
  );
}
