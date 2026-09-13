import assert from "node:assert/strict";
import { test } from "node:test";

import { auditActions } from "@/lib/admin/audit";
import { withPaymentsTransaction } from "@/lib/payments/activation";

test("payment audit action constants cover review + activation", () => {
  assert.equal(auditActions.HUMAN_REVIEW_APPROVED, "HUMAN_REVIEW_APPROVED");
  assert.equal(auditActions.HUMAN_REVIEW_REJECTED, "HUMAN_REVIEW_REJECTED");
  assert.equal(
    auditActions.PAYMENT_VERIFIED_ACTIVATED,
    "PAYMENT_VERIFIED_ACTIVATED",
  );
  assert.equal(
    auditActions.PAYMENT_CLEVONE_EVENT_CREATED,
    "PAYMENT_CLEVONE_EVENT_CREATED",
  );
  assert.equal(
    auditActions.PAYMENT_RECONCILE_EXECUTED,
    "PAYMENT_RECONCILE_EXECUTED",
  );
});

test("withPaymentsTransaction reuses TransactionClient without nesting", async () => {
  const tx = { kind: "tx" } as never;
  const seen: unknown[] = [];
  const result = await withPaymentsTransaction(tx, async (client) => {
    seen.push(client);
    return 42;
  });
  assert.equal(result, 42);
  assert.equal(seen[0], tx);
});

test("withPaymentsTransaction opens $transaction on PrismaClient", async () => {
  const calls: string[] = [];
  const root = {
    async $transaction(fn: (tx: { kind: string }) => Promise<string>) {
      calls.push("open");
      return fn({ kind: "nested-tx" });
    },
  };
  const value = await withPaymentsTransaction(root as never, async (tx) => {
    calls.push((tx as unknown as { kind: string }).kind);
    return "ok";
  });
  assert.equal(value, "ok");
  assert.deepEqual(calls, ["open", "nested-tx"]);
});

test("forced activation failure rejects before commit semantics", async () => {
  let committed = false;
  const root = {
    async $transaction(fn: (tx: { tag: string }) => Promise<unknown>) {
      try {
        const result = await fn({ tag: "tx" });
        committed = true;
        return result;
      } catch (error) {
        committed = false;
        throw error;
      }
    },
  };

  await assert.rejects(async () => {
    await withPaymentsTransaction(root as never, async () => {
      // Simulate VERIFIED write then activation boom inside same tx.
      const verifiedWritten = true;
      assert.equal(verifiedWritten, true);
      throw new Error("forced_activation_failure");
    });
  }, /forced_activation_failure/);

  assert.equal(committed, false);
});
