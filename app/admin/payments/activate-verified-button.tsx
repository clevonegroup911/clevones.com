"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  paymentId: string;
  decisionId?: string;
  canActivate: boolean;
};

export function ActivateVerifiedButton({
  paymentId,
  decisionId,
  canActivate,
}: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!canActivate) {
    return null;
  }

  async function activate() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/payments/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, decisionId }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        receiptNumber?: string | null;
        orderStatus?: string;
      };
      if (!response.ok) {
        setMessage(payload.error || "Échec activation.");
        return;
      }
      setMessage(
        `${payload.message ?? "OK"} · ${payload.orderStatus ?? ""}` +
          (payload.receiptNumber ? ` · ${payload.receiptNumber}` : ""),
      );
      router.refresh();
    } catch {
      setMessage("Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => void activate()}
        className="rounded-sm border border-gold/40 px-3 py-2 text-xs text-gold disabled:opacity-50"
      >
        Activer après VERIFIED (gateway)
      </button>
      {message ? <p className="mt-2 text-xs text-gray-muted">{message}</p> : null}
    </div>
  );
}
