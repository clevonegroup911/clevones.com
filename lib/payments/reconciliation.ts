import { randomUUID } from "node:crypto";

import {
  buildStorageKey,
  PAYMENT_PROOF_ROOT,
  putPrivateObject,
  type StoredObject,
} from "@/lib/documents/storage";

export type PaymentProofSource =
  | "CLIENT_UPLOAD"
  | "CLEVONE_SANDBOX"
  | "CLEVONE_OFFICIAL";

export type ReconciliationStatus =
  | "PENDING"
  | "MATCHED"
  | "VERIFIED"
  | "HUMAN_REVIEW"
  | "DUPLICATE_SUSPECTED"
  | "REJECTED";

export type PaymentProofRecord = {
  id: string;
  paymentId: string;
  invoiceId?: string;
  source: PaymentProofSource;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  reference?: string;
  amountCents?: number;
  currency?: string;
  authenticated: boolean;
  createdAt: string;
};

export type ReconciliationDecisionRecord = {
  id: string;
  paymentId: string;
  invoiceId?: string;
  status: ReconciliationStatus;
  score: number;
  reasons: string[];
  idempotencyKey: string;
  clientProofId?: string;
  matchedEventKey?: string;
  reviewDueAt?: string;
  decidedAt: string;
  createdAt: string;
};

export type ClevoneOfficialEvent = {
  eventKey: string;
  paymentId: string;
  invoiceId?: string;
  reference: string;
  amountCents: number;
  currency: string;
  authenticated: true;
  source: "CLEVONE_SANDBOX" | "CLEVONE_OFFICIAL";
};

export type ReconciliationAuditEntry = {
  at: string;
  action: string;
  entityType: string;
  entityId: string;
  detail: string;
};

type Store = {
  proofs: Map<string, PaymentProofRecord>;
  decisions: Map<string, ReconciliationDecisionRecord>;
  decisionsByIdempotency: Map<string, string>;
  verifiedReferences: Set<string>;
  officialEvents: Map<string, ClevoneOfficialEvent>;
  audit: ReconciliationAuditEntry[];
};

const HUMAN_REVIEW_MS = 24 * 60 * 60 * 1000;

function now(): string {
  return new Date().toISOString();
}

function normalize(value?: string): string {
  return value?.trim().toUpperCase() ?? "";
}

function createStore(): Store {
  return {
    proofs: new Map(),
    decisions: new Map(),
    decisionsByIdempotency: new Map(),
    verifiedReferences: new Set(),
    officialEvents: new Map(),
    audit: [],
  };
}

function pushAudit(
  store: Store,
  action: string,
  entityType: string,
  entityId: string,
  detail: string,
): void {
  store.audit.push({ at: now(), action, entityType, entityId, detail });
}

function evaluateMatch(
  proof: PaymentProofRecord,
  event: ClevoneOfficialEvent,
): { score: number; reasons: string[]; hardConflict: boolean } {
  const reasons: string[] = [];
  let score = 0;

  if (proof.reference && event.reference) {
    if (normalize(proof.reference) === normalize(event.reference)) {
      score += 50;
      reasons.push("reference_match");
    } else {
      reasons.push("reference_mismatch");
      return { score, reasons, hardConflict: true };
    }
  }

  if (proof.amountCents !== undefined && event.amountCents !== undefined) {
    if (proof.amountCents === event.amountCents) {
      score += 25;
      reasons.push("amount_match");
    } else {
      reasons.push("amount_mismatch");
      return { score, reasons, hardConflict: true };
    }
  }

  if (proof.currency && event.currency) {
    if (normalize(proof.currency) === normalize(event.currency)) {
      score += 15;
      reasons.push("currency_match");
    } else {
      reasons.push("currency_mismatch");
      return { score, reasons, hardConflict: true };
    }
  }

  if (proof.invoiceId && event.invoiceId) {
    if (proof.invoiceId === event.invoiceId) {
      score += 10;
      reasons.push("invoice_match");
    } else {
      reasons.push("invoice_mismatch");
      return { score, reasons, hardConflict: true };
    }
  }

  return { score, reasons, hardConflict: false };
}

