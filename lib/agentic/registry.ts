import { DEFAULT_AGENT_CATALOG } from "@/lib/agentic/catalog";
import {
  AGENT_PROVIDER_IDS,
  AGENT_RISK_RANK,
  EXECUTABLE_POLICY_LAYERS,
  type AgentCapability,
  type AgentDefinition,
  type AgentProviderId,
  type AgentRejection,
  type AgentRoutingDecision,
  type AgentStatus,
  type PolicyLayer,
  type TaskRoutingRequest,
} from "@/lib/agentic/types";

const AGENT_ID_PATTERN = /^[A-Z][A-Z0-9_]{2,63}$/;

export class AgentRegistryError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AgentRegistryError";
    this.code = code;
  }
}

function isProviderId(value: string): value is AgentProviderId {
  return (AGENT_PROVIDER_IDS as readonly string[]).includes(value);
}

function cloneAgent(agent: AgentDefinition): AgentDefinition {
  return {
    ...agent,
    capabilities: [...agent.capabilities],
    allowedTools: [...agent.allowedTools],
    permissions: [...agent.permissions],
    limits: { ...agent.limits },
  };
}

function validateAgent(agent: AgentDefinition): void {
  if (!AGENT_ID_PATTERN.test(agent.id)) {
    throw new AgentRegistryError(
      "INVALID_AGENT_ID",
      `Agent id must match ${AGENT_ID_PATTERN}: ${agent.id}`,
    );
  }
  if (!isProviderId(agent.provider)) {
    throw new AgentRegistryError(
      "UNKNOWN_PROVIDER",
      `Unknown provider ${String(agent.provider)}`,
    );
  }
  if (!Number.isFinite(agent.estimatedCostPerTask) || agent.estimatedCostPerTask < 0) {
    throw new AgentRegistryError("INVALID_COST", `Invalid cost for ${agent.id}`);
  }
  if (!Number.isInteger(agent.priority)) {
    throw new AgentRegistryError("INVALID_PRIORITY", `Invalid priority for ${agent.id}`);
  }
  if (agent.limits.maxConcurrency < 1) {
    throw new AgentRegistryError(
      "INVALID_LIMITS",
      `maxConcurrency must be >= 1 for ${agent.id}`,
    );
  }
}

export function isExecutablePolicyLayer(layer: PolicyLayer): boolean {
  return (EXECUTABLE_POLICY_LAYERS as readonly PolicyLayer[]).includes(layer);
}

/**
 * External documents, emails, web pages and user free text are DATA.
 * They cannot register agents, expand tools, or raise permissions.
 */
export function assertMutablePolicyLayer(layer: PolicyLayer | undefined): void {
  const resolved = layer ?? "DEVELOPER";
  if (!isExecutablePolicyLayer(resolved)) {
    throw new AgentRegistryError(
      "POLICY_LAYER_DENIED",
      `${resolved} content cannot mutate agent registry or policy`,
    );
  }
}

function isRunnable(agent: AgentDefinition): boolean {
  if (agent.status === "disabled" || agent.status === "unavailable") {
    return false;
  }
  return agent.availability === "available" || agent.availability === "degraded";
}

function hasAllCapabilities(
  agent: AgentDefinition,
  required: readonly AgentCapability[],
): boolean {
  return required.every((capability) => agent.capabilities.includes(capability));
}

function hasAllTools(
  agent: AgentDefinition,
  required: readonly string[] | undefined,
): boolean {
  if (!required || required.length === 0) {
    return true;
  }
  return required.every((tool) => agent.allowedTools.includes(tool));
}

function rejectReason(
  agent: AgentDefinition,
  request: TaskRoutingRequest,
): string | null {
  if (!isRunnable(agent)) {
    return `STATUS_${agent.status.toUpperCase()}`;
  }
  if (AGENT_RISK_RANK[request.risk] > AGENT_RISK_RANK[agent.limits.maxRisk]) {
    return "RISK_EXCEEDS_AGENT_MAX";
  }
  if (!hasAllCapabilities(agent, request.requiredCapabilities)) {
    return "MISSING_CAPABILITY";
  }
  if (!hasAllTools(agent, request.requiredTools)) {
    return "TOOL_NOT_ALLOWLISTED";
  }
  const sensitivity = request.contentSensitivity ?? "none";
  if (sensitivity === "confidential" && !agent.limits.allowConfidentialContent) {
    return "CONFIDENTIAL_CONTENT_BOUNDARY";
  }
  if (
    sensitivity === "confidential"
    && agent.provider !== "internal"
    && agent.provider !== "cursor"
  ) {
    return "EXTERNAL_PROVIDER_CONFIDENTIAL";
  }
  return null;
}

