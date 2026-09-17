import { policyForRisk, type PolicyRequirements } from "@/lib/x200/actions/policy";
import { HUMAN_ACTION_TYPES, type ActionRisk } from "@/lib/x200/actions/types";
import { AGENT_RISK_RANK, type AgentDefinition } from "@/lib/agentic/types";

/**
 * Business-domain tools. Distinct from HUMAN_ACTION_TYPES (ops merge/deploy/payout).
 * Risk levels reuse the X200 ActionRisk ladder; enforcement goes through policyForRisk.
 */
export const BUSINESS_TOOL_IDS = [
  "payments.read",
  "payments.reconcile.recommend",
  "documents.read.metadata",
  "documents.classify",
  "documents.search",
  "crm.read",
  "crm.draft",
  "search.internal",
  "audit.read",
  "x200.status.read",
  "git.read",
  "ci.read",
  "repo.edit.authorized",
] as const;

export type BusinessToolId = (typeof BUSINESS_TOOL_IDS)[number];

const BUSINESS_TOOL_RISK: Record<BusinessToolId, ActionRisk> = {
  "payments.read": "LOW",
  "payments.reconcile.recommend": "MEDIUM",
  "documents.read.metadata": "LOW",
  "documents.classify": "MEDIUM",
  "documents.search": "LOW",
  "crm.read": "LOW",
  "crm.draft": "MEDIUM",
  "search.internal": "LOW",
  "audit.read": "LOW",
  "x200.status.read": "LOW",
  "git.read": "LOW",
  "ci.read": "LOW",
  "repo.edit.authorized": "HIGH",
};

export class BusinessToolError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "BusinessToolError";
    this.code = code;
  }
}

export function isHumanActionType(value: string): boolean {
  return (HUMAN_ACTION_TYPES as readonly string[]).includes(value);
}

export function isBusinessToolId(value: string): value is BusinessToolId {
  return (BUSINESS_TOOL_IDS as readonly string[]).includes(value);
}

export function assertBusinessToolsDistinctFromOps(): void {
  for (const tool of BUSINESS_TOOL_IDS) {
    if (isHumanActionType(tool)) {
      throw new BusinessToolError(
        "OPS_ACTION_IN_BUSINESS_ALLOWLIST",
        `Business tool ${tool} collides with HUMAN_ACTION_TYPES`,
      );
    }
  }
}

assertBusinessToolsDistinctFromOps();

export function riskForBusinessTool(tool: string): ActionRisk {
  if (isHumanActionType(tool)) {
    throw new BusinessToolError(
      "OPS_ACTION_NOT_BUSINESS_TOOL",
      `${tool} is an ops HUMAN_ACTION_TYPE, not a business tool`,
    );
  }
  if (!isBusinessToolId(tool)) {
    throw new BusinessToolError("UNKNOWN_BUSINESS_TOOL", tool);
  }
  return BUSINESS_TOOL_RISK[tool];
}

/** Same policy engine as ops actions: policyForRisk(riskFor…). */
export function policyForBusinessTool(tool: string): PolicyRequirements {
  return policyForRisk(riskForBusinessTool(tool));
}

export type AgentToolEvaluation = {
  allowed: boolean;
  code: string;
  tool: string;
  risk: ActionRisk | null;
  policy: PolicyRequirements | null;
  approval_required: boolean;
};

export function evaluateAgentTool(
  agent: AgentDefinition,
  tool: string,
): AgentToolEvaluation {
  if (isHumanActionType(tool)) {
    return {
      allowed: false,
      code: "OPS_ACTION_NOT_BUSINESS_TOOL",
      tool,
      risk: null,
      policy: null,
      approval_required: true,
    };
  }
  if (!isBusinessToolId(tool)) {
    return {
      allowed: false,
      code: "UNKNOWN_BUSINESS_TOOL",
      tool,
      risk: null,
      policy: null,
      approval_required: true,
    };
  }
  if (!agent.allowedTools.includes(tool)) {
    return {
      allowed: false,
      code: "TOOL_NOT_ALLOWLISTED",
      tool,
      risk: riskForBusinessTool(tool),
      policy: policyForBusinessTool(tool),
      approval_required: true,
    };
  }

  const risk = riskForBusinessTool(tool);
  const policy = policyForRisk(risk);
  if (AGENT_RISK_RANK[risk] > AGENT_RISK_RANK[agent.limits.maxRisk]) {
    return {
      allowed: false,
      code: "RISK_EXCEEDS_AGENT_MAX",
      tool,
      risk,
      policy,
      approval_required: true,
    };
  }

  const approval_required =
    AGENT_RISK_RANK[risk] >= AGENT_RISK_RANK[agent.limits.requiresHumanAboveRisk]
    || policy.requireMfa
    || policy.requireTypedPhrase;

  return {
    allowed: true,
    code: "OK",
    tool,
    risk,
    policy,
    approval_required,
  };
}
