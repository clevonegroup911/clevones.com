import { AgentAuditLog } from "@/lib/agentic/audit";
import {
  DOMAIN_EVENT_TYPES,
  DomainEventLog,
  type RecordEventInput,
} from "@/lib/agentic/events";
import {
  runFinanceAgentTask,
} from "@/lib/agentic/finance-agent";
import {
  type FinanceSliceInput,
  type FinanceSliceResult,
} from "@/lib/agentic/finance-slice";
import {
  createDefaultToolGateway,
  type ToolGateway,
  type ToolGatewayApproval,
  type ToolInvokeResult,
} from "@/lib/agentic/gateway";
import {
  createDefaultAgentRegistry,
  type AgentRegistry,
} from "@/lib/agentic/registry";
import {
  AGENT_RISK_RANK,
  type AgentCapability,
  type AgentRiskLevel,
  type AgentRoutingDecision,
  type ContentSensitivity,
  type PolicyLayer,
} from "@/lib/agentic/types";

export type OrchestrationStepName =
  | "classify"
  | "risk"
  | "select"
  | "execute"
  | "verify"
  | "audit"
  | "blocked_pending_human";

export type OrchestrationStep = {
  name: OrchestrationStepName;
  at: string;
  detail: string;
  ok: boolean;
};

export type BusinessTaskClass =
  | "finance.reconcile"
  | "documents.classify"
  | "commercial.qualify"
  | "dev.code"
  | "admin.read"
  | "unknown";

export type ClassifiedBusinessTask = {
  taskClass: BusinessTaskClass;
  eventType: string;
  risk: AgentRiskLevel;
  requiredCapabilities: readonly AgentCapability[];
  requiredTools: readonly string[];
  contentSensitivity: ContentSensitivity;
  contentLayer: PolicyLayer;
};

export type BusinessOrchestrationInput = {
  /** Domain event to record (or already-shaped envelope fields). */
  event: RecordEventInput;
  /** Finance payload when eventType is payment.proof_uploaded. */
  finance?: Omit<FinanceSliceInput, "idempotencyKey"> & {
    idempotencyKey?: string;
  };
  approval?: ToolGatewayApproval | null;
};

export type BusinessOrchestrationResult = {
  status:
    | "completed"
    | "pending_approval"
    | "blocked_pending_human"
    | "denied"
    | "conflict";
  classification: ClassifiedBusinessTask;
  steps: OrchestrationStep[];
  correlationId: string;
  routing: AgentRoutingDecision | null;
  gateway: ToolInvokeResult | null;
  finance: FinanceSliceResult | null;
  moneyMoved: false;
};

function step(
  name: OrchestrationStepName,
  detail: string,
  ok: boolean,
): OrchestrationStep {
  return { name, at: new Date().toISOString(), detail, ok };
}

/**
 * Maps event types to business task classes and baseline risk.
 * EXTERNAL content never raises privileges — risk stays at least MEDIUM for uploads.
 */
export function classifyBusinessEvent(
  eventType: string,
  contentLayer: PolicyLayer,
): ClassifiedBusinessTask {
  const layer = contentLayer;

  if (eventType === "payment.proof_uploaded" || eventType === "payment.reconciliation_failed") {
    return {
      taskClass: "finance.reconcile",
      eventType,
      risk: "MEDIUM",
      requiredCapabilities: ["extract", "reconcile"],
      requiredTools: ["payments.reconcile.recommend"],
      contentSensitivity: layer === "EXTERNAL" ? "confidential" : "internal",
      contentLayer: layer,
    };
  }
  if (
    eventType === "document.uploaded"
    || eventType === "document.approval_requested"
    || eventType === "document.expiring"
  ) {
    return {
      taskClass: "documents.classify",
      eventType,
      risk: layer === "EXTERNAL" ? "MEDIUM" : "LOW",
      requiredCapabilities: ["classify", "documents"],
      requiredTools: ["documents.read.metadata"],
      contentSensitivity: layer === "EXTERNAL" ? "confidential" : "internal",
      contentLayer: layer,
    };
  }
  if (eventType === "lead.created" || eventType === "lead.qualified" || eventType === "proposal.requested") {
    return {
      taskClass: "commercial.qualify",
      eventType,
      risk: "MEDIUM",
      requiredCapabilities: ["classify", "crm"],
      requiredTools: ["crm.read"],
      contentSensitivity: "internal",
      contentLayer: layer,
    };
  }
  if (eventType === "github.ci_failed" || eventType === "github.pr_created") {
    return {
      taskClass: "dev.code",
      eventType,
      risk: "LOW",
      requiredCapabilities: ["code", "review"],
      requiredTools: ["git.read"],
      contentSensitivity: "internal",
      contentLayer: "DEVELOPER",
    };
  }
  if (eventType === "task.completed" || eventType === "task.failed") {
    return {
      taskClass: "admin.read",
      eventType,
      risk: "LOW",
      requiredCapabilities: ["admin_ops"],
      requiredTools: ["x200.status.read"],
      contentSensitivity: "none",
      contentLayer: layer,
    };
  }

  return {
    taskClass: "unknown",
    eventType,
    risk: "HIGH",
    requiredCapabilities: [],
    requiredTools: [],
    contentSensitivity: "confidential",
    contentLayer: layer,
  };
}

