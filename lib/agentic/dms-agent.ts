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

export type DmsClassifyInput = {
  documentId: string;
  title?: string;
  mimeType?: string;
  approval?: ToolGatewayApproval | null;
  correlationId?: string;
};

export type DmsClassifyResult = {
  routing: AgentRoutingDecision;
  gatewayMetadata: ToolInvokeResult | null;
  gatewayClassify: ToolInvokeResult | null;
  label: string | null;
  contentEchoed: false;
  bytesEchoed: false;
  exported: false;
  approvalRequired: boolean;
};

/**
 * DMS Agent: metadata read + classify stub. Never echoes file content or exports bytes.
 */
export async function recommendDocumentClassify(
  input: DmsClassifyInput,
  options?: { registry?: AgentRegistry; gateway?: ToolGateway },
): Promise<DmsClassifyResult> {
  const registry = options?.registry ?? createDefaultAgentRegistry();
  const gateway = options?.gateway ?? createDefaultToolGateway();

  const routing = registry.select({
    taskType: "document.uploaded",
    requiredCapabilities: ["classify", "documents"],
    requiredTools: ["documents.read.metadata", "documents.classify"],
    risk: "MEDIUM",
    contentSensitivity: "confidential",
    contentLayer: "EXTERNAL",
  });

  const agent = routing.agent;
  if (!agent) {
    return {
      routing,
      gatewayMetadata: null,
      gatewayClassify: null,
      label: null,
      contentEchoed: false,
      bytesEchoed: false,
      exported: false,
      approvalRequired: true,
    };
  }

  const correlationId = input.correlationId ?? `dms:${input.documentId}`;
  const gatewayMetadata = await gateway.invoke({
    agent,
    tool: "documents.read.metadata",
    correlationId,
    approval: null,
    input: {
      documentId: input.documentId,
      title: input.title ?? null,
      mimeType: input.mimeType ?? null,
    },
  });

  const gatewayClassify = await gateway.invoke({
    agent,
    tool: "documents.classify",
    correlationId,
    approval: input.approval ?? null,
    input: {
      documentId: input.documentId,
      title: input.title ?? null,
      mimeType: input.mimeType ?? null,
    },
  });

  const label =
    gatewayClassify.status === "executed"
    && typeof gatewayClassify.output?.label === "string"
      ? gatewayClassify.output.label
      : null;

  return {
    routing,
    gatewayMetadata,
    gatewayClassify,
    label,
    contentEchoed: false,
    bytesEchoed: false,
    exported: false,
    approvalRequired:
      gatewayClassify.status !== "executed"
      || label === null
      || label === "UNCLASSIFIED",
  };
}
