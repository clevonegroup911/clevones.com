import { AgentAuditLog, type AgentAuditRecord } from "@/lib/agentic/audit";
import type { BusinessApprovalEngine } from "@/lib/agentic/approvals";
import {
  evaluateAgentTool,
  isBusinessToolId,
  type AgentToolEvaluation,
  type BusinessToolId,
} from "@/lib/agentic/tools";
import { AGENT_RISK_RANK, type AgentDefinition } from "@/lib/agentic/types";
import type { ActionRisk } from "@/lib/x200/actions/types";

export type ToolGatewayApproval = {
  /** Single-use opaque token issued by a human approval path. */
  token: string;
  tool: BusinessToolId;
  agentId: string;
  expiresAt: string;
};

export type ToolHandlerResult = {
  ok: boolean;
  code: string;
  output: Record<string, unknown>;
};

export type ToolHandler = (
  input: Record<string, unknown>,
  context: { agent: AgentDefinition; correlationId: string | null },
) => ToolHandlerResult | Promise<ToolHandlerResult>;

export type ToolInvokeInput = {
  agent: AgentDefinition;
  tool: string;
  input?: Record<string, unknown>;
  correlationId?: string | null;
  /** Required when evaluation.approval_required or risk > LOW. */
  approval?: ToolGatewayApproval | null;
  at?: string;
};

export type ToolInvokeResult = {
  status: "executed" | "denied" | "pending_approval";
  code: string;
  evaluation: AgentToolEvaluation;
  audit: AgentAuditRecord;
  output: Record<string, unknown> | null;
};

const DEFAULT_HANDLERS: Partial<Record<BusinessToolId, ToolHandler>> = {
  "payments.read": (input) => ({
    ok: true,
    code: "PAYMENTS_READ",
    output: {
      paymentId: typeof input.paymentId === "string" ? input.paymentId : null,
      status: "read_only_stub",
    },
  }),
  "documents.read.metadata": (input) => ({
    ok: true,
    code: "DOCUMENT_METADATA",
    output: {
      documentId: typeof input.documentId === "string" ? input.documentId : null,
      title: typeof input.title === "string" ? input.title : null,
      mimeType: typeof input.mimeType === "string" ? input.mimeType : null,
      // Never echo file bytes or storage secrets.
      contentEchoed: false,
    },
  }),
  "documents.classify": (input) => {
    const title = typeof input.title === "string" ? input.title : "";
    const mimeType = typeof input.mimeType === "string" ? input.mimeType : "";
    let label = "UNCLASSIFIED";
    if (/contract|policy/i.test(title)) {
      label = "POLICY_CANDIDATE";
    } else if (/invoice|facture/i.test(title)) {
      label = "INVOICE_CANDIDATE";
    } else if (mimeType.includes("pdf")) {
      label = "DOCUMENT_PDF";
    }
    return {
      ok: true,
      code: "DOCUMENT_CLASSIFY",
      output: {
        documentId: typeof input.documentId === "string" ? input.documentId : null,
        label,
        confidence: label === "UNCLASSIFIED" ? 0.35 : 0.78,
        // Never echo file bytes, OCR text, or storage paths.
        contentEchoed: false,
        bytesEchoed: false,
        exported: false,
      },
    };
  },
  "audit.read": () => ({
    ok: true,
    code: "AUDIT_READ",
    output: { entries: [], note: "in_process_empty" },
  }),
  "x200.status.read": () => ({
    ok: true,
    code: "X200_STATUS",
    output: { plane: "agentic", merged: false, deployed: false },
  }),
  "search.internal": (input) => ({
    ok: true,
    code: "SEARCH_INTERNAL",
    output: {
      query: typeof input.query === "string" ? input.query.slice(0, 200) : "",
      hits: [],
    },
  }),
  "crm.read": (input) => ({
    ok: true,
    code: "CRM_READ",
    output: {
      leadId: typeof input.leadId === "string" ? input.leadId : null,
      email: typeof input.email === "string" ? input.email.slice(0, 120) : null,
      status: "read_only_stub",
      emailSent: false,
    },
  }),
  "crm.draft": (input) => ({
    ok: true,
    code: "CRM_DRAFT",
    output: {
      leadId: typeof input.leadId === "string" ? input.leadId : null,
      draftType: typeof input.draftType === "string" ? input.draftType : "qualify",
      body:
        typeof input.notes === "string"
          ? `DRAFT (no send): ${input.notes.slice(0, 280)}`
          : "DRAFT (no send): pending qualification",
      emailSent: false,
      mailQueued: false,
    },
  }),
  /**
   * Recommendation only — never activates VERIFIED payments or moves money.
   * Deterministic stub for gateway unit tests; T053 wires real scoring.
   */
  "payments.reconcile.recommend": (input) => {
    const amountCents =
      typeof input.amountCents === "number" && Number.isInteger(input.amountCents)
        ? input.amountCents
        : null;
    const reference = typeof input.reference === "string" ? input.reference : null;
    const score =
      amountCents !== null && amountCents > 0 && reference && reference.length >= 4
        ? 0.82
        : 0.35;
    return {
      ok: true,
      code: "RECONCILE_RECOMMENDATION",
      output: {
        recommendation: score >= 0.8 ? "MATCH_CANDIDATE" : "HUMAN_REVIEW",
        score,
        moneyMoved: false,
        verifiedActivated: false,
      },
    };
  },
};

