import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultAgentRegistry } from "@/lib/agentic/registry";
import {
  createDefaultToolGateway,
  type ToolGatewayApproval,
} from "@/lib/agentic/gateway";

function financeAgent() {
  const agent = createDefaultAgentRegistry().get("CLEVONE_FINANCE_AGENT");
  assert.ok(agent);
  return agent;
}

function adminAgent() {
  const agent = createDefaultAgentRegistry().get("CLEVONE_ADMIN_AGENT");
  assert.ok(agent);
  return agent;
}

function approval(
  overrides: Partial<ToolGatewayApproval> = {},
): ToolGatewayApproval {
  return {
    token: "apr_test_token_001",
    tool: "payments.reconcile.recommend",
    agentId: "CLEVONE_FINANCE_AGENT",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    ...overrides,
  };
}

test("LOW risk tools execute without approval", async () => {
  const gateway = createDefaultToolGateway();
  const result = await gateway.invoke({
    agent: financeAgent(),
    tool: "payments.read",
    input: { paymentId: "pay_1" },
  });
  assert.equal(result.status, "executed");
  assert.equal(result.output?.status, "read_only_stub");
  assert.equal(result.evaluation.approval_required, false);
});

test("unknown and ops tools are denied", async () => {
  const gateway = createDefaultToolGateway();
  const unknown = await gateway.invoke({
    agent: financeAgent(),
    tool: "payments.send_money",
  });
  assert.equal(unknown.status, "denied");
  assert.equal(unknown.code, "UNKNOWN_BUSINESS_TOOL");

  const ops = await gateway.invoke({
    agent: financeAgent(),
    tool: "DEPLOY_PRODUCTION",
  });
  assert.equal(ops.status, "denied");
  assert.equal(ops.code, "OPS_ACTION_NOT_BUSINESS_TOOL");
});

test("MEDIUM reconcile recommend requires approval token", async () => {
  const gateway = createDefaultToolGateway();
  const pending = await gateway.invoke({
    agent: financeAgent(),
    tool: "payments.reconcile.recommend",
    input: { amountCents: 5000, reference: "REF-1001" },
  });
  assert.equal(pending.status, "pending_approval");
  assert.equal(pending.code, "APPROVAL_REQUIRED");
  assert.equal(pending.output, null);

  const executed = await gateway.invoke({
    agent: financeAgent(),
    tool: "payments.reconcile.recommend",
    input: { amountCents: 5000, reference: "REF-1001" },
    approval: approval(),
  });
  assert.equal(executed.status, "executed");
  assert.equal(executed.output?.moneyMoved, false);
  assert.equal(executed.output?.verifiedActivated, false);
  assert.equal(executed.output?.recommendation, "MATCH_CANDIDATE");
});

test("approval tokens are single-use and scoped", async () => {
  const gateway = createDefaultToolGateway();
  const token = approval();
  const first = await gateway.invoke({
    agent: financeAgent(),
    tool: "payments.reconcile.recommend",
    input: { amountCents: 100, reference: "ABCD" },
    approval: token,
  });
  assert.equal(first.status, "executed");

  const replay = await gateway.invoke({
    agent: financeAgent(),
    tool: "payments.reconcile.recommend",
    input: { amountCents: 100, reference: "ABCD" },
    approval: token,
  });
  assert.equal(replay.status, "pending_approval");
  assert.equal(replay.code, "APPROVAL_CONSUMED");

  const mismatch = await gateway.invoke({
    agent: financeAgent(),
    tool: "payments.reconcile.recommend",
    input: { amountCents: 100, reference: "ABCD" },
    approval: approval({ token: "apr_other", agentId: "CLEVONE_ADMIN_AGENT" }),
  });
  assert.equal(mismatch.code, "APPROVAL_AGENT_MISMATCH");
});

test("tool not on agent allowlist is denied", async () => {
  const gateway = createDefaultToolGateway();
  const result = await gateway.invoke({
    agent: adminAgent(),
    tool: "payments.reconcile.recommend",
    approval: approval({ agentId: "CLEVONE_ADMIN_AGENT" }),
  });
  assert.equal(result.status, "denied");
  assert.equal(result.code, "TOOL_NOT_ALLOWLISTED");
});

test("HIGH risk repo.edit.authorized has no default handler", async () => {
  const gateway = createDefaultToolGateway();
  const cursor = createDefaultAgentRegistry().get("CURSOR_DEV_WORKER");
  assert.ok(cursor);
  const result = await gateway.invoke({
    agent: cursor,
    tool: "repo.edit.authorized",
    approval: {
      token: "apr_high",
      tool: "repo.edit.authorized",
      agentId: "CURSOR_DEV_WORKER",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    },
  });
  assert.equal(result.status, "denied");
  assert.equal(result.code, "NO_HANDLER");
});

test("every invoke is audited", async () => {
  const gateway = createDefaultToolGateway();
  await gateway.invoke({
    agent: financeAgent(),
    tool: "payments.read",
    correlationId: "corr-1",
  });
  const rows = gateway.audit.list();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].agent_id, "CLEVONE_FINANCE_AGENT");
  assert.equal(rows[0].tool, "payments.read");
  assert.equal(rows[0].correlationId, "corr-1");
});
