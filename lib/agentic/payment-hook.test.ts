import assert from "node:assert/strict";
import test from "node:test";

import { maybeRunAgenticProofRecommend } from "@/lib/agentic/payment-hook";

test("payment hook is disabled by default and never moves money", async () => {
  const prev = process.env.AGENTIC_PROOF_RECOMMEND_HOOK;
  delete process.env.AGENTIC_PROOF_RECOMMEND_HOOK;
  try {
    const skipped = await maybeRunAgenticProofRecommend({
      paymentId: "pay_1",
      proofId: "prf_1",
      expectedAmountCents: 1000,
      expectedCurrency: "USD",
      reference: "REF-1",
      amountCents: 1000,
      currency: "USD",
    });
    assert.equal(skipped.ran, false);
    assert.equal(skipped.skippedReason, "HOOK_DISABLED");
    assert.equal(skipped.moneyMoved, false);
    assert.equal(skipped.verifiedActivated, false);

    const ran = await maybeRunAgenticProofRecommend({
      paymentId: "pay_1",
      proofId: "prf_hook_2",
      expectedAmountCents: 1000,
      expectedCurrency: "USD",
      reference: "REF-HOOK-2",
      amountCents: 1000,
      currency: "USD",
      enabled: true,
    });
    assert.equal(ran.ran, true);
    assert.equal(ran.moneyMoved, false);
    assert.equal(ran.verifiedActivated, false);
    assert.equal(ran.finance?.moneyMoved, false);
    assert.equal(ran.finance?.verifiedActivated, false);
    // Without approval, MEDIUM recommend stays pending — still no activation.
    assert.ok(
      ran.finance?.gateway?.status === "pending_approval"
      || ran.finance?.approvalRequired === true,
    );
  } finally {
    if (prev === undefined) delete process.env.AGENTIC_PROOF_RECOMMEND_HOOK;
    else process.env.AGENTIC_PROOF_RECOMMEND_HOOK = prev;
  }
});