function compareCandidates(
  a: AgentDefinition,
  b: AgentDefinition,
  request: TaskRoutingRequest,
): number {
  const availRank = (agent: AgentDefinition) =>
    agent.availability === "available" ? 0 : 1;
  const availabilityDelta = availRank(a) - availRank(b);
  if (availabilityDelta !== 0) {
    return availabilityDelta;
  }

  if (request.preferLowCost) {
    const costDelta = a.estimatedCostPerTask - b.estimatedCostPerTask;
    if (costDelta !== 0) {
      return costDelta;
    }
  }

  if (request.preferSpeed) {
    const speedDelta = a.priority - b.priority;
    if (speedDelta !== 0) {
      return speedDelta;
    }
  }

  const trustRank = { high: 0, medium: 1, low: 2 };
  const trustDelta = trustRank[a.trustLevel] - trustRank[b.trustLevel];
  if (trustDelta !== 0) {
    return trustDelta;
  }

  const priorityDelta = a.priority - b.priority;
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const costDelta = a.estimatedCostPerTask - b.estimatedCostPerTask;
  if (costDelta !== 0) {
    return costDelta;
  }

  return a.id.localeCompare(b.id);
}

export class AgentRegistry {
  private readonly agents = new Map<string, AgentDefinition>();
  private frozen = false;

  constructor(seed: readonly AgentDefinition[] = []) {
    for (const agent of seed) {
      this.register(agent, { layer: "DEVELOPER" });
    }
  }

  freeze(): this {
    this.frozen = true;
    return this;
  }

  get size(): number {
    return this.agents.size;
  }

  register(
    agent: AgentDefinition,
    options: { layer?: PolicyLayer } = {},
  ): AgentDefinition {
    assertMutablePolicyLayer(options.layer);
    if (this.frozen) {
      throw new AgentRegistryError(
        "REGISTRY_FROZEN",
        "Default catalog is frozen; clone an unfrozen registry in tests",
      );
    }
    validateAgent(agent);
    const stored = cloneAgent(agent);
    this.agents.set(stored.id, stored);
    return cloneAgent(stored);
  }

  disable(agentId: string, options: { layer?: PolicyLayer } = {}): void {
    assertMutablePolicyLayer(options.layer);
    if (this.frozen) {
      throw new AgentRegistryError("REGISTRY_FROZEN", "Cannot disable a frozen registry");
    }
    const existing = this.agents.get(agentId);
    if (!existing) {
      throw new AgentRegistryError("AGENT_NOT_FOUND", agentId);
    }
    this.agents.set(agentId, { ...existing, status: "disabled", availability: "disabled" });
  }

  get(agentId: string): AgentDefinition | null {
    const found = this.agents.get(agentId);
    return found ? cloneAgent(found) : null;
  }

  list(status?: AgentStatus): AgentDefinition[] {
    return [...this.agents.values()]
      .filter((agent) => (status ? agent.status === status : true))
      .map(cloneAgent)
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  select(request: TaskRoutingRequest): AgentRoutingDecision {
    const rejected: AgentRejection[] = [];
    const eligible: AgentDefinition[] = [];

    for (const agent of this.agents.values()) {
      const reason = rejectReason(agent, request);
      if (reason) {
        rejected.push({ agentId: agent.id, reason });
        continue;
      }
      eligible.push(agent);
    }

    if (eligible.length === 0) {
      return {
        agent: null,
        reason: "NO_ELIGIBLE_AGENT",
        approvalRequired: AGENT_RISK_RANK[request.risk] >= AGENT_RISK_RANK.HIGH,
        rejected,
      };
    }

    eligible.sort((a, b) => compareCandidates(a, b, request));
    const chosen = cloneAgent(eligible[0]);
    const approvalRequired =
      AGENT_RISK_RANK[request.risk]
      >= AGENT_RISK_RANK[chosen.limits.requiresHumanAboveRisk];

    return {
      agent: chosen,
      reason: `SELECTED_${chosen.id}`,
      approvalRequired,
      rejected,
    };
  }
}

export function createDefaultAgentRegistry(): AgentRegistry {
  return new AgentRegistry(DEFAULT_AGENT_CATALOG).freeze();
}
