import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_AGENT_CATALOG } from "@/lib/agentic/catalog";
import {
  AgentRegistry,
  AgentRegistryError,
  createDefaultAgentRegistry,
  isExecutablePolicyLayer,
} from "@/lib/agentic/registry";

function mutableRegistry(): AgentRegistry {
  return new AgentRegistry(DEFAULT_AGENT_CATALOG);
}

test("default catalog is provider-independent and has no vendor SDK surface", () => {
  const providers = new Set(DEFAULT_AGENT_CATALOG.map((agent) => agent.provider));
  assert.equal(providers.has("internal"), true);
  assert.equal(providers.has("grok"), true);
  assert.equal(providers.has("openai"), true);
  assert.equal(providers.has("cursor"), true);
  assert.equal(
    DEFAULT_AGENT_CATALOG.some((agent) => agent.id === "CLEVONE_FINANCE_AGENT"),
    true,
  );
});

test("createDefaultAgentRegistry is frozen and still selectable", () => {
  const registry = createDefaultAgentRegistry();
  assert.equal(registry.size, DEFAULT_AGENT_CATALOG.length);
  assert.throws(
    () =>
      registry.register(
        {
          ...DEFAULT_AGENT_CATALOG[0],
          id: "EXTRA_AGENT",
        },
        { layer: "DEVELOPER" },
      ),
    (error: unknown) =>
      error instanceof AgentRegistryError && error.code === "REGISTRY_FROZEN",
  );

  const decision = registry.select({
    taskType: "payment.proof_classify",
    requiredCapabilities: ["extract", "reconcile"],
    risk: "LOW",
  });
  assert.equal(decision.agent?.id, "CLEVONE_FINANCE_AGENT");
  assert.equal(decision.approvalRequired, false);
});

test("EXTERNAL and USER layers cannot mutate the registry", () => {
  const registry = mutableRegistry();
  assert.equal(isExecutablePolicyLayer("EXTERNAL"), false);
  assert.throws(
    () => registry.disable("GROK_WORKER", { layer: "EXTERNAL" }),
    (error: unknown) =>
      error instanceof AgentRegistryError && error.code === "POLICY_LAYER_DENIED",
  );
  assert.throws(
    () =>
      registry.register(
        { ...DEFAULT_AGENT_CATALOG[0], id: "MALICIOUS_AGENT" },
        { layer: "USER" },
      ),
    (error: unknown) =>
      error instanceof AgentRegistryError && error.code === "POLICY_LAYER_DENIED",
  );
  assert.equal(registry.get("MALICIOUS_AGENT"), null);
  assert.equal(registry.get("GROK_WORKER")?.status, "available");
});

test("confidential content never routes to Grok or OpenAI workers", () => {
  const registry = createDefaultAgentRegistry();
  const decision = registry.select({
    taskType: "document.extract",
    requiredCapabilities: ["extract"],
    risk: "LOW",
    contentSensitivity: "confidential",
    contentLayer: "EXTERNAL",
  });
  assert.equal(decision.agent?.provider, "internal");
  assert.equal(
    decision.rejected.some(
      (item) =>
        item.agentId === "GROK_WORKER"
        && item.reason === "CONFIDENTIAL_CONTENT_BOUNDARY",
    ),
    true,
  );
  assert.equal(
    decision.rejected.some(
      (item) =>
        item.agentId === "OPENAI_WORKER"
        && item.reason === "CONFIDENTIAL_CONTENT_BOUNDARY",
    ),
    true,
  );
});

test("HIGH risk finance work is not auto-assigned to the finance agent", () => {
  const registry = createDefaultAgentRegistry();
  const decision = registry.select({
    taskType: "payment.outgoing",
    requiredCapabilities: ["reconcile"],
    requiredTools: ["payments.reconcile.recommend"],
    risk: "HIGH",
  });
  assert.equal(decision.agent, null);
  assert.equal(decision.reason, "NO_ELIGIBLE_AGENT");
  assert.equal(decision.approvalRequired, true);
  assert.equal(
    decision.rejected.some(
      (item) =>
        item.agentId === "CLEVONE_FINANCE_AGENT"
        && item.reason === "RISK_EXCEEDS_AGENT_MAX",
    ),
    true,
  );
});

test("MEDIUM reconciliation requires human approval even when selected", () => {
  const registry = createDefaultAgentRegistry();
  const decision = registry.select({
    taskType: "payment.proof_uploaded",
    requiredCapabilities: ["extract", "reconcile"],
    requiredTools: ["payments.reconcile.recommend"],
    risk: "MEDIUM",
  });
  assert.equal(decision.agent?.id, "CLEVONE_FINANCE_AGENT");
  assert.equal(decision.approvalRequired, true);
});

test("tool allowlist rejects agents that lack the requested tool", () => {
  const registry = createDefaultAgentRegistry();
  const decision = registry.select({
    taskType: "dev.implement",
    requiredCapabilities: ["code"],
    requiredTools: ["payments.reconcile.recommend"],
    risk: "LOW",
  });
  assert.equal(decision.agent, null);
  assert.equal(
    decision.rejected.some(
      (item) =>
        item.agentId === "CURSOR_DEV_WORKER"
        && item.reason === "TOOL_NOT_ALLOWLISTED",
    ),
    true,
  );
});

test("development tasks select Cursor, not a chat provider", () => {
  const registry = createDefaultAgentRegistry();
  const decision = registry.select({
    taskType: "github.ci_failed",
    requiredCapabilities: ["code", "review"],
    risk: "LOW",
    preferSpeed: true,
  });
  assert.equal(decision.agent?.id, "CURSOR_DEV_WORKER");
});

test("preferLowCost selects the cheaper eligible worker", () => {
  const registry = createDefaultAgentRegistry();
  const decision = registry.select({
    taskType: "summarize.internal",
    requiredCapabilities: ["summarize"],
    risk: "LOW",
    preferLowCost: true,
    contentSensitivity: "none",
  });
  assert.equal(decision.agent?.id, "CLEVONE_ADMIN_AGENT");
  assert.equal(decision.agent?.estimatedCostPerTask, 1);
});

test("disabled workers are skipped", () => {
  const registry = mutableRegistry();
  registry.disable("CLEVONE_FINANCE_AGENT", { layer: "DEVELOPER" });
  const decision = registry.select({
    taskType: "payment.proof_uploaded",
    requiredCapabilities: ["reconcile"],
    risk: "LOW",
  });
  assert.notEqual(decision.agent?.id, "CLEVONE_FINANCE_AGENT");
  assert.equal(
    decision.rejected.some(
      (item) =>
        item.agentId === "CLEVONE_FINANCE_AGENT"
        && item.reason === "STATUS_DISABLED",
    ),
    true,
  );
});

test("get returns a clone so callers cannot expand tools in place", () => {
  const registry = mutableRegistry();
  const agent = registry.get("CLEVONE_FINANCE_AGENT");
  assert.ok(agent);
  (agent.allowedTools as string[]).push("payments.send");
  assert.equal(
    registry.get("CLEVONE_FINANCE_AGENT")?.allowedTools.includes("payments.send"),
    false,
  );
});
