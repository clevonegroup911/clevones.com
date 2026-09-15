import assert from "node:assert/strict";
import test from "node:test";

import { AgentAuditLog } from "@/lib/agentic/audit";
import { financeAgentOrThrow } from "@/lib/agentic/finance-slice";
import {
  buildAgenticObservabilitySnapshot,
  orchestrationRowFromResult,
} from "@/lib/agentic/observability";

test("buildAgenticObservabilitySnapshot lists catalog agents without secrets", () => {
  const snap = buildAgenticObservabilitySnapshot();
  assert.ok(snap.agents.length >= 5);
  assert.equal(snap.liveProvidersDisabled, true);
  assert.ok(snap.agents.some((a) => a.id === "CLEVONE_FINANCE_AGENT"));
  const json = JSON.stringify(snap);
  assert.doesNotMatch(json, /bizapr_|sk-|api_key|password/i);
});

test("audits and orchestration rows are included read-only", () => {
  const audit = new AgentAuditLog();
  const agent = financeAgentOrThrow();
  audit.evaluateAndRecord({
    agent,
    action: "tool.invoke",
    tool: "payments.read",
    metadata: { token: "should-redact-if-sanitized", note: "ok" },
  });
  const orch = orchestrationRowFromResult({
    correlationId: "corr-1",
    taskClass: "finance.reconcile",
    status: "pending_approval",
    steps: [
      {
        name: "classify",
        at: new Date().toISOString(),
        detail: "finance.reconcile",
        ok: true,
      },
    ],
  });
  const snap = buildAgenticObservabilitySnapshot({
    audits: audit.list(),
    orchestrations: [orch],
  });
  assert.equal(snap.recentAudits.length, 1);
  assert.equal(snap.recentOrchestrations[0]?.moneyMoved, false);
  assert.equal(snap.recentOrchestrations[0]?.correlationId, "corr-1");
});
