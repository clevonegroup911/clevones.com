import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  appendAgenticApproval,
  appendAgenticAudit,
  appendAgenticEvent,
  appendAgenticOrchestration,
  loadAgenticJournal,
} from "@/lib/agentic/persistence";

test("agentic journal persists redacted approvals and reloads snapshots", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "agentic-journal-"));

  await appendAgenticEvent(
    {
      eventId: "e1",
      eventType: "document.uploaded",
      idempotencyKey: "k1",
      correlationId: "c1",
      source: "clevone.internal",
      actor: { type: "system", id: "test" },
      risk: "MEDIUM",
      timestamp: new Date().toISOString(),
      payload: { documentId: "d1" },
      contentLayer: "SYSTEM",
      payloadDigest: "abc",
    },
    { cwd },
  );

  await appendAgenticApproval(
    {
      token: "bizapr_SECRET_SHOULD_NOT_PERSIST",
      tokenDigest: "a".repeat(64),
      agentId: "CLEVONE_DMS_AGENT",
      tool: "documents.classify",
      reason: "ok api_key=sk-live-x",
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      consumedAt: null,
      issuerId: "admin",
    },
    { cwd },
  );

  await appendAgenticAudit(
    {
      id: "aud1",
      agent_id: "CLEVONE_DMS_AGENT",
      provider: "internal",
      action: "tool.invoke",
      tool: "documents.classify",
      risk: "MEDIUM",
      approval_required: true,
      status: "pending_approval",
      code: "APPROVAL_REQUIRED",
      at: new Date().toISOString(),
      correlationId: "c1",
      metadata: { token: "raw-token" },
    },
    { cwd },
  );

  await appendAgenticOrchestration(
    {
      correlationId: "c1",
      taskClass: "documents.classify",
      status: "pending_approval",
      steps: [{ name: "classify", ok: true, detail: "documents.classify" }],
      moneyMoved: false,
    },
    { cwd },
  );

  const snap = await loadAgenticJournal({ cwd, limit: 20 });
  assert.equal(snap.events.length, 1);
  assert.equal(snap.approvals.length, 1);
  assert.equal(snap.approvals[0]?.approvalDigest, "a".repeat(64));
  assert.equal("token" in (snap.approvals[0] ?? {}), false);
  assert.equal("tokenDigest" in (snap.approvals[0] ?? {}), false);
  assert.equal(snap.audits.length, 1);
  assert.equal(snap.orchestrations.length, 1);
  assert.equal(snap.orchestrations[0]?.moneyMoved, false);

  const approvalRaw = await readFile(
    path.join(cwd, ".x200", "agentic-approvals.jsonl"),
    "utf8",
  );
  assert.doesNotMatch(approvalRaw, /bizapr_SECRET/);
  assert.doesNotMatch(approvalRaw, /sk-live/);

  const auditRaw = await readFile(
    path.join(cwd, ".x200", "agentic-audits.jsonl"),
    "utf8",
  );
  assert.match(auditRaw, /\[REDACTED\]/);
  assert.doesNotMatch(auditRaw, /raw-token/);
});