/**
 * Rapprochement CLEVONE (sandbox).
 * Invariants:
 * - une preuve client seule ne produit jamais VERIFIED / CAPTURED ;
 * - un événement CLEVONE authentifié est requis pour validation auto ;
 * - conflits → HUMAN_REVIEW (délai indicatif ≤ 24 h) ;
 * - décisions idempotentes / anti-rejeu via idempotencyKey + références vérifiées.
 */
export function createReconciliationService(options?: { store?: Store }) {
  const store = options?.store ?? createStore();

  const service = {
    store,

    async storeClientProof(input: {
      paymentId: string;
      invoiceId?: string;
      fileName: string;
      mimeType: string;
      bytes: Buffer;
      reference?: string;
      amountCents?: number;
      currency?: string;
    }): Promise<PaymentProofRecord> {
      const key = buildStorageKey(input.fileName);
      const stored: StoredObject = await putPrivateObject(key, input.bytes, {
        root: PAYMENT_PROOF_ROOT,
      });
      const proof: PaymentProofRecord = {
        id: randomUUID(),
        paymentId: input.paymentId,
        invoiceId: input.invoiceId,
        source: "CLIENT_UPLOAD",
        storageKey: stored.key,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: stored.sizeBytes,
        checksumSha256: stored.checksumSha256,
        reference: input.reference,
        amountCents: input.amountCents,
        currency: input.currency?.toUpperCase(),
        authenticated: false,
        createdAt: now(),
      };
      store.proofs.set(proof.id, proof);
      pushAudit(
        store,
        "PROOF_STORED_CLIENT",
        "PaymentProof",
        proof.id,
        proof.paymentId,
      );
      return proof;
    },

    /** Enregistre un événement CLEVONE sandbox/officiel authentifié (pas un upload client). */
    registerClevoneEvent(event: ClevoneOfficialEvent): ClevoneOfficialEvent {
      if (!event.authenticated) {
        throw new Error("clevone_event_must_be_authenticated");
      }
      if (!["CLEVONE_SANDBOX", "CLEVONE_OFFICIAL"].includes(event.source)) {
        throw new Error("invalid_clevone_source");
      }
      store.officialEvents.set(event.eventKey, {
        ...event,
        currency: event.currency.toUpperCase(),
        authenticated: true,
      });
      pushAudit(
        store,
        "CLEVONE_EVENT_REGISTERED",
        "ClevoneOfficialEvent",
        event.eventKey,
        event.paymentId,
      );
      return event;
    },

    /**
     * Recharge preuves, événements CLEVONE et décisions depuis un store persistant
     * (Prisma) sans réécrire les fichiers preuve.
     */
    hydratePersistedState(input: {
      proofs?: PaymentProofRecord[];
      events?: ClevoneOfficialEvent[];
      decisions?: ReconciliationDecisionRecord[];
    }): void {
      for (const proof of input.proofs ?? []) {
        store.proofs.set(proof.id, proof);
      }
      for (const event of input.events ?? []) {
        if (!event.authenticated) {
          continue;
        }
        store.officialEvents.set(event.eventKey, {
          ...event,
          currency: event.currency.toUpperCase(),
          authenticated: true,
        });
      }
      for (const decision of input.decisions ?? []) {
        store.decisions.set(decision.id, decision);
        store.decisionsByIdempotency.set(decision.idempotencyKey, decision.id);
        if (decision.status === "VERIFIED") {
          const matched = decision.matchedEventKey
            ? store.officialEvents.get(decision.matchedEventKey)
            : undefined;
          if (matched?.reference) {
            store.verifiedReferences.add(normalize(matched.reference));
          }
          const proof = decision.clientProofId
            ? store.proofs.get(decision.clientProofId)
            : undefined;
          if (proof?.reference) {
            store.verifiedReferences.add(normalize(proof.reference));
          }
        }
      }
      pushAudit(
        store,
        "STORE_HYDRATED",
        "ReconciliationStore",
        "persist",
        `proofs=${input.proofs?.length ?? 0};events=${input.events?.length ?? 0};decisions=${input.decisions?.length ?? 0}`,
      );
    },

    /**
     * Décide du rapprochement. Idempotent sur idempotencyKey.
     * Ne marque jamais un paiement CAPTURED/VERIFIED sur preuve client seule.
     */
    reconcile(input: {
      idempotencyKey: string;
      paymentId: string;
      invoiceId?: string;
      clientProofId?: string;
      expectedAmountCents: number;
      expectedCurrency: string;
    }): ReconciliationDecisionRecord {
      const existingId = store.decisionsByIdempotency.get(input.idempotencyKey);
      if (existingId) {
        const existing = store.decisions.get(existingId);
        if (existing) {
          pushAudit(
            store,
            "RECONCILE_IDEMPOTENT_HIT",
            "ReconciliationDecision",
            existing.id,
            input.idempotencyKey,
          );
          return existing;
        }
      }

      const clientProof = input.clientProofId
        ? store.proofs.get(input.clientProofId)
        : undefined;
      if (input.clientProofId && !clientProof) {
        throw new Error("client_proof_not_found");
      }

      const ts = now();
      const base = {
        id: randomUUID(),
        paymentId: input.paymentId,
        invoiceId: input.invoiceId,
        idempotencyKey: input.idempotencyKey,
        clientProofId: clientProof?.id,
        decidedAt: ts,
        createdAt: ts,
      };

      const ref = clientProof?.reference;
      if (ref && store.verifiedReferences.has(normalize(ref))) {
        const decision: ReconciliationDecisionRecord = {
          ...base,
          status: "DUPLICATE_SUSPECTED",
          score: 0,
          reasons: ["reference_already_verified"],
        };
        store.decisions.set(decision.id, decision);
        store.decisionsByIdempotency.set(input.idempotencyKey, decision.id);
        pushAudit(
          store,
          "RECONCILE_DUPLICATE",
          "ReconciliationDecision",
          decision.id,
          ref,
        );
        return decision;
      }

      const events = [...store.officialEvents.values()].filter(
        (event) =>
          event.paymentId === input.paymentId && event.authenticated === true,
      );

      // Preuve client seule → jamais VERIFIED (ni CAPTURED côté paiement).
      if (events.length === 0) {
        const decision: ReconciliationDecisionRecord = {
          ...base,
          status: "PENDING",
          score: 0,
          reasons: ["client_proof_alone_insufficient"],
        };
        store.decisions.set(decision.id, decision);
        store.decisionsByIdempotency.set(input.idempotencyKey, decision.id);
        pushAudit(
          store,
          "RECONCILE_CLIENT_ALONE_REFUSED",
          "ReconciliationDecision",
          decision.id,
          input.paymentId,
        );
        return decision;
      }

      if (!clientProof) {
        // Événement CLEVONE seul, cohérent avec le paiement attendu → VERIFIED.
        const event = events[0]!;
        const amountOk = event.amountCents === input.expectedAmountCents;
        const currencyOk =
          normalize(event.currency) === normalize(input.expectedCurrency);
        if (amountOk && currencyOk) {
          const decision: ReconciliationDecisionRecord = {
            ...base,
            status: "VERIFIED",
            score: 100,
            reasons: ["clevone_authenticated_event", "amount_match", "currency_match"],
            matchedEventKey: event.eventKey,
          };
          store.decisions.set(decision.id, decision);
          store.decisionsByIdempotency.set(input.idempotencyKey, decision.id);
          if (event.reference) {
            store.verifiedReferences.add(normalize(event.reference));
          }
          pushAudit(
            store,
            "RECONCILE_VERIFIED_CLEVONE",
            "ReconciliationDecision",
            decision.id,
            event.eventKey,
          );
          return decision;
        }
        const decision: ReconciliationDecisionRecord = {
          ...base,
          status: "HUMAN_REVIEW",
          score: 20,
          reasons: ["clevone_event_mismatch"],
          matchedEventKey: event.eventKey,
          reviewDueAt: new Date(Date.now() + HUMAN_REVIEW_MS).toISOString(),
        };
        store.decisions.set(decision.id, decision);
        store.decisionsByIdempotency.set(input.idempotencyKey, decision.id);
        pushAudit(
          store,
          "RECONCILE_HUMAN_REVIEW",
          "ReconciliationDecision",
          decision.id,
          "clevone_event_mismatch",
        );
        return decision;
      }

      const scored = events.map((event) => ({
        event,
        ...evaluateMatch(clientProof, event),
      }));
      const best = scored.sort((a, b) => b.score - a.score)[0]!;

      if (best.hardConflict) {
        const decision: ReconciliationDecisionRecord = {
          ...base,
          status: "HUMAN_REVIEW",
          score: best.score,
          reasons: best.reasons,
          matchedEventKey: best.event.eventKey,
          reviewDueAt: new Date(Date.now() + HUMAN_REVIEW_MS).toISOString(),
        };
        store.decisions.set(decision.id, decision);
        store.decisionsByIdempotency.set(input.idempotencyKey, decision.id);
        pushAudit(
          store,
          "RECONCILE_HUMAN_REVIEW",
          "ReconciliationDecision",
          decision.id,
          best.reasons.join(","),
        );
        return decision;
      }

      const autoOk =
        best.reasons.includes("reference_match") &&
        best.reasons.includes("amount_match") &&
        best.reasons.includes("currency_match") &&
        best.score >= 90;

      if (autoOk) {
        const decision: ReconciliationDecisionRecord = {
          ...base,
          status: "VERIFIED",
          score: best.score,
          reasons: [...best.reasons, "clevone_authenticated_event"],
          matchedEventKey: best.event.eventKey,
        };
        store.decisions.set(decision.id, decision);
        store.decisionsByIdempotency.set(input.idempotencyKey, decision.id);
        if (clientProof.reference) {
          store.verifiedReferences.add(normalize(clientProof.reference));
        }
        pushAudit(
          store,
          "RECONCILE_VERIFIED_CLEVONE",
          "ReconciliationDecision",
          decision.id,
          best.event.eventKey,
        );
        return decision;
      }

      if (best.score >= 75) {
        const decision: ReconciliationDecisionRecord = {
          ...base,
          status: "MATCHED",
          score: best.score,
          reasons: best.reasons,
          matchedEventKey: best.event.eventKey,
        };
        store.decisions.set(decision.id, decision);
        store.decisionsByIdempotency.set(input.idempotencyKey, decision.id);
        pushAudit(
          store,
          "RECONCILE_MATCHED",
          "ReconciliationDecision",
          decision.id,
          String(best.score),
        );
        return decision;
      }

      const decision: ReconciliationDecisionRecord = {
        ...base,
        status: "HUMAN_REVIEW",
        score: best.score,
        reasons: best.reasons.length ? best.reasons : ["insufficient_match"],
        matchedEventKey: best.event.eventKey,
        reviewDueAt: new Date(Date.now() + HUMAN_REVIEW_MS).toISOString(),
      };
      store.decisions.set(decision.id, decision);
      store.decisionsByIdempotency.set(input.idempotencyKey, decision.id);
      pushAudit(
        store,
        "RECONCILE_HUMAN_REVIEW",
        "ReconciliationDecision",
        decision.id,
        "insufficient_match",
      );
      return decision;
    },

    /** Helper: a VERIFIED decision is the only automatic path toward capture/activation. */
    allowsCapture(decision: ReconciliationDecisionRecord): boolean {
      return decision.status === "VERIFIED";
    },
  };

  return service;
}

export type ReconciliationService = ReturnType<typeof createReconciliationService>;
