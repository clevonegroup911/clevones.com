import type { PaymentsClient } from "@/lib/payments/catalog";
import type {
  ClevoneOfficialEvent,
  PaymentProofRecord,
  ReconciliationDecisionRecord,
} from "@/lib/payments/reconciliation";

/** Deterministic reference normalization used across reconcile + claims. */
export function normalizePaymentReference(value?: string | null): string {
  return value?.trim().toUpperCase() ?? "";
}

export class ReferenceClaimConflictError extends Error {
  readonly normalizedReference: string;
  readonly existingPaymentId: string;

  constructor(normalizedReference: string, existingPaymentId: string) {
    super("reference_already_verified");
    this.name = "ReferenceClaimConflictError";
    this.normalizedReference = normalizedReference;
    this.existingPaymentId = existingPaymentId;
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = (error as { code?: string }).code;
  return code === "P2002";
}

export function collectSignificantReferences(input: {
  decision: ReconciliationDecisionRecord;
  events?: ClevoneOfficialEvent[];
  proofs?: PaymentProofRecord[];
}): string[] {
  const refs = new Set<string>();
  const events = input.events ?? [];
  const proofs = input.proofs ?? [];

  if (input.decision.matchedEventKey) {
    const matched = events.find(
      (event) => event.eventKey === input.decision.matchedEventKey,
    );
    const normalized = normalizePaymentReference(matched?.reference);
    if (normalized) {
      refs.add(normalized);
    }
  }

  if (input.decision.clientProofId) {
    const proof = proofs.find((row) => row.id === input.decision.clientProofId);
    const normalized = normalizePaymentReference(proof?.reference);
    if (normalized) {
      refs.add(normalized);
    }
  }

  return [...refs];
}

/**
 * Atomically claim verified references globally.
 * Same payment → idempotent. Other payment → ReferenceClaimConflictError.
 */
export async function claimVerifiedReferences(
  input: {
    references: string[];
    paymentId: string;
    decisionId: string;
    eventKey?: string;
  },
  client: PaymentsClient,
): Promise<"claimed" | "idempotent"> {
  const normalizedRefs = [
    ...new Set(
      input.references
        .map((value) => normalizePaymentReference(value))
        .filter(Boolean),
    ),
  ];
  if (normalizedRefs.length === 0) {
    return "idempotent";
  }

  let created = 0;
  for (const normalizedReference of normalizedRefs) {
    const existing = await client.verifiedPaymentReferenceClaim.findUnique({
      where: { normalizedReference },
    });
    if (existing) {
      if (existing.paymentId === input.paymentId) {
        continue;
      }
      throw new ReferenceClaimConflictError(
        normalizedReference,
        existing.paymentId,
      );
    }

    try {
      await client.verifiedPaymentReferenceClaim.create({
        data: {
          normalizedReference,
          paymentId: input.paymentId,
          decisionId: input.decisionId,
          eventKey: input.eventKey,
        },
      });
      created += 1;
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
      const raced = await client.verifiedPaymentReferenceClaim.findUnique({
        where: { normalizedReference },
      });
      if (raced && raced.paymentId === input.paymentId) {
        continue;
      }
      throw new ReferenceClaimConflictError(
        normalizedReference,
        raced?.paymentId ?? "unknown",
      );
    }
  }

  return created > 0 ? "claimed" : "idempotent";
}

export async function listClaimedNormalizedReferences(
  client: PaymentsClient,
): Promise<string[]> {
  const rows = await client.verifiedPaymentReferenceClaim.findMany({
    select: { normalizedReference: true },
  });
  return rows.map((row) => row.normalizedReference);
}

export function decisionAsDuplicateSuspect(
  decision: ReconciliationDecisionRecord,
  reason = "reference_already_verified",
): ReconciliationDecisionRecord {
  const ts = new Date().toISOString();
  return {
    ...decision,
    status: "DUPLICATE_SUSPECTED",
    score: 0,
    reasons: [...new Set([...decision.reasons, reason])],
    reviewDueAt: undefined,
    decidedAt: ts,
  };
}
