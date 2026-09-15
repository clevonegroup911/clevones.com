import { DEFAULT_AGENT_CATALOG } from "@/lib/agentic/catalog";
import type { AgentAuditRecord } from "@/lib/agentic/audit";
import type { OrchestrationStep } from "@/lib/agentic/orchestrator";
import type {
  AgentProviderId,
  AgentStatus,
} from "@/lib/agentic/types";

export type AgenticAgentRow = {
  id: string;
  displayName: string;
  provider: AgentProviderId;
  status: AgentStatus;
  estimatedCostPerTask: number;
  maxRisk: string;
  toolCount: number;
};

export type AgenticAuditRow = {
  id: string;
  agentId: string;
  provider: AgentProviderId;
  tool: string;
  status: string;
  code: string;
  at: string;
  approvalRequired: boolean;
};

export type AgenticOrchestrationRow = {
  correlationId: string;
  taskClass: string;
  status: string;
  steps: Array<{ name: string; ok: boolean; detail: string }>;
  moneyMoved: false;
};

export type AgenticObservabilitySnapshot = {
  generatedAt: string;
  agents: AgenticAgentRow[];
  recentAudits: AgenticAuditRow[];
  recentOrchestrations: AgenticOrchestrationRow[];
  liveProvidersDisabled: true;
  note: string;
};

function auditToRow(record: AgentAuditRecord): AgenticAuditRow {
  return {
    id: record.id,
    agentId: record.agent_id,
    provider: record.provider,
    tool: record.tool,
    status: record.status,
    code: record.code,
    at: record.at,
    approvalRequired: record.approval_required,
  };
}

/**
 * Read-only agentic observability snapshot for Control Center.
 * Never includes approval tokens or provider secrets.
 */
export function buildAgenticObservabilitySnapshot(options?: {
  audits?: readonly AgentAuditRecord[];
  orchestrations?: readonly AgenticOrchestrationRow[];
  now?: string;
}): AgenticObservabilitySnapshot {
  const agents: AgenticAgentRow[] = DEFAULT_AGENT_CATALOG.map((a) => ({
    id: a.id,
    displayName: a.displayName,
    provider: a.provider,
    status: a.status,
    estimatedCostPerTask: a.estimatedCostPerTask,
    maxRisk: a.limits.maxRisk,
    toolCount: a.allowedTools.length,
  }));

  const recentAudits = (options?.audits ?? []).slice(-20).map(auditToRow);
  const recentOrchestrations = (options?.orchestrations ?? []).slice(-10);

  return {
    generatedAt: options?.now ?? new Date().toISOString(),
    agents,
    recentAudits,
    recentOrchestrations,
    liveProvidersDisabled: true,
    note: "In-process read-only snapshot. Live provider execute/stream remain PROVIDER_LIVE_DISABLED.",
  };
}

export function orchestrationRowFromResult(input: {
  correlationId: string;
  taskClass: string;
  status: string;
  steps: readonly OrchestrationStep[];
}): AgenticOrchestrationRow {
  return {
    correlationId: input.correlationId,
    taskClass: input.taskClass,
    status: input.status,
    steps: input.steps.map((s) => ({
      name: s.name,
      ok: s.ok,
      detail: s.detail.slice(0, 200),
    })),
    moneyMoved: false,
  };
}
