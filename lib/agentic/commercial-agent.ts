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
import type { AgentRoutingDecision } from "@/lib/agentic/types";

export type CommercialQualifyInput = {
  leadId: string;
  email?: string;
  notes?: string;
  company?: string;
  approval?: ToolGatewayApproval | null;
  correlationId?: string;
};

export type CommercialQualifyResult = {
  routing: AgentRoutingDecision;
  gatewayRead: ToolInvokeResult | null;
  gatewayDraft: ToolInvokeResult | null;
  qualification: "HOT" | "WARM" | "COLD" | "HUMAN_REVIEW";
  emailSent: false;
  mailQueued: false;
  approvalRequired: boolean;
};

/**
 * Commercial Agent: read CRM stub + draft qualify note. Never sends email.
 */
export async function recommendLeadQualify(
  input: CommercialQualifyInput,
  options?: { registry?: AgentRegistry; gateway?: ToolGateway },
): Promise<CommercialQualifyResult> {
  const registry = options?.registry ?? createDefaultAgentRegistry();
  const gateway = options?.gateway ?? createDefaultToolGateway();

  const routing = registry.select({
    taskType: "lead.created",
    requiredCapabilities: ["classify", "crm"],
    requiredTools: ["crm.read", "crm.draft"],
    risk: "MEDIUM",
    contentSensitivity: "internal",
    contentLayer: "BUSINESS",
  });

  const agent = routing.agent;
  if (!agent) {
    return {
      routing,
      gatewayRead: null,
      gatewayDraft: null,
      qualification: "HUMAN_REVIEW",
      emailSent: false,
      mailQueued: false,
      approvalRequired: true,
    };
  }

  const correlationId = input.correlationId ?? `commercial:${input.leadId}`;
  const gatewayRead = await gateway.invoke({
    agent,
    tool: "crm.read",
    correlationId,
    approval: null,
    input: { leadId: input.leadId, email: input.email ?? null },
  });

  const gatewayDraft = await gateway.invoke({
    agent,
    tool: "crm.draft",
    correlationId,
    approval: input.approval ?? null,
    input: {
      leadId: input.leadId,
      draftType: "qualify",
      notes: input.notes ?? input.company ?? "",
    },
  });

  const hasCompany = Boolean(input.company && input.company.trim().length >= 2);
  const hasEmail = Boolean(input.email && input.email.includes("@"));
  const qualification =
    gatewayDraft.status !== "executed"
      ? "HUMAN_REVIEW"
      : hasCompany && hasEmail
        ? "WARM"
        : hasEmail
          ? "COLD"
          : "HUMAN_REVIEW";

  return {
    routing,
    gatewayRead,
    gatewayDraft,
    qualification,
    emailSent: false,
    mailQueued: false,
    approvalRequired:
      gatewayDraft.status === "pending_approval"
      || routing.approvalRequired
      || gatewayDraft.evaluation.approval_required
      || qualification === "HUMAN_REVIEW",
  };
}
