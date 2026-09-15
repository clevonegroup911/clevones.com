import { createHash, randomBytes } from "node:crypto";

import { AgentAuditLog } from "@/lib/agentic/audit";
import type { ToolGatewayApproval } from "@/lib/agentic/gateway";
import { createDefaultAgentRegistry } from "@/lib/agentic/registry";
import { isBusinessToolId, type BusinessToolId } from "@/lib/agentic/tools";
import type { AgentDefinition } from "@/lib/agentic/types";

const DEFAULT_TTL_MS = 10 * 60 * 1000;

export type BusinessApprovalRecord = {
  token: string;
  /** SHA-256 of token — stored for audit without echoing the secret. */
  tokenDigest: string;
  agentId: string;
  tool: BusinessToolId;
  reason: string;
  issuedAt: string;
  expiresAt: string;
  consumedAt: string | null;
  issuerId: string;
};

export type IssueBusinessApprovalInput = {
  agentId: string;
  tool: string;
  reason: string;
  issuerId: string;
  ttlMs?: number;
  nowMs?: number;
  /** Optional agent definition for audit evaluation; defaults to catalog lookup. */
  agent?: AgentDefinition;
};

export type ConsumeBusinessApprovalInput = {
  token: string;
  agentId: string;
  tool: string;
  nowMs?: number;
};

export type ConsumeBusinessApprovalResult =
  | { ok: true; approval: BusinessApprovalRecord; gateway: ToolGatewayApproval }
  | {
      ok: false;
      code:
        | "APPROVAL_NOT_FOUND"
        | "APPROVAL_EXPIRED"
        | "APPROVAL_CONSUMED"
        | "APPROVAL_AGENT_MISMATCH"
        | "APPROVAL_TOOL_MISMATCH"
        | "UNKNOWN_BUSINESS_TOOL";
      approval: BusinessApprovalRecord | null;
    };

function digestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function redactReason(reason: string): string {
  return reason
    .replace(/(api[_-]?key|token|secret|password)\s*[:=]\s*\S+/gi, "$1=[REDACTED]")
    .slice(0, 400);
}

/**
 * In-process single-use business approval store.
 * Distinct from ops `lib/x200/actions/approvals.ts` (merge/deploy gates).
 */
export class BusinessApprovalEngine {
  private readonly byDigest = new Map<string, BusinessApprovalRecord>();
  private readonly audit: AgentAuditLog;

  constructor(options?: { audit?: AgentAuditLog }) {
    this.audit = options?.audit ?? new AgentAuditLog();
  }

  get size(): number {
    return this.byDigest.size;
  }

  get auditLog(): AgentAuditLog {
    return this.audit;
  }

  list(): BusinessApprovalRecord[] {
    return [...this.byDigest.values()].map((r) => ({
      ...r,
      // Never leak raw token via list().
      token: "",
    }));
  }

  issue(input: IssueBusinessApprovalInput): BusinessApprovalRecord {
    if (!isBusinessToolId(input.tool)) {
      throw new Error(`UNKNOWN_BUSINESS_TOOL:${input.tool}`);
    }
    const agent =
      input.agent
      ?? createDefaultAgentRegistry().get(input.agentId)
      ?? null;
    if (!agent) {
      throw new Error(`UNKNOWN_AGENT:${input.agentId}`);
    }

    const now = input.nowMs ?? Date.now();
    const ttl = input.ttlMs ?? DEFAULT_TTL_MS;
    const token = `bizapr_${randomBytes(24).toString("hex")}`;
    const record: BusinessApprovalRecord = {
      token,
      tokenDigest: digestToken(token),
      agentId: input.agentId,
      tool: input.tool,
      reason: redactReason(input.reason),
      issuedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttl).toISOString(),
      consumedAt: null,
      issuerId: input.issuerId,
    };
    this.byDigest.set(record.tokenDigest, record);
    this.audit.evaluateAndRecord({
      agent,
      action: "approval.issue",
      tool: input.tool,
      correlationId: null,
      metadata: {
        tokenDigest: record.tokenDigest,
        issuerId: input.issuerId,
        reason: record.reason,
      },
      at: record.issuedAt,
    });
    return { ...record };
  }

  consume(input: ConsumeBusinessApprovalInput): ConsumeBusinessApprovalResult {
    if (!isBusinessToolId(input.tool)) {
      return { ok: false, code: "UNKNOWN_BUSINESS_TOOL", approval: null };
    }
    const digest = digestToken(input.token);
    const found = this.byDigest.get(digest);
    if (!found) {
      return { ok: false, code: "APPROVAL_NOT_FOUND", approval: null };
    }
    if (found.consumedAt) {
      return {
        ok: false,
        code: "APPROVAL_CONSUMED",
        approval: { ...found, token: "" },
      };
    }
    const now = input.nowMs ?? Date.now();
    if (Date.parse(found.expiresAt) <= now) {
      return {
        ok: false,
        code: "APPROVAL_EXPIRED",
        approval: { ...found, token: "" },
      };
    }
    if (found.agentId !== input.agentId) {
      return {
        ok: false,
        code: "APPROVAL_AGENT_MISMATCH",
        approval: { ...found, token: "" },
      };
    }
    if (found.tool !== input.tool) {
      return {
        ok: false,
        code: "APPROVAL_TOOL_MISMATCH",
        approval: { ...found, token: "" },
      };
    }

    found.consumedAt = new Date(now).toISOString();
    this.byDigest.set(digest, found);

    const gateway: ToolGatewayApproval = {
      token: input.token,
      tool: found.tool,
      agentId: found.agentId,
      expiresAt: found.expiresAt,
    };
    return { ok: true, approval: { ...found }, gateway };
  }

  /** Convert issued record to gateway approval payload. */
  toGatewayApproval(record: BusinessApprovalRecord): ToolGatewayApproval {
    return {
      token: record.token,
      tool: record.tool,
      agentId: record.agentId,
      expiresAt: record.expiresAt,
    };
  }
}

export function createBusinessApprovalEngine(
  options?: { audit?: AgentAuditLog },
): BusinessApprovalEngine {
  return new BusinessApprovalEngine(options);
}

export function issueBusinessApproval(
  input: IssueBusinessApprovalInput,
  engine = createBusinessApprovalEngine(),
): BusinessApprovalRecord {
  return engine.issue(input);
}

export function consumeBusinessApproval(
  input: ConsumeBusinessApprovalInput,
  engine: BusinessApprovalEngine,
): ConsumeBusinessApprovalResult {
  return engine.consume(input);
}
