import { randomUUID } from "node:crypto";

import { sanitizeAuditValue } from "@/lib/x200/actions/audit";
import type { ActionRisk } from "@/lib/x200/actions/types";
import type { AgentDefinition, AgentProviderId } from "@/lib/agentic/types";
import {
  evaluateAgentTool,
  type AgentToolEvaluation,
} from "@/lib/agentic/tools";

/** Matches lib/admin/audit.ts auditActions.AGENT_TOOL_EVALUATED — no Prisma import here. */
export const AGENT_TOOL_EVALUATED_ACTION = "AGENT_TOOL_EVALUATED" as const;

export const AGENT_AUDIT_STATUSES = [
  "accepted",
  "denied",
  "pending_approval",
] as const;

export type AgentAuditStatus = (typeof AGENT_AUDIT_STATUSES)[number];

export type AgentAuditRecord = {
  id: string;
  agent_id: string;
  provider: AgentProviderId;
  action: string;
  tool: string;
  risk: ActionRisk | null;
  approval_required: boolean;
  status: AgentAuditStatus;
  code: string;
  at: string;
  correlationId: string | null;
  metadata: Record<string, unknown>;
};

export type RecordAgentAuditInput = {
  agent: AgentDefinition;
  action: string;
  tool: string;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
  at?: string;
};

function statusFromEvaluation(evaluation: AgentToolEvaluation): AgentAuditStatus {
  if (!evaluation.allowed) return "denied";
  if (evaluation.approval_required) return "pending_approval";
  return "accepted";
}

export function buildAgentAuditRecord(
  input: RecordAgentAuditInput,
  evaluation: AgentToolEvaluation,
): AgentAuditRecord {
  const raw: AgentAuditRecord = {
    id: randomUUID(),
    agent_id: input.agent.id,
    provider: input.agent.provider,
    action: input.action,
    tool: input.tool,
    risk: evaluation.risk,
    approval_required: evaluation.approval_required,
    status: statusFromEvaluation(evaluation),
    code: evaluation.code,
    at: input.at ?? new Date().toISOString(),
    correlationId: input.correlationId ?? null,
    metadata: sanitizeAuditValue(input.metadata ?? {}) as Record<string, unknown>,
  };
  return sanitizeAuditValue(raw) as AgentAuditRecord;
}

export function toAdminAuditLogInput(record: AgentAuditRecord) {
  return {
    action: AGENT_TOOL_EVALUATED_ACTION,
    entityType: "agent",
    entityId: record.agent_id,
    metadata: sanitizeAuditValue({
      agent_id: record.agent_id,
      provider: record.provider,
      action: record.action,
      tool: record.tool,
      risk: record.risk,
      approval_required: record.approval_required,
      status: record.status,
      code: record.code,
      correlationId: record.correlationId,
    }),
  };
}

export class AgentAuditLog {
  private readonly records: AgentAuditRecord[] = [];

  evaluateAndRecord(input: RecordAgentAuditInput): {
    evaluation: AgentToolEvaluation;
    record: AgentAuditRecord;
  } {
    const evaluation = evaluateAgentTool(input.agent, input.tool);
    const record = buildAgentAuditRecord(input, evaluation);
    this.records.push(record);
    return { evaluation, record };
  }

  list(): AgentAuditRecord[] {
    return this.records.map((row) => ({ ...row }));
  }
}
