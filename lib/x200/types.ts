/** Shared X200 Control Center types — observabilité only (T042). */

export type SourceStatus =
  | "OK"
  | "MISSING"
  | "INVALID"
  | "ERROR"
  | "NOT_CONNECTED"
  | "UNKNOWN";

export type Freshness = "live" | "file" | "cached" | "unavailable";

export type SystemHealthStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "BLOCKED"
  | "UNKNOWN";

export type PipelineStepId =
  | "PLAN"
  | "CLAIM"
  | "BUILD"
  | "TEST"
  | "PUSH"
  | "CI"
  | "REVIEW"
  | "MERGE";

export type PipelineStepState =
  | "DONE"
  | "ACTIVE"
  | "WAITING"
  | "FAILED"
  | "UNKNOWN";

export type BlockerSeverity = "INFO" | "WARNING" | "HIGH" | "CRITICAL";

export type TaskStatus =
  | "À_FAIRE"
  | "PRÊTE"
  | "EN_COURS"
  | "EN_CONTRÔLE"
  | "BLOQUÉE"
  | "ÉCHOUÉE"
  | "TERMINÉE"
  | "ANNULÉE";

export type ControlCenterSources = {
  backlog: SourceStatus;
  productGoal: SourceStatus;
  humanGate: SourceStatus;
  productComplete: SourceStatus;
  git: SourceStatus;
  github: SourceStatus;
  fedoraTelemetry: SourceStatus;
};

export type TaskCounts = Record<TaskStatus, number> & { total: number };

export type ControlCenterTask = {
  id: string;
  title: string;
  objective: string;
  status: TaskStatus | string;
  priority: string;
  dependencies: string[];
  attempts: number;
  requiresHuman: boolean;
  nextAction: string | null;
  blockedReason: string | null;
  evidence: string[];
  evidenceCount: number;
  owner: string | null;
  updatedAt: string | null;
  claimWorkerId: string | null;
  claimExpiresAt: string | null;
  lastTransitionReason: string | null;
};

export type HealthCriterion = {
  id: string;
  label: string;
  passed: boolean | null;
  detail: string;
};

export type SystemHealth = {
  status: SystemHealthStatus;
  /** Documented score: passed / applicable criteria × 100, or null if unknown. */
  scorePercent: number | null;
  criteria: HealthCriterion[];
  rationale: string;
};

export type PipelineStep = {
  id: PipelineStepId;
  state: PipelineStepState;
  detail: string;
  /** Evidence source label — never invented when unavailable. */
  source: string;
  evidence: string | null;
  timestamp: string | null;
  reason: string | null;
  relatedCommit: string | null;
  relatedCiUrl: string | null;
};

export type ControlMode =
  | "READ_ONLY"
  | "LOCAL_CONTROL_READY"
  | "ACTION_RUNNING"
  | "HUMAN_GATE"
  | "UNAVAILABLE"
  | "UNKNOWN";

export type ControlActionId =
  | "AUTOPILOT_START"
  | "AUTOPILOT_STOP"
  | "AUTOPILOT_RESTART"
  | "RUN_ONE_CYCLE";

export type ControlActionCode =
  | "ACTION_NOT_ALLOWED"
  | "WORKTREE_DIRTY"
  | "HUMAN_GATE_REQUIRED"
  | "AGENT_BUSY"
  | "CONTROL_DISABLED"
  | "LOCAL_EXECUTOR_UNAVAILABLE"
  | "CSRF_ORIGIN"
  | "CSRF_REFERER"
  | "CSRF_MISSING"
  | "INVALID_ACTION"
  | "TIMEOUT"
  | "EXEC_FAILED"
  | "OK";

export type ControlActionAuditEntry = {
  timestamp: string;
  action: ControlActionId;
  actor: string;
  result: "SUCCESS" | "FAILED";
  durationMs: number;
  beforeState: ControlMode;
  afterState: ControlMode;
  taskId: string | null;
  code: string | null;
  detail: string | null;
};

export type ControlPlaneSnapshot = {
  mode: ControlMode;
  actionsEnabled: boolean;
  localExecutorAvailable: boolean;
  actorRole: "SUPER_ADMIN" | "ADMIN" | "UNKNOWN";
  canMutate: boolean;
  disabledReasons: Partial<Record<ControlActionId | "MERGE" | "DEPLOY", string>>;
  recentActions: ControlActionAuditEntry[];
};

export type ProjectProgressSnapshot = {
  completed: number | null;
  total: number | null;
  percent: number | null;
  currentCycleDuration: string | null;
  ciDuration: string | null;
  heartbeatAge: string | null;
  averageAttempts: number | null;
  successRatePercent: number | null;
  blocked: number | null;
  failed: number | null;
};

export type Blocker = {
  id: string;
  severity: BlockerSeverity;
  title: string;
  detail: string;
  source: keyof ControlCenterSources | "derived";
};

