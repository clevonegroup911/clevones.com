import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveCommercialOutcome,
  deriveDmsOutcome,
  deriveFinanceOutcome,
  deriveOrchestrationOutcome,
} from "@/lib/agentic/outcomes";

test("finance outcomes never claim money movement", () => {
  const pending = deriveFinanceOutcome({
    eventStatus: "recorded",
    correlationId: "c1",
    routing: { agent: null, reason: "x", approvalRequired: true, rejected: [] },
    gateway: { status: "pending_approval", code: "APPROVAL_REQUIRED", evaluation: { allowed: true, code: "OK", tool: "payments.reconcile.recommend", risk: "MEDIUM", policy: null, approval_required: true }, audit: {} as never, output: null },
    decision: null,
    approvalRequired: true,
    moneyMoved: false,
    verifiedActivated: false,
  });
  assert.equal(pending.code, "finance_pending_human");
  assert.equal(pending.moneyMoved, false);
  assert.equal(pending.emailSent, false);
  assert.equal(pending.exported, false);
});

test("commercial and dms outcomes stay side-effect free", () => {
  const commercial = deriveCommercialOutcome({
    routing: { agent: null, reason: "ok", approvalRequired: false, rejected: [] },
    gatewayRead: null,
    gatewayDraft: { status: "executed", code: "CRM_DRAFT", evaluation: { allowed: true, code: "OK", tool: "crm.draft", risk: "MEDIUM", policy: null, approval_required: false }, audit: {} as never, output: { emailSent: false } },
    qualification: "WARM",
    emailSent: false,
    mailQueued: false,
    approvalRequired: false,
  });
  assert.equal(commercial.code, "lead_qualified_candidate");
  assert.equal(commercial.emailSent, false);

  const dms = deriveDmsOutcome({
    routing: { agent: null, reason: "ok", approvalRequired: false, rejected: [] },
    gatewayMetadata: null,
    gatewayClassify: { status: "executed", code: "DOCUMENT_CLASSIFY", evaluation: { allowed: true, code: "OK", tool: "documents.classify", risk: "MEDIUM", policy: null, approval_required: false }, audit: {} as never, output: { label: "POLICY_CANDIDATE" } },
    label: "POLICY_CANDIDATE",
    contentEchoed: false,
    bytesEchoed: false,
    exported: false,
    approvalRequired: false,
  });
  assert.equal(dms.code, "document_classified");
  assert.equal(dms.exported, false);
});

test("orchestration blocked maps HIGH gate", () => {
  const blocked = deriveOrchestrationOutcome({
    status: "blocked_pending_human",
    classification: {
      taskClass: "unknown",
      eventType: "invoice.created",
      risk: "HIGH",
      requiredCapabilities: [],
      requiredTools: [],
      contentSensitivity: "confidential",
      contentLayer: "SYSTEM",
    },
    steps: [],
    correlationId: "c",
    routing: null,
    gateway: null,
    finance: null,
    moneyMoved: false,
  });
  assert.equal(blocked.code, "orchestration_blocked");
  assert.equal(blocked.moneyMoved, false);
});
