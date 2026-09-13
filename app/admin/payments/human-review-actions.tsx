"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ReviewRow = {
  id: string;
  paymentId: string;
  score: number;
  reviewDueAt: string | null;
  reasons: string;
};

type Props = {
  rows: ReviewRow[];
};

export function HumanReviewActions({ rows }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function resolve(decisionId: string, action: "approve" | "reject") {
    setBusyId(decisionId);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/payments/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionId, action }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        receiptNumber?: string | null;
      };
      if (!response.ok) {
        setMessage(payload.error || "Échec résolution.");
        return;
      }
      setMessage(
        payload.message +
          (payload.receiptNumber ? ` · reçu ${payload.receiptNumber}` : ""),
      );
      router.refresh();
    } catch {
      setMessage("Erreur réseau.");
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="mt-3 text-sm text-gray-muted">Aucune décision en revue.</p>
    );
  }

  return (
    <div className="mt-3">
      <ul className="divide-y divide-border-subtle">
        {rows.map((row) => (
          <li key={row.id} className="py-3 text-sm">
            <p className="text-white">
              {row.paymentId} · score {row.score}
            </p>
            <p className="text-gray-muted">
              échéance indicative {row.reviewDueAt ?? "n/a"}
            </p>
            <p className="text-xs text-gray-muted">{row.reasons}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === row.id}
                onClick={() => void resolve(row.id, "approve")}
                className="rounded-sm border border-gold/40 px-3 py-1.5 text-xs text-gold disabled:opacity-50"
              >
                Approuver (VERIFIED + activation)
              </button>
              <button
                type="button"
                disabled={busyId === row.id}
                onClick={() => void resolve(row.id, "reject")}
                className="rounded-sm border border-border-subtle px-3 py-1.5 text-xs text-gray-muted hover:text-white disabled:opacity-50"
              >
                Rejeter (REJECTED)
              </button>
            </div>
          </li>
        ))}
      </ul>
      {message ? <p className="mt-3 text-xs text-gray-muted">{message}</p> : null}
    </div>
  );
}
