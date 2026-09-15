export { DEFAULT_AGENT_CATALOG } from "@/lib/agentic/catalog";
export {
  AgentRegistry,
  AgentRegistryError,
  assertMutablePolicyLayer,
  createDefaultAgentRegistry,
  isExecutablePolicyLayer,
} from "@/lib/agentic/registry";
export {
  AGENT_CAPABILITIES,
  AGENT_PROVIDER_IDS,
  AGENT_RISK_LEVELS,
  AGENT_RISK_RANK,
  EXECUTABLE_POLICY_LAYERS,
  POLICY_LAYERS,
  type AgentCapability,
  type AgentDefinition,
  type AgentLimits,
  type AgentProviderAdapter,
  type AgentProviderId,
  type AgentRejection,
  type AgentRiskLevel,
  type AgentRoutingDecision,
  type AgentStatus,
  type AgentTrustLevel,
  type ContentSensitivity,
  type PolicyLayer,
  type TaskRoutingRequest,
} from "@/lib/agentic/types";
export {
  DOMAIN_EVENT_TYPES,
  DomainEventConflictError,
  DomainEventLog,
  buildDomainEvent,
  digestPayload,
  isDomainEventType,
} from "@/lib/agentic/events";
export type {
  DomainEventActor,
  DomainEventEnvelope,
  DomainEventSource,
  DomainEventType,
  RecordEventInput,
  RecordEventResult,
} from "@/lib/agentic/events";
export {
  envelopeFromClevoneGatewayEvent,
  proofUploadedEnvelope,
} from "@/lib/agentic/payment-events";
export {
  BUSINESS_TOOL_IDS,
  BusinessToolError,
  evaluateAgentTool,
  isBusinessToolId,
  isHumanActionType,
  policyForBusinessTool,
  riskForBusinessTool,
} from "@/lib/agentic/tools";
export type { AgentToolEvaluation, BusinessToolId } from "@/lib/agentic/tools";
export {
  AGENT_TOOL_EVALUATED_ACTION,
  AgentAuditLog,
  buildAgentAuditRecord,
  toAdminAuditLogInput,
} from "@/lib/agentic/audit";
export type { AgentAuditRecord, AgentAuditStatus } from "@/lib/agentic/audit";
export {
  ToolGateway,
  ToolGatewayError,
  createDefaultToolGateway,
} from "@/lib/agentic/gateway";
export type {
  ToolGatewayApproval,
  ToolHandler,
  ToolHandlerResult,
  ToolInvokeInput,
  ToolInvokeResult,
} from "@/lib/agentic/gateway";
export {
  financeAgentOrThrow,
  runFinanceProofUploadedSlice,
} from "@/lib/agentic/finance-slice";
export type {
  FinanceSliceInput,
  FinanceSliceResult,
} from "@/lib/agentic/finance-slice";
export {
  recommendFinanceReconciliation,
  runFinanceAgentTask,
} from "@/lib/agentic/finance-agent";
export type {
  FinanceAgentTaskInput,
  FinanceRecommendInput,
  FinanceRecommendResult,
} from "@/lib/agentic/finance-agent";
export { recommendLeadQualify } from "@/lib/agentic/commercial-agent";
export type {
  CommercialQualifyInput,
  CommercialQualifyResult,
} from "@/lib/agentic/commercial-agent";
export { recommendDocumentClassify } from "@/lib/agentic/dms-agent";
export type {
  DmsClassifyInput,
  DmsClassifyResult,
} from "@/lib/agentic/dms-agent";
export {
  appendAgenticApproval,
  appendAgenticAudit,
  appendAgenticEvent,
  appendAgenticOrchestration,
  loadAgenticJournal,
} from "@/lib/agentic/persistence";
export type {
  AgenticJournalSnapshot,
  PersistedApprovalRow,
} from "@/lib/agentic/persistence";
export {
  buildAgenticObservabilitySnapshot,
  loadAgenticObservabilitySnapshot,
  orchestrationRowFromResult,
} from "@/lib/agentic/observability";
export {
  BusinessOrchestrator,
  classifyBusinessEvent,
  createBusinessOrchestrator,
  knownDomainEventTypes,
  runBusinessOrchestration,
} from "@/lib/agentic/orchestrator";
export type {
  BusinessOrchestrationInput,
  BusinessOrchestrationResult,
  BusinessTaskClass,
  ClassifiedBusinessTask,
  OrchestrationStep,
  OrchestrationStepName,
} from "@/lib/agentic/orchestrator";
export {
  createProviderAdapter,
  isAgentProviderId,
  listStubProviderIds,
} from "@/lib/agentic/providers";
export type {
  LiveProviderCallResult,
  StubProviderAdapter,
  StubProviderId,
} from "@/lib/agentic/providers";
export {
  BusinessApprovalEngine,
  consumeBusinessApproval,
  createBusinessApprovalEngine,
  issueBusinessApproval,
} from "@/lib/agentic/approvals";
export type {
  BusinessApprovalRecord,
  ConsumeBusinessApprovalInput,
  ConsumeBusinessApprovalResult,
  IssueBusinessApprovalInput,
} from "@/lib/agentic/approvals";
