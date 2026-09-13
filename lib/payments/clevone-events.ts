/**
 * Événements CLEVONE de rapprochement persistés via le modèle Prisma
 * `ClevoneGatewayEvent` (réutilisation documentée — pas de modèle additif T030).
 *
 * Payload JSON :
 * { reference, amountCents, currency, source, authenticated: true }
 */

export const RECONCILE_EVENT_TYPES = [
  "RECONCILE_CLEVONE_SANDBOX",
  "RECONCILE_CLEVONE_OFFICIAL",
] as const;

export type ReconcileClevoneEventType = (typeof RECONCILE_EVENT_TYPES)[number];

export function isReconcileClevoneEventType(
  value: string,
): value is ReconcileClevoneEventType {
  return (RECONCILE_EVENT_TYPES as readonly string[]).includes(value);
}

export function reconcileEventTypeForSource(
  source: "CLEVONE_SANDBOX" | "CLEVONE_OFFICIAL",
): ReconcileClevoneEventType {
  return source === "CLEVONE_OFFICIAL"
    ? "RECONCILE_CLEVONE_OFFICIAL"
    : "RECONCILE_CLEVONE_SANDBOX";
}

export function sourceFromReconcileEventType(
  eventType: ReconcileClevoneEventType,
): "CLEVONE_SANDBOX" | "CLEVONE_OFFICIAL" {
  return eventType === "RECONCILE_CLEVONE_OFFICIAL"
    ? "CLEVONE_OFFICIAL"
    : "CLEVONE_SANDBOX";
}

export type ClevoneReconcilePayload = {
  reference: string;
  amountCents: number;
  currency: string;
  source: "CLEVONE_SANDBOX" | "CLEVONE_OFFICIAL";
  authenticated: true;
};

export function parseClevoneReconcilePayload(
  raw: unknown,
): ClevoneReconcilePayload | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const reference = typeof row.reference === "string" ? row.reference : null;
  const amountCents =
    typeof row.amountCents === "number" && Number.isInteger(row.amountCents)
      ? row.amountCents
      : null;
  const currency = typeof row.currency === "string" ? row.currency : null;
  const source =
    row.source === "CLEVONE_SANDBOX" || row.source === "CLEVONE_OFFICIAL"
      ? row.source
      : null;
  if (
    !reference ||
    amountCents === null ||
    amountCents <= 0 ||
    !currency ||
    !source ||
    row.authenticated !== true
  ) {
    return null;
  }
  return {
    reference,
    amountCents,
    currency: currency.toUpperCase(),
    source,
    authenticated: true,
  };
}
