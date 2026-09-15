import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_AGENT_CATALOG } from "@/lib/agentic/catalog";
import {
  AGENT_TOOL_EVALUATED_ACTION,
  AgentAuditLog,
  toAdminAuditLogInput,
} from "@/lib/agentic/audit";
import {
  BUSINESS_TOOL_IDS,
  BusinessToolError,
  evaluateAgentTool,
  isHumanActionType,
  policyForBusinessTool,
  riskForBusinessTool,
} from "@/lib/agentic/tools";
import { auditActions } from "@/lib/admin/audit";
import { policyForAction, policyForRisk, riskForAction } from "@/lib/x200/actions/policy";
import { HUMAN_ACTION_TYPES } from "@/lib/x200/actions/types";

function agent(id: string) {
  const found = DEFAULT_AGENT_CATALOG.find((row) => row.id === id);
  assert.ok(found);
  return found;
}

test("business tool allowlist is disjoint from HUMAN_ACTION_TYPES", () => {
  for (const tool of BUSINESS_TOOL_IDS) {
    assert.equal(isHumanActionType(tool), false);
  }
  for (const action of HUMAN_ACTION_TYPES) {
    assert.equal((BUSINESS_TOOL_IDS as readonly string[]).includes(action), false);
  }
});

test("catalog tools are a subset of the business allowlist", () => {
  for (const row of DEFAULT_AGENT_CATALOG) {
    for (const tool of row.allowedTools) {
      assert.ok(
        (BUSINESS_TOOL_IDS as readonly string[]).includes(tool),
        `${row.id} tool ${tool} missing from BUSINESS_TOOL_IDS`,
      );
    }
  }
});

test("ops actions are not business tools", () => {
  assert.throws(() => riskForBusinessTool("MERGE_PR"), (err: unknown) => {
    return err instanceof BusinessToolError && err.code === "OPS_ACTION_NOT_BUSINESS_TOOL";
  });
  assert.throws(() => riskForBusinessTool("DEPLOY_PRODUCTION"));
  assert.throws(() => riskForBusinessTool("ENABLE_PAYMENT_LIVE"));
  const finance = agent("CLEVONE_FINANCE_AGENT");
  const denied = evaluateAgentTool(finance, "MERGE_PR");
  assert.equal(denied.allowed, false);
  assert.equal(denied.code, "OPS_ACTION_NOT_BUSINESS_TOOL");
});

test("business tool policy reuses policyForRisk / riskForAction ladder", () => {
  const low = policyForBusinessTool("payments.read");
  assert.deepEqual(low, policyForRisk("LOW"));
  assert.deepEqual(low, policyForAction("COLLECT_DIAGNOSTICS"));
  assert.equal(riskForAction("COLLECT_DIAGNOSTICS"), "LOW");

  const medium = policyForBusinessTool("payments.reconcile.recommend");
  assert.deepEqual(medium, policyForRisk("MEDIUM"));
  assert.deepEqual(medium, policyForAction("CREATE_BACKUP"));

  const high = policyForBusinessTool("repo.edit.authorized");
  assert.deepEqual(high, policyForRisk("HIGH"));
  const mergePolicy = policyForAction("MERGE_PR");
  assert.equal(mergePolicy.risk, high.risk);
  assert.equal(mergePolicy.requireMfa, high.requireMfa);
});

test("finance agent may recommend reconcile but not payout-shaped tools", () => {
  const finance = agent("CLEVONE_FINANCE_AGENT");
  const ok = evaluateAgentTool(finance, "payments.reconcile.recommend");
  assert.equal(ok.allowed, true);
  assert.equal(ok.risk, "MEDIUM");
  assert.equal(ok.approval_required, true);

  const payout = evaluateAgentTool(finance, "payments.payout.execute");
  assert.equal(payout.allowed, false);
  assert.equal(payout.code, "UNKNOWN_BUSINESS_TOOL");
});

test("agent audit records required fields and redacts secrets", () => {
  const finance = agent("CLEVONE_FINANCE_AGENT");
  const log = new AgentAuditLog();
  const { record } = log.evaluateAndRecord({
    agent: finance,
    action: "recommend_match",
    tool: "payments.reconcile.recommend",
    correlationId: "corr-1",
    metadata: { token: "super-secret", password: "hunter2" },
  });
  assert.equal(record.agent_id, "CLEVONE_FINANCE_AGENT");
  assert.equal(record.provider, "internal");
  assert.equal(record.action, "recommend_match");
  assert.equal(record.tool, "payments.reconcile.recommend");
  assert.equal(record.risk, "MEDIUM");
  assert.equal(record.approval_required, true);
  assert.equal(record.status, "pending_approval");
  const admin = toAdminAuditLogInput(record);
  assert.equal(admin.action, AGENT_TOOL_EVALUATED_ACTION);
  assert.equal(admin.action, auditActions.AGENT_TOOL_EVALUATED);
  const json = JSON.stringify(log.list());
  assert.equal(json.includes("super-secret"), false);
  assert.equal(json.includes("hunter2"), false);
  assert.equal((record.metadata as { token: string }).token, "[REDACTED]");
  assert.equal((record.metadata as { password: string }).password, "[REDACTED]");
});

test("low-risk git.read on CURSOR_DEV_WORKER is accepted without approval", () => {
  const worker = agent("CURSOR_DEV_WORKER");
  const log = new AgentAuditLog();
  const { record, evaluation } = log.evaluateAndRecord({
    agent: worker,
    action: "read_repo",
    tool: "git.read",
  });
  assert.equal(evaluation.allowed, true);
  assert.equal(record.status, "accepted");
  assert.equal(record.approval_required, false);
  assert.equal(record.risk, "LOW");
});
