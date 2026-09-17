import assert from "node:assert/strict";
import test from "node:test";

import { recommendDocumentClassify } from "@/lib/agentic/dms-agent";
import { createDefaultToolGateway } from "@/lib/agentic/gateway";
import { createDefaultAgentRegistry } from "@/lib/agentic/registry";

test("recommendDocumentClassify never echoes content and requires approval for classify", async () => {
  const gateway = createDefaultToolGateway();
  const registry = createDefaultAgentRegistry();
  const agent = registry.get("CLEVONE_DMS_AGENT");
  assert.ok(agent);

  const pending = await recommendDocumentClassify(
    {
      documentId: "doc_1",
      title: "Policy Handbook",
      mimeType: "application/pdf",
    },
    { gateway, registry },
  );
  assert.equal(pending.routing.agent?.id, "CLEVONE_DMS_AGENT");
  assert.equal(pending.gatewayMetadata?.status, "executed");
  assert.equal(pending.gatewayMetadata?.output?.contentEchoed, false);
  assert.equal(pending.gatewayClassify?.status, "pending_approval");
  assert.equal(pending.contentEchoed, false);
  assert.equal(pending.bytesEchoed, false);
  assert.equal(pending.exported, false);

  const done = await recommendDocumentClassify(
    {
      documentId: "doc_1",
      title: "Policy Handbook",
      mimeType: "application/pdf",
      approval: {
        token: "apr_dms_1",
        tool: "documents.classify",
        agentId: agent!.id,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    },
    { gateway, registry },
  );
  assert.equal(done.gatewayClassify?.status, "executed");
  assert.equal(done.gatewayClassify?.code, "DOCUMENT_CLASSIFY");
  assert.equal(done.label, "POLICY_CANDIDATE");
  assert.equal(done.gatewayClassify?.output?.contentEchoed, false);
  assert.equal(done.gatewayClassify?.output?.bytesEchoed, false);
  assert.equal(done.gatewayClassify?.output?.exported, false);
  assert.equal(done.exported, false);
});
