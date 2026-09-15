/**
 * CLEVONE Agentic Core — provider-independent types.
 * Providers are interchangeable workers. This module must not import any vendor SDK.
 */

export const POLICY_LAYERS = [
  "SYSTEM",
  "DEVELOPER",
  "BUSINESS",
  "USER",
  "EXTERNAL",
] as const;

export type PolicyLayer = (typeof POLICY_LAYERS)[number];

/** Layers that may change routing/policy. EXTERNAL and USER content are data only. */
export const EXECUTABLE_POLICY_LAYERS = [
  "SYSTEM",
  "DEVELOPER",
  "BUSINESS",
] as const satisfies readonly PolicyLayer[];

export type AgentProviderId =
  | "internal"
  | "grok"
  | "openai"
  | "cursor"
  | "future";

export const AGENT_PROVIDER_IDS = [
  "internal",
  "grok",
  "openai",
  "cursor",
  "future",
] as const satisfies readonly AgentProviderId[];

export type AgentStatus =
  | "available"
  | "degraded"
  | "unavailable"
  | "disabled";

export type AgentTrustLevel = "low" | "medium" | "high";

export type AgentRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const AGENT_RISK_LEVELS = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const satisfies readonly AgentRiskLevel[];

export const AGENT_RISK_RANK: Record<AgentRiskLevel, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

export type AgentCapability =
  | "classify"
  | "extract"
  | "summarize"
  | "search"
  | "draft"
  | "reconcile"
  | "code"
  | "review"
  | "crm"
  | "documents"
  | "admin_ops";

export const AGENT_CAPABILITIES = [
  "classify",
  "extract",
  "summarize",
  "search",
  "draft",
  "reconcile",
  "code",
  "review",
  "crm",
  "documents",
  "admin_ops",
] as const satisfies readonly AgentCapability[];

export type ContentSensitivity = "none" | "internal" | "confidential";

export type AgentLimits = {
  maxRisk: AgentRiskLevel;
  maxConcurrency: number;
  /** Human approval is required when task risk is at or above this level. */
  requiresHumanAboveRisk: AgentRiskLevel;
  /** External providers may not receive confidential payloads. */
  allowConfidentialContent: boolean;
};

export type AgentDefinition = {
  id: string;
  displayName: string;
  provider: AgentProviderId;
  /** Model identifier for the provider, or null for deterministic internal workers. */
  model: string | null;
  capabilities: readonly AgentCapability[];
  allowedTools: readonly string[];
  permissions: readonly string[];
  /** Abstract cost units per typical task — not a live vendor quote. */
  estimatedCostPerTask: number;
  /** Lower number = preferred when other scores are equal. */
  priority: number;
  availability: AgentStatus;
  status: AgentStatus;
  limits: AgentLimits;
  trustLevel: AgentTrustLevel;
};

export type TaskRoutingRequest = {
  taskType: string;
  requiredCapabilities: readonly AgentCapability[];
  requiredTools?: readonly string[];
  risk: AgentRiskLevel;
  preferLowCost?: boolean;
  preferSpeed?: boolean;
  contentSensitivity?: ContentSensitivity;
  /** Data provenance. EXTERNAL never mutates the registry or policy. */
  contentLayer?: PolicyLayer;
};

export type AgentRejection = {
  agentId: string;
  reason: string;
};

export type AgentRoutingDecision = {
  agent: AgentDefinition | null;
  reason: string;
  approvalRequired: boolean;
  rejected: AgentRejection[];
};

/**
 * Provider adapter contract. Implementations live behind this interface.
 * execute/stream/useTools are intentionally absent from the P0 registry:
 * they belong to the Tool Gateway (later task) so agents cannot call systems directly.
 */
export type AgentProviderAdapter = {
  readonly id: AgentProviderId;
  healthCheck(): Promise<{ ok: boolean; status: AgentStatus }>;
  getCapabilities(): readonly AgentCapability[];
  estimateCost(taskType: string): number;
};