function riskAboveLow(risk: ActionRisk | null): boolean {
  if (!risk) return true;
  return AGENT_RISK_RANK[risk] > AGENT_RISK_RANK.LOW;
}

export class ToolGatewayError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ToolGatewayError";
    this.code = code;
  }
}

/**
 * In-process Tool Gateway. Agents never call systems directly.
 * No shell, no network, no payout handlers.
 */
export class ToolGateway {
  private readonly auditLog: AgentAuditLog;
  private readonly handlers: Map<BusinessToolId, ToolHandler>;
  private readonly consumedApprovals = new Set<string>();
  private readonly approvalEngine: BusinessApprovalEngine | null;

  constructor(options?: {
    auditLog?: AgentAuditLog;
    handlers?: Partial<Record<BusinessToolId, ToolHandler>>;
    /** When set, gateway approvals must be issued by this engine (single-use). */
    approvalEngine?: BusinessApprovalEngine | null;
  }) {
    this.auditLog = options?.auditLog ?? new AgentAuditLog();
    this.approvalEngine = options?.approvalEngine ?? null;
    this.handlers = new Map();
    const merged = { ...DEFAULT_HANDLERS, ...(options?.handlers ?? {}) };
    for (const [tool, handler] of Object.entries(merged)) {
      if (handler && isBusinessToolId(tool)) {
        this.handlers.set(tool, handler);
      }
    }
  }

  get audit(): AgentAuditLog {
    return this.auditLog;
  }

  async invoke(input: ToolInvokeInput): Promise<ToolInvokeResult> {
    const evaluation = evaluateAgentTool(input.agent, input.tool);
    const { record } = this.auditLog.evaluateAndRecord({
      agent: input.agent,
      action: "tool.invoke",
      tool: input.tool,
      correlationId: input.correlationId ?? null,
      metadata: {
        hasApproval: Boolean(input.approval),
        inputKeys: Object.keys(input.input ?? {}),
      },
      at: input.at,
    });

    if (!evaluation.allowed) {
      return {
        status: "denied",
        code: evaluation.code,
        evaluation,
        audit: record,
        output: null,
      };
    }

    if (!isBusinessToolId(input.tool)) {
      return {
        status: "denied",
        code: "UNKNOWN_BUSINESS_TOOL",
        evaluation,
        audit: record,
        output: null,
      };
    }

    const handler = this.handlers.get(input.tool);
    if (!handler) {
      return {
        status: "denied",
        code: "NO_HANDLER",
        evaluation,
        audit: { ...record, status: "denied", code: "NO_HANDLER" },
        output: null,
      };
    }

    const needsApproval =
      evaluation.approval_required || riskAboveLow(evaluation.risk);
    if (needsApproval) {
      const approvalCheck = this.validateApproval(input, evaluation);
      if (!approvalCheck.ok) {
        const pending = {
          ...record,
          status: "pending_approval" as const,
          code: approvalCheck.code,
        };
        return {
          status: "pending_approval",
          code: approvalCheck.code,
          evaluation,
          audit: pending,
          output: null,
        };
      }
      this.consumedApprovals.add(input.approval!.token);
    }

    const result = await handler(input.input ?? {}, {
      agent: input.agent,
      correlationId: input.correlationId ?? null,
    });

    return {
      status: "executed",
      code: result.code,
      evaluation,
      audit: record,
      output: result.output,
    };
  }

  private validateApproval(
    input: ToolInvokeInput,
    evaluation: AgentToolEvaluation,
  ): { ok: true } | { ok: false; code: string } {
    const approval = input.approval;
    if (!approval) {
      return { ok: false, code: "APPROVAL_REQUIRED" };
    }
    if (this.consumedApprovals.has(approval.token)) {
      return { ok: false, code: "APPROVAL_CONSUMED" };
    }
    if (approval.agentId !== input.agent.id) {
      return { ok: false, code: "APPROVAL_AGENT_MISMATCH" };
    }
    if (approval.tool !== input.tool) {
      return { ok: false, code: "APPROVAL_TOOL_MISMATCH" };
    }
    if (Date.parse(approval.expiresAt) <= Date.now()) {
      return { ok: false, code: "APPROVAL_EXPIRED" };
    }
    if (!evaluation.risk) {
      return { ok: false, code: "APPROVAL_INVALID" };
    }
    if (this.approvalEngine) {
      const consumed = this.approvalEngine.consume({
        token: approval.token,
        agentId: input.agent.id,
        tool: input.tool,
      });
      if (!consumed.ok) {
        return { ok: false, code: consumed.code };
      }
    }
    return { ok: true };
  }
}

export function createDefaultToolGateway(auditLog?: AgentAuditLog): ToolGateway {
  return new ToolGateway({ auditLog });
}
