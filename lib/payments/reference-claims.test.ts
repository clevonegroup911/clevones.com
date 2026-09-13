import assert from "node:assert/strict";
import { test } from "node:test";

import {
  claimVerifiedReferences,
  collectSignificantReferences,
  decisionAsDuplicateSuspect,
  normalizePaymentReference,
  ReferenceClaimConflictError,
} from "@/lib/payments/reference-claims";
import type { ReconciliationDecisionRecord } from "@/lib/payments/reconciliation";
import { createReconciliationService } from "@/lib/payments/reconciliation";

type ClaimRow = {
  id: string;
  normalizedReference: string;
  paymentId: string;
  decisionId: string | null;
  eventKey: string | null;
  createdAt: Date;
};

function createMemoryClaimClient(seed: ClaimRow[] = []) {
  const rows = new Map(seed.map((row) => [row.normalizedReference, { ...row }]));
  let createCalls = 0;

  return {
    rows,
    get createCalls() {
      return createCalls;
    },
    verifiedPaymentReferenceClaim: {
      async findUnique(args: { where: { normalizedReference: string } }) {
        return rows.get(args.where.normalizedReference) ?? null;
      },
      async findMany() {
        return [...rows.values()];
      },
      async create(args: {
        data: {
          normalizedReference: string;
          paymentId: string;
          decisionId?: string;
          eventKey?: string;
        };
      }) {
        createCalls += 1;
        if (rows.has(args.data.normalizedReference)) {
          const err = new Error("Unique constraint failed") as Error & {
            code: string;
          };
          err.code = "P2002";
          throw err;
        }
        const row: ClaimRow = {
          id: `claim-${rows.size + 1}`,
          normalizedReference: args.data.normalizedReference,
          paymentId: args.data.paymentId,
          decisionId: args.data.decisionId ?? null,
          eventKey: args.data.eventKey ?? null,
          createdAt: new Date(),
        };
        rows.set(row.normalizedReference, row);
        return row;
      },
    },
  };
}

test("normalizePaymentReference trims and uppercases", () => {
  assert.equal(normalizePaymentReference("  ref-x "), "REF-X");
  assert.equal(normalizePaymentReference(undefined), "");
});

test("A VERIFIED then B same REF → DUPLICATE_SUSPECTED (shared store)", async () => {
  const service = createReconciliationService();
  service.registerClevoneEvent({
    eventKey: "evt-a",
    paymentId: "pay-a",
    reference: "REF-X",
    amountCents: 1000,
    currency: "USD",
    authenticated: true,
    source: "CLEVONE_SANDBOX",
  });
  const a = service.reconcile({
    idempotencyKey: "dec-a",
    paymentId: "pay-a",
    expectedAmountCents: 1000,
    expectedCurrency: "USD",
  });
  assert.equal(a.status, "VERIFIED");

  service.registerClevoneEvent({
    eventKey: "evt-b",
    paymentId: "pay-b",
    reference: "REF-X",
    amountCents: 1000,
    currency: "USD",
    authenticated: true,
    source: "CLEVONE_SANDBOX",
  });
  const b = service.reconcile({
    idempotencyKey: "dec-b",
    paymentId: "pay-b",
    expectedAmountCents: 1000,
    expectedCurrency: "USD",
  });
  assert.equal(b.status, "DUPLICATE_SUSPECTED");
});

test("same payment + same idempotency stays idempotent", () => {
  const service = createReconciliationService();
  service.registerClevoneEvent({
    eventKey: "evt-idem",
    paymentId: "pay-idem",
    reference: "REF-IDEM",
    amountCents: 500,
    currency: "USD",
    authenticated: true,
    source: "CLEVONE_SANDBOX",
  });
  const first = service.reconcile({
    idempotencyKey: "same-key",
    paymentId: "pay-idem",
    expectedAmountCents: 500,
    expectedCurrency: "USD",
  });
  const second = service.reconcile({
    idempotencyKey: "same-key",
    paymentId: "pay-idem",
    expectedAmountCents: 500,
    expectedCurrency: "USD",
  });
  assert.equal(first.status, "VERIFIED");
  assert.equal(second.id, first.id);
});