function requiresHumanGate(risk: AgentRiskLevel): boolean {
  return AGENT_RISK_RANK[risk] >= AGENT_RISK_RANK.HIGH;
}

export type BusinessOrchestratorOptions = {
  events?: DomainEventLog;
  registry?: AgentRegistry;
  gateway?: ToolGateway;
  audit?: AgentAuditLog;
};

/**
 * In-process business orchestrator.
 * Does not replace X200 Autopilot (dev plane). Never moves money.
 */
export class BusinessOrchestrator {
  private readonly events: DomainEventLog;
  private readonly registry: AgentRegistry;
  private readonly gateway: ToolGateway;
  private readonly audit: AgentAuditLog;

  constructor(options: BusinessOrchestratorOptions = {}) {
    this.events = options.events ?? new DomainEventLog();
    this.registry = options.registry ?? createDefaultAgentRegistry();
    this.gateway = options.gateway ?? createDefaultToolGateway(options.audit);
    this.audit = options.audit ?? this.gateway.audit;
  }

  async run(input: BusinessOrchestrationInput): Promise<BusinessOrchestrationResult> {
    const steps: OrchestrationStep[] = [];
    const classification = classifyBusinessEvent(
      input.event.eventType,
      input.event.contentLayer,
    );
    steps.push(
      step("classify", `${classification.taskClass}:${classification.eventType}`, true),
    );
    steps.push(step("risk", classification.risk, true));

    if (requiresHumanGate(classification.risk)) {
      steps.push(
        step(
          "blocked_pending_human",
          "HIGH/CRITICAL requires human gate — no auto execution",
          true,
        ),
      );
      const recorded = this.events.record(input.event);
      return {
        status: "blocked_pending_human",
        classification,
        steps,
        correlationId: recorded.event.correlationId,
        routing: null,
        gateway: null,
        finance: null,
        moneyMoved: false,
      };
    }

    if (classification.taskClass === "finance.reconcile") {
      return this.runFinance(input, classification, steps);
    }

    return this.runGenericTool(input, classification, steps);
  }

  private async runFinance(
    input: BusinessOrchestrationInput,
    classification: ClassifiedBusinessTask,
    steps: OrchestrationStep[],
  ): Promise<BusinessOrchestrationResult> {
    if (!input.finance) {
      steps.push(step("execute", "FINANCE_PAYLOAD_REQUIRED", false));
      return {
        status: "denied",
        classification,
        steps,
        correlationId: input.event.correlationId,
        routing: null,
        gateway: null,
        finance: null,
        moneyMoved: false,
      };
    }

    const finance = await runFinanceAgentTask(
      {
        ...input.finance,
        idempotencyKey: input.finance.idempotencyKey ?? input.event.idempotencyKey,
        eventType:
          input.event.eventType === "payment.reconciliation_failed"
            ? "payment.reconciliation_failed"
            : "payment.proof_uploaded",
      },
      {
        events: this.events,
        registry: this.registry,
        gateway: this.gateway,
      },
    );

    steps.push(step("select", finance.routing.reason, Boolean(finance.routing.agent)));
    steps.push(
      step(
        "execute",
        finance.gateway?.code ?? "NO_GATEWAY",
        finance.gateway?.status === "executed" || finance.gateway?.status === "pending_approval",
      ),
    );
    steps.push(
      step(
        "verify",
        finance.decision?.status ?? "NO_DECISION",
        finance.moneyMoved === false && finance.verifiedActivated === false,
      ),
    );
    steps.push(
      step("audit", `approvalRequired=${finance.approvalRequired}`, true),
    );

    const status = resolveFinanceStatus(finance);

    return {
      status,
      classification,
      steps,
      correlationId: finance.correlationId,
      routing: finance.routing,
      gateway: finance.gateway,
      finance,
      moneyMoved: false,
    };
  }

