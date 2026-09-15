import assert from "node:assert/strict";
import test from "node:test";

import { recommendLeadQualify } from "@/lib/agentic/commercial-agent";
import { createDefaultToolGateway } from "@/lib/agentic/gateway";
import { createDefaultAgentRegistry } from "@/lib/agentic/registry";

test("recommendLeadQualify drafts without sending email", async () => {
  const gateway = createDefaultToolGateway();
  const registry = createDefaultAgentRegistry();
  const agent = registry.get("CLEVONE_COMMERCIAL_AGENT");
  assert.ok(agent);

  const pending = await recommendLeadQualify(
    {
      leadId: "lead_1",
      email: "a@example.com",
      company: "Acme",
      notes: "Inbound demo request",
    },
    { gateway, registry },
  );
  assert.equal(pending.routing.agent?.id, "CLEVONE_COMMERCIAL_AGENT");
  assert.equal(pending.gatewayDraft?.status, "pending_approval");
  assert.equal(pending.emailSent, false);
  assert.equal(pending.mailQueued, false);

  const done = await recommendLeadQualify(
    {
      leadId: "lead_1",
      email: "a@example.com",
      company: "Acme",
      notes: "Inbound demo request",
      approval: {
        token: "apr_crm_1",
        tool: "crm.draft",
        agentId: agent!.id,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    },
    { gateway, registry },
  );
  assert.equal(done.gatewayDraft?.status, "executed");
  assert.equal(done.gatewayDraft?.output?.emailSent, false);
  assert.equal(done.qualification, "WARM");
  assert.equal(done.emailSent, false);
});