test("CLEVONE event without client proof still blocks replay of its reference", () => {
  const service = createReconciliationService();
  service.hydratePersistedState({
    verifiedReferences: ["REF-GLOBAL"],
  });
  service.registerClevoneEvent({
    eventKey: "evt-only",
    paymentId: "pay-only",
    reference: "REF-GLOBAL",
    amountCents: 700,
    currency: "CDF",
    authenticated: true,
    source: "CLEVONE_OFFICIAL",
  });
  const decision = service.reconcile({
    idempotencyKey: "dec-only",
    paymentId: "pay-only",
    expectedAmountCents: 700,
    expectedCurrency: "CDF",
  });
  assert.equal(decision.status, "DUPLICATE_SUSPECTED");
});

test("claimVerifiedReferences: other payment conflicts; same payment idempotent", async () => {
  const client = createMemoryClaimClient();
  await claimVerifiedReferences(
    {
      references: ["ref-x"],
      paymentId: "pay-1",
      decisionId: "dec-1",
      eventKey: "evt-1",
    },
    client as never,
  );
  assert.equal(client.rows.size, 1);

  await claimVerifiedReferences(
    {
      references: [" REF-X "],
      paymentId: "pay-1",
      decisionId: "dec-1",
    },
    client as never,
  );
  assert.equal(client.rows.size, 1);
  assert.equal(client.createCalls, 1);

  await assert.rejects(
    () =>
      claimVerifiedReferences(
        {
          references: ["REF-X"],
          paymentId: "pay-2",
          decisionId: "dec-2",
        },
        client as never,
      ),
    (error: unknown) => error instanceof ReferenceClaimConflictError,
  );
});

test("concurrent claim: at most one winner for REF-X", async () => {
  const client = createMemoryClaimClient();
  const gate = { release: null as null | (() => void) };
  const firstCreateGate = new Promise<void>((resolve) => {
    gate.release = resolve;
  });
  let createEntries = 0;

  const originalCreate = client.verifiedPaymentReferenceClaim.create.bind(
    client.verifiedPaymentReferenceClaim,
  );
  client.verifiedPaymentReferenceClaim.create = async (args) => {
    createEntries += 1;
    if (createEntries === 1) {
      await firstCreateGate;
    }
    return originalCreate(args);
  };

  const p1 = claimVerifiedReferences(
    { references: ["REF-X"], paymentId: "pay-1", decisionId: "d1" },
    client as never,
  );
  await new Promise((r) => setTimeout(r, 20));
  const p2 = claimVerifiedReferences(
    { references: ["REF-X"], paymentId: "pay-2", decisionId: "d2" },
    client as never,
  );
  gate.release?.();

  const results = await Promise.allSettled([p1, p2]);
  const fulfilled = results.filter((row) => row.status === "fulfilled");
  const rejected = results.filter((row) => row.status === "rejected");
  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.equal(client.rows.size, 1);
  assert.ok(["pay-1", "pay-2"].includes([...client.rows.values()][0]!.paymentId));
});

test("collectSignificantReferences gathers event + proof refs", () => {
  const decision: ReconciliationDecisionRecord = {
    id: "d1",
    paymentId: "p1",
    status: "VERIFIED",
    score: 100,
    reasons: [],
    idempotencyKey: "k",
    clientProofId: "proof-1",
    matchedEventKey: "evt-1",
    decidedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  const refs = collectSignificantReferences({
    decision,
    events: [
      {
        eventKey: "evt-1",
        paymentId: "p1",
        reference: "ref-evt",
        amountCents: 1,
        currency: "USD",
        authenticated: true,
        source: "CLEVONE_SANDBOX",
      },
    ],
    proofs: [
      {
        id: "proof-1",
        paymentId: "p1",
        source: "CLIENT_UPLOAD",
        storageKey: "k",
        fileName: "a.png",
        mimeType: "image/png",
        sizeBytes: 1,
        checksumSha256: "x",
        reference: "ref-proof",
        authenticated: false,
        createdAt: new Date().toISOString(),
      },
    ],
  });
  assert.deepEqual(refs.sort(), ["REF-EVT", "REF-PROOF"]);
  const dup = decisionAsDuplicateSuspect(decision);
  assert.equal(dup.status, "DUPLICATE_SUSPECTED");
});