  private async runGenericTool(
    input: BusinessOrchestrationInput,
    classification: ClassifiedBusinessTask,
    steps: OrchestrationStep[],
  ): Promise<BusinessOrchestrationResult> {
    const recorded = this.events.record(input.event);
    if (recorded.status === "conflict") {
      steps.push(step("execute", "EVENT_CONFLICT", false));
      return {
        status: "conflict",
        classification,
        steps,
        correlationId: recorded.event.correlationId,
        routing: null,
        gateway: null,
        finance: null,
        moneyMoved: false,
      };
    }

    const routing = this.registry.select({
      taskType: classification.eventType,
      requiredCapabilities: classification.requiredCapabilities,
      requiredTools: classification.requiredTools,
      risk: classification.risk,
      contentSensitivity: classification.contentSensitivity,
      contentLayer: classification.contentLayer,
    });
    steps.push(step("select", routing.reason, Boolean(routing.agent)));

    if (!routing.agent || classification.requiredTools.length === 0) {
      steps.push(step("execute", "NO_ELIGIBLE_AGENT", false));
      steps.push(step("audit", "denied", true));
      return {
        status: "denied",
        classification,
        steps,
        correlationId: recorded.event.correlationId,
        routing,
        gateway: null,
        finance: null,
        moneyMoved: false,
      };
    }

    const tool = classification.requiredTools[0]!;
    const gateway = await this.gateway.invoke({
      agent: routing.agent,
      tool,
      correlationId: recorded.event.correlationId,
      approval: input.approval ?? null,
      input: { ...(input.event.payload ?? {}) },
    });
    steps.push(step("execute", gateway.code, gateway.status === "executed"));
    steps.push(
      step("verify", gateway.status, gateway.output?.moneyMoved !== true),
    );
    steps.push(step("audit", gateway.audit.status, true));

    const status =
      gateway.status === "executed"
        ? gateway.evaluation.approval_required
          ? "pending_approval"
          : "completed"
        : gateway.status === "pending_approval"
          ? "pending_approval"
          : "denied";

    return {
      status,
      classification,
      steps,
      correlationId: recorded.event.correlationId,
      routing,
      gateway,
      finance: null,
      moneyMoved: false,
    };
  }
}

export function createBusinessOrchestrator(
  options?: BusinessOrchestratorOptions,
): BusinessOrchestrator {
  return new BusinessOrchestrator(options);
}

/** Acceptance API: EVENT → classify → risk → select → execute → verify → audit. */
export async function runBusinessOrchestration(
  input: BusinessOrchestrationInput,
  options?: BusinessOrchestratorOptions,
): Promise<BusinessOrchestrationResult> {
  return createBusinessOrchestrator(options).run(input);
}

function resolveFinanceStatus(
  finance: FinanceSliceResult,
): BusinessOrchestrationResult["status"] {
  if (finance.eventStatus === "conflict") return "conflict";
  if (finance.gateway?.status === "denied") return "denied";
  if (finance.gateway?.status === "pending_approval") return "pending_approval";
  if (finance.approvalRequired) return "pending_approval";
  return "completed";
}

/** Helper for tests / callers: known domain event type list. */
export function knownDomainEventTypes(): readonly string[] {
  return DOMAIN_EVENT_TYPES;
}
