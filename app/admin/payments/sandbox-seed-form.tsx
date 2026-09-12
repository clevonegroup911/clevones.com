"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SandboxSeedForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createDemo(settle: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/payments/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: settle
            ? "Démo gateway acquittée"
            : "Démo gateway en attente",
          settle,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        orderId?: string;
      };
      if (!response.ok) {
        setMessage(payload.error || "Échec création sandbox.");
        return;
      }
      setMessage(payload.message || "Chaîne créée.");
      router.refresh();
    } catch {
      setMessage("Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button
        type="button"
        disabled={busy}
        onClick={() => void createDemo(false)}
        className="rounded-sm border border-gold/40 px-3 py-2 text-xs text-gold disabled:opacity-50"
      >
        Créer démo (attente)
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => void createDemo(true)}
        className="rounded-sm border border-border-subtle px-3 py-2 text-xs text-gray-muted hover:text-white disabled:opacity-50"
      >
        Créer démo acquittée
      </button>
      {message ? <p className="text-xs text-gray-muted">{message}</p> : null}
    </div>
  );
}
