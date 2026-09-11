import type {
  PaymentEventSource,
  PaymentVerificationStatus,
} from "@/lib/payments/types";

export type PaymentEvidence = {
  source: PaymentEventSource;
  reference?: string;
  amountCents?: number;
  currency?: string;
  invoiceRef?: string;
  payerRef?: string;
  beneficiaryRef?: string;
  occurredAt?: string;
  authenticated: boolean;
};

export type ReconciliationInput = {
  clientEvidence: PaymentEvidence;
  systemEvents: PaymentEvidence[];
  previouslyVerifiedReferences?: string[];
};

export type ReconciliationResult = {
  status: PaymentVerificationStatus;
  score: number;
  reasons: string[];
  matchedEventSource?: PaymentEventSource;
};

function normalize(value?: string): string {
  return value?.trim().toUpperCase() ?? "";
}

function exactMatch(a?: string, b?: string): boolean {
  return Boolean(a && b && normalize(a) === normalize(b));
}

function sameAmount(a?: number, b?: number): boolean {
  return Number.isInteger(a) && Number.isInteger(b) && a === b;
}

function sameCurrency(a?: string, b?: string): boolean {
  return exactMatch(a, b);
}

function isDuplicate(reference: string | undefined, verified: string[]): boolean {
  if (!reference) return false;
  const normalized = normalize(reference);
  return verified.some((item) => normalize(item) === normalized);
}

function evaluateCandidate(client: PaymentEvidence, event: PaymentEvidence) {
  const reasons: string[] = [];
  let score = 0;

  if (!event.authenticated) {
    return { score: 0, reasons: ["system_event_not_authenticated"], hardConflict: false };
  }

  if (client.reference && event.reference) {
    if (exactMatch(client.reference, event.reference)) {
      score += 50;
      reasons.push("reference_match");
    } else {
      reasons.push("reference_mismatch");
      return { score, reasons, hardConflict: true };
    }
  }

  if (client.amountCents !== undefined && event.amountCents !== undefined) {
    if (sameAmount(client.amountCents, event.amountCents)) {
      score += 25;
      reasons.push("amount_match");
    } else {
      reasons.push("amount_mismatch");
      return { score, reasons, hardConflict: true };
    }
  }

  if (client.currency && event.currency) {
    if (sameCurrency(client.currency, event.currency)) {
      score += 15;
      reasons.push("currency_match");
    } else {
      reasons.push("currency_mismatch");
      return { score, reasons, hardConflict: true };
    }
  }

  if (client.invoiceRef && event.invoiceRef) {
    if (exactMatch(client.invoiceRef, event.invoiceRef)) {
      score += 10;
      reasons.push("invoice_match");
    } else {
      reasons.push("invoice_mismatch");
      return { score, reasons, hardConflict: true };
    }
  }

  if (client.payerRef && event.payerRef && exactMatch(client.payerRef, event.payerRef)) {
    score += 5;
    reasons.push("payer_match");
  }

  if (
    client.beneficiaryRef &&
    event.beneficiaryRef &&
    exactMatch(client.beneficiaryRef, event.beneficiaryRef)
  ) {
    score += 5;
    reasons.push("beneficiary_match");
  }

  return { score, reasons, hardConflict: false };
}

/**
 * Deterministic reconciliation policy for the CLEVONE payment gateway.
 *
 * Security invariants:
 * - client evidence alone never becomes VERIFIED;
 * - at least one authenticated CLEVONE-side event is required;
 * - duplicate verified references are blocked;
 * - explicit amount/currency/reference/invoice conflicts require human review.
 */
export function reconcilePayment(input: ReconciliationInput): ReconciliationResult {
  const client = input.clientEvidence;
  const verifiedReferences = input.previouslyVerifiedReferences ?? [];

  if (isDuplicate(client.reference, verifiedReferences)) {
    return {
      status: "DUPLICATE_SUSPECTED",
      score: 0,
      reasons: ["reference_already_verified"],
    };
  }

  const authenticatedEvents = input.systemEvents.filter((event) => event.authenticated);
  if (authenticatedEvents.length === 0) {
    return {
      status: "PENDING_VERIFICATION",
      score: 0,
      reasons: ["no_authenticated_system_event"],
    };
  }

  const candidates = authenticatedEvents.map((event) => ({
    event,
    ...evaluateCandidate(client, event),
  }));

  const exactReferenceConflicts = candidates.filter(
    (candidate) =>
      client.reference &&
      candidate.event.reference &&
      !exactMatch(client.reference, candidate.event.reference),
  );

  const best = candidates.sort((a, b) => b.score - a.score)[0];

  if (!best) {
    return {
      status: "PENDING_VERIFICATION",
      score: 0,
      reasons: ["no_candidate_event"],
    };
  }

  if (best.hardConflict) {
    return {
      status: "REVIEW_REQUIRED",
      score: best.score,
      reasons: best.reasons,
      matchedEventSource: best.event.source,
    };
  }

  // Reference + amount + currency is the minimum high-confidence automatic path.
  const hasRequiredMatches =
    best.reasons.includes("reference_match") &&
    best.reasons.includes("amount_match") &&
    best.reasons.includes("currency_match");

  if (hasRequiredMatches && best.score >= 90) {
    return {
      status: "VERIFIED",
      score: best.score,
      reasons: best.reasons,
      matchedEventSource: best.event.source,
    };
  }

  if (best.score >= 75) {
    return {
      status: "MATCHED",
      score: best.score,
      reasons: best.reasons,
      matchedEventSource: best.event.source,
    };
  }

  if (exactReferenceConflicts.length === candidates.length && client.reference) {
    return {
      status: "REVIEW_REQUIRED",
      score: best.score,
      reasons: best.reasons.length ? best.reasons : ["reference_not_found"],
      matchedEventSource: best.event.source,
    };
  }

  return {
    status: "PENDING_VERIFICATION",
    score: best.score,
    reasons: best.reasons.length ? best.reasons : ["insufficient_match"],
    matchedEventSource: best.event.source,
  };
}