export type GitSnapshot = {
  head: string | null;
  branch: string | null;
  dirty: boolean | null;
  dirtyFileCount: number | null;
  recentCommits: Array<{ sha: string; subject: string; at: string | null }>;
  status: SourceStatus;
  warning: string | null;
};

export type GithubSnapshot = {
  status: SourceStatus;
  warning: string | null;
  repository: string;
  prNumber: number | null;
  prTitle: string | null;
  prState: string | null;
  prDraft: boolean | null;
  prMergeable: string | null;
  prHeadSha: string | null;
  prUrl: string | null;
  ciLatestRunId: number | null;
  ciLatestRunNumber: number | null;
  ciLatestConclusion: string | null;
  ciLatestStatus: string | null;
  ciLatestUrl: string | null;
  ciLatestName: string | null;
  /** How remote GitHub truth was obtained (never invent credentials). */
  githubSource?:
    | "REST_AUTHENTICATED"
    | "GH_CLI_AUTHENTICATED"
    | "NOT_CONNECTED";
};

export type ProductGoalSnapshot = {
  status: SourceStatus;
  exists: boolean;
  hash: string | null;
  byteLength: number | null;
  detectableCriteriaCount: number | null;
  warning: string | null;
};

export type HumanGateSnapshot = {
  status: SourceStatus;
  present: boolean;
  createdAt: string | null;
  reason: string | null;
  taskId: string | null;
  requiredAction: string | null;
  blocking: string[];
  merged: boolean | null;
  deployed: boolean | null;
  warning: string | null;
};

export type ProductCompleteSnapshot = {
  status: SourceStatus;
  present: boolean;
  head: string | null;
  goalHash: string | null;
  generatedAt: string | null;
  matchesCurrentHead: boolean | null;
  matchesCurrentGoalHash: boolean | null;
  summary: string | null;
  warning: string | null;
};

export type EfficiencyMetrics = {
  completedTasks: number;
  successRatePercent: number | null;
  totalAttempts: number;
  blockedTasks: number;
  failedTasks: number;
  averageAttemptsOnCompleted: number | null;
  averageCycleDays: number | null;
  humanWaitHint: string | null;
  notes: string[];
};

export type ActivityItem = {
  id: string;
  at: string;
  kind: "backlog" | "git" | "ci" | "gate" | "product";
  title: string;
  detail: string;
};

export type RoleCard = {
  id: string;
  name: string;
  responsibilities: string[];
};

export type FedoraLiveState =
  | "WAITING_FOR_TELEMETRY"
  | "STALE"
  | "RUNNING"
  | "IDLE"
  | "AUTOPLAN"
  | "COMPLETE";

export type AutopilotLiveState = {
  fedoraTelemetry: SourceStatus;
  autopilotLiveState: FedoraLiveState;
  note: string;
  updatedAt: string | null;
  ageMs: number | null;
  pid: number | null;
  host: string | null;
  mode: string | null;
  head: string | null;
  branch: string | null;
  lastEvent: string | null;
  cycle: number | null;
  /**
   * Control-plane liveness. Stale telemetry never forces true —
   * systemd reconciliation may clear historical agentRunning claims.
   */
  agentRunning: boolean | null;
  taskId: string | null;
  /** systemd --user ActiveState */
  serviceActiveState?: string | null;
  serviceSubState?: string | null;
  serviceMainPid?: number | null;
  serviceNRestarts?: number | null;
  telemetryState?: "FRESH" | "STALE" | "MISSING";
  agentRunningVerified?: boolean | null;
  serviceReconcileCode?: string | null;
};

export type ControlCenterSnapshot = {
  generatedAt: string;
  sources: ControlCenterSources;
  freshness: Record<keyof ControlCenterSources, Freshness>;
  warnings: string[];
  systemHealth: SystemHealth;
  pipeline: PipelineStep[];
  backlog: {
    status: SourceStatus;
    counts: TaskCounts | null;
    currentTask: ControlCenterTask | null;
    tasks: ControlCenterTask[];
  };
  productGoal: ProductGoalSnapshot;
  humanGate: HumanGateSnapshot;
  productComplete: ProductCompleteSnapshot;
  git: GitSnapshot;
  github: GithubSnapshot;
  fedora: AutopilotLiveState;
  efficiency: EfficiencyMetrics;
  blockers: Blocker[];
  activity: ActivityItem[];
  roles: RoleCard[];
  control: ControlPlaneSnapshot;
  progress: ProjectProgressSnapshot;
  lastUpdate: string;
  /** T046 Human Action Center plane — optional for fatal snapshots. */
  humanActions?: import("@/lib/x200/actions/types").HumanActionPlaneSnapshot | null;
  /** T047 Operational Mirror — optional for fatal snapshots. */
  mirror?: import("@/lib/x200/mirror/types").OperationalMirrorSnapshot | null;
};
