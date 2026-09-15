import assert from "node:assert/strict";
import test from "node:test";

import {
  consumeBusinessApproval,
  createBusinessApprovalEngine,
  issueBusinessApproval,
} from "@/lib/agentic/approvals";
import { ToolGateway, createDefaultToolGateway } from "@/lib/agentic/gateway";
import { financeAgentOrThrow } from "@/lib/agentic/finance-slice";

test("issueBusinessApproval returns TTL-scoped token with redacted reason secrets", () => {
  const engine = createBusinessApprovalEngine();
  const agent = financeAgentOrThrow();
  const issued = issueBusinessApproval(
    {
      agentId: agent.id,
      tool: "payments.reconcile.recommend",
      reason: "match candidate api_key=sk-live-secret-value",
      issuerId: "admin-1",
      ttlMs: 60_000,
    },
    engine,
  );
  assert.ok(issued.token.startsWith("bizapr_"));
  assert.ok(issued.tokenDigest.length === 64);
  assert.match(issued.reason, /\[REDACTED\]/);
  assert.doesNotMatch(issued.reason, /sk-live/);
  assert.equal(engine.list()[0]?.token, "");
  const auditMeta = engine.auditLog.list()[0]?.metadata ?? {};
  assert.equal(auditMeta.token, undefined);
  assert.ok(typeof auditMeta.tokenDigest === "string" || auditMeta.tokenDigest === "[REDACTED]");
});

test("consume mismatch agent/tool and replay return stable codes", () => {
  const engine = createBusinessApprovalEngine();
  const agent = financeAgentOrThrow();
  const issued = engine.issue({
    agentId: agent.id,
    tool: "payments.reconcile.recommend",
    reason: "ok",
    issuerId: "admin-1",
  });

  const badAgent = consumeBusinessApproval(
    { token: issued.token, agentId: "OTHER", tool: "payments.reconcile.recommend" },
    engine,
  );
  assert.equal(badAgent.ok, false);
  if (!badAgent.ok) assert.equal(badAgent.code, "APPROVAL_AGENT_MISMATCH");

  const badTool = consumeBusinessApproval(
    { token: issued.token, agentId: agent.id, tool: "payments.read" },
    engine,
  );
  assert.equal(badTool.ok, false);
  if (!badTool.ok) assert.equal(badTool.code, "APPROVAL_TOOL_MISMATCH");

  const ok = consumeBusinessApproval(
    { token: issued.token, agentId: agent.id, tool: "payments.reconcile.recommend" },
    engine,
  );
  assert.equal(ok.ok, true);

  const replay = consumeBusinessApproval(
    { token: issued.token, agentId: agent.id, tool: "payments.reconcile.recommend" },
    engine,
  );
  assert.equal(replay.ok, false);
  if (!replay.ok) assert.equal(replay.code, "APPROVAL_CONSUMED");
});

test("ToolGateway accepts engine-issued approvals and rejects replay", async () => {
  const engine = createBusinessApprovalEngine();
  const agent = financeAgentOrThrow();
  const gateway = createDefaultToolGateway();
  const gated = new ToolGateway({ approvalEngine: engine, auditLog: gateway.audit });

  const issued = engine.issue({
    agentId: agent.id,
    tool: "payments.reconcile.recommend",
    reason: "human reviewed match",
    issuerId: "admin-1",
  });
  const approval = engine.toGatewayApproval(issued);

  const first = await gated.invoke({
    agent,
    tool: "payments.reconcile.recommend",
    approval,
    input: { paymentId: "pay_a", amountCents: 1000, reference: "REF-A1" },
  });
  assert.equal(first.status, "executed");

  const second = await gated.invoke({
    agent,
    tool: "payments.reconcile.recommend",
    approval,
    input: { paymentId: "pay_a", amountCents: 1000, reference: "REF-A1" },
  });
  assert.equal(second.status, "pending_approval");
  assert.equal(second.code, "APPROVAL_CONSUMED");
});

test("issueAsync persists digest without raw token", async () => {
  const { mkdtemp } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const path = await import("node:path");
  const cwd = await mkdtemp(path.join(tmpdir(), "apr-persist-"));
  const prev = process.cwd();
  process.chdir(cwd);
  try {
    const engine = createBusinessApprovalEngine();
    const agent = financeAgentOrThrow();
    const issued = await engine.issueAsync({
      agentId: agent.id,
      tool: "payments.reconcile.recommend",
      reason: "persist check",
      issuerId: "admin-1",
    });
    const { loadAgenticJournal } = await import("@/lib/agentic/persistence");
    const journal = await loadAgenticJournal({ cwd, limit: 10 });
    assert.ok(journal.approvals.length >= 1);
    assert.equal(journal.approvals.some((a) => a.approvalDigest === issued.tokenDigest), true);
    const raw = await import("node:fs/promises").then((fs) =>
      fs.readFile(path.join(cwd, ".x200", "agentic-approvals.jsonl"), "utf8"),
    );
    assert.doesNotMatch(raw, new RegExp(issued.token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  } finally {
    process.chdir(prev);
  }
});
