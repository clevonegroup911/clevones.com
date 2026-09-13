/** X200 Human Action Center types (T046). */

export type ActionRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type HumanActionStatus =
  | "WAITING"
  | "READY"
  | "APPROVED"
  | "EXECUTING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED";

export type HumanActionEnvironment = "LOCAL" | "STAGING" | "PRODUCTION";

export type HumanActionType =
  | "APPROVE_HUMAN_GATE"
  | "MARK_READY_FOR_REVIEW"
  | "MERGE_PR"
  | "DEPLOY_PRODUCTION"
  | "PREVIEW_MIGRATION"
  | "CREATE_BACKUP"
  | "VERIFY_BACKUP"
  | "APPLY_MIGRATION"
  | "RESTORE_BACKUP"
  | "ROLLBACK"
  | "ENTER_MAINTENANCE"
  | "RESTART_APPLICATION"
  | "RESTART_AUTOPILOT"
  | "PAUSE_AUTOMATION"
  | "RESUME_AUTOMATION"
  | "COLLECT_DIAGNOSTICS"
  | "RUN_HEALTH_CHECKS"
  | "EMERGENCY_STOP"
  | "CREATE_RELEASE_CANDIDATE"
  | "FREEZE_RELEASE"
  | "UNFREEZE_RELEASE"
  | "MARK_RELEASE_READY"
  | "ENABLE_PAYMENT_LIVE"
  | "ROTATE_CREDENTIALS"
  | "DELETE_TEST_BACKUP";

export const HUMAN_ACTION_TYPES = [
  "APPROVE_HUMAN_GATE",
  "MARK_READY_FOR_REVIEW",
  "MERGE_PR",
  "DEPLOY_PRODUCTION",
  "PREVIEW_MIGRATION",
  "CREATE_BACKUP",
  "VERIFY_BACKUP",
  "APPLY_MIGRATION",
  "RESTORE_BACKUP",
  "ROLLBACK",
  "ENTER_MAINTENANCE",
  "RESTART_APPLICATION",
  "RESTART_AUTOPILOT",
  "PAUSE_AUTOMATION",
  "RESUME_AUTOMATION",
  "COLLECT_DIAGNOSTICS",
  "RUN_HEALTH_CHECKS",
  "EMERGENCY_STOP",
  "CREATE_RELEASE_CANDIDATE",
  "FREEZE_RELEASE",
  "UNFREEZE_RELEASE",
  "MARK_RELEASE_READY",
  "ENABLE_PAYMENT_LIVE",
  "ROTATE_CREDENTIALS",
  "DELETE_TEST_BACKUP",
] as const satisfies readonly HumanActionType[];

export type HumanActionItem = {
  id: string;
  type: HumanActionType;
  environment: HumanActionEnvironment;
  risk: ActionRisk;
  reason: string;
  blockingTaskId: string | null;
  requestedBy: string;
  createdAt: string;
  preconditions: string[];
  status: HumanActionStatus;
};

export type ApprovalRecord = {
  approvalId: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  gateType: string;
  taskId: string | null;
  action: HumanActionType;
  reason: string;
  expectedSha: string | null;
  environment: HumanActionEnvironment;
  expiresAt: string;
  consumedAt: string | null;
  result: "ISSUED" | "CONSUMED" | "EXPIRED" | "STALE" | "REVOKED";
};

export type ActionReceipt = {
  actionId: string;
  idempotencyKey: string;
  actor: string;
  action: HumanActionType;
  environment: HumanActionEnvironment;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  result: "SUCCESS" | "FAILED" | "BLOCKED" | "STALE_APPROVAL";
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  refs: Record<string, string | null>;
  auditId: string;
  code: string;
  message: string;
};

export type DriftState = "IN_SYNC" | "DRIFT" | "UNKNOWN";

export type DriftSnapshot = {
  localHead: string | null;
  prHead: string | null;
  mainHead: string | null;
  deployedProductionSha: string | null;
  productCompleteHead: string | null;
  state: DriftState;
  detail: string;
  blocksDeploy: boolean;
};

export type EnvironmentSnapshot = {
  id: HumanActionEnvironment;
  versionSha: string | null;
  health: "HEALTHY" | "DEGRADED" | "BLOCKED" | "UNKNOWN" | "N/A";
  database: string;
  deployState: string;
  migrationState: string;
  lastDeploy: string | null;
  uptime: string | null;
  controlActionsEnabled: boolean;
};

export type SecretStatusItem = {
  id: string;
  configured: boolean;
  provider: string;
  lastRotation: string | null;
  expiry: string | null;
  rotationRequired: boolean;
  status: "CONFIGURED" | "MISSING" | "ROTATION_UNAVAILABLE";
};

export type NotificationAdapterStatus = {
  adapter: "email" | "sms" | "slack";
  status: "NOT_CONFIGURED" | "READY";
};

export type StallSnapshot = {
  stalled: boolean;
  reason: string | null;
  durationMs: number | null;
  suggestedAction: string | null;
};

export type IncidentSeverity = "SEV1" | "SEV2" | "SEV3" | "SEV4";

export type IncidentRecord = {
  incidentId: string;
  severity: IncidentSeverity;
  startedAt: string;
  notes: string;
  owner: string;
  timeline: Array<{ at: string; event: string; detail: string }>;
};

export type ReleasePipelineStep =
  | "CODE"
  | "CI"
  | "REVIEW"
  | "MERGE"
  | "BACKUP"
  | "MIGRATION"
  | "DEPLOY"
  | "VERIFY"
  | "COMPLETE";

export type ReleaseCenterSnapshot = {
  currentRelease: string | null;
  candidateRelease: string | null;
  head: string | null;
  ci: string | null;
  pr: string | null;
  migration: string | null;
  backup: string | null;
  deploymentStatus: string;
  frozen: boolean;
  pipeline: Array<{ id: ReleasePipelineStep; state: string; detail: string }>;
};

export type PaymentLiveState = "SANDBOX" | "LIVE_READY" | "LIVE" | "NOT_AVAILABLE";

export type OperationsMetrics = {
  ciRuns: number | null;
  ciDuration: string | null;
  agentCycles: number | null;
  retries: number | null;
  failureRate: string | null;
  mttr: string | null;
  averageTaskDuration: string | null;
  humanWaitingTime: string | null;
  deployments: number | null;
  rollbackCount: number | null;
  cost: string;
};

export type ActionPreview = {
  action: HumanActionType;
  target: string;
  environment: HumanActionEnvironment;
  exactSha: string | null;
  expectedChanges: string[];
  risks: string[];
  rollback: string | null;
  preconditions: string[];
  approvalRequirement: ActionRisk;
  typedPhrase: string | null;
};

export type HumanActionPlaneSnapshot = {
  enabled: boolean;
  productionEnabled: boolean;
  csrf: {
    status: "OK" | "ORIGIN_MISMATCH" | "CONFIG_MISSING";
    appOriginConfigured: boolean;
    localAllowListActive: boolean;
  };
  inbox: HumanActionItem[];
  environments: EnvironmentSnapshot[];
  drift: DriftSnapshot;
  release: ReleaseCenterSnapshot;
  secrets: SecretStatusItem[];
  paymentsLive: PaymentLiveState;
  notifications: NotificationAdapterStatus[];
  stall: StallSnapshot;
  metrics: OperationsMetrics;
  recentReceipts: ActionReceipt[];
  activeIncident: IncidentRecord | null;
};
