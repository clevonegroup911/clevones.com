/** X200 Operational Mirror types (T047) — observable facts only. */

export type VerificationState =
  | "VERIFIED"
  | "UNVERIFIED"
  | "STALE"
  | "CONFLICT"
  | "UNKNOWN"
  | "NOT_CONNECTED"
  | "NOT_AVAILABLE";

export type MirrorFreshness =
  | "live"
  | "file"
  | "cached"
  | "stale"
  | "unavailable";

export type FactCell = {
  id: string;
  label: string;
  value: string | number | boolean | null;
  source: string;
  timestamp: string | null;
  freshness: MirrorFreshness;
  ageMs: number | null;
  ageLabel: string | null;
  verification: VerificationState;
  note?: string | null;
};

export type SourceDomain =
  | "Git"
  | "GitHub"
  | "CI"
  | "Backlog"
  | "AUTOPILOT"
  | "Database"
  | "Deployment"
  | "Backups"
  | "Migrations"
  | "Payments"
  | "Secrets"
  | "Monitoring";

export type SourcePlaneState =
  | "VERIFIED"
  | "STALE"
  | "CONFLICT"
  | "UNKNOWN"
  | "NOT_CONNECTED";

export type SourceMatrixRow = {
  domain: SourceDomain;
  local: string;
  remote: string;
  production: string;
  truthSource: string;
  freshness: MirrorFreshness;
  ageLabel: string | null;
  state: SourcePlaneState;
  conflict: boolean;
  conflictLabel: string | null;
};

export type CiJobStep = {
  name: string;
  status: string | null;
  conclusion: string | null;
};

export type CiJobDetail = {
  name: string;
  status: string | null;
  conclusion: string | null;
  durationMs: number | null;
  startedAt: string | null;
  completedAt: string | null;
  steps: CiJobStep[];
};

export type CiInspectorSnapshot = {
  status: "OK" | "UNKNOWN" | "NOT_CONNECTED" | "ERROR";
  runId: number | null;
  runNumber: number | null;
  runUrl: string | null;
  runStatus: string | null;
  runConclusion: string | null;
  durationMs: number | null;
  jobs: CiJobDetail[];
  failedStep: string | null;
  errorCategory: string | null;
  suggestedNextAction: string | null;
  fetchedAt: string | null;
  warning: string | null;
};

export type DiffFileEntry = {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed" | "unknown";
  additions: number | null;
  deletions: number | null;
};

export type DiffInspectorSnapshot = {
  status: "OK" | "UNKNOWN" | "ERROR";
  filesChanged: number | null;
  added: number | null;
  modified: number | null;
  deleted: number | null;
  linesAdded: number | null;
  linesDeleted: number | null;
  files: DiffFileEntry[];
  commits: Array<{ sha: string; subject: string; at: string | null }>;
  summaryRedacted: string | null;
  warning: string | null;
};

export type CursorAgentSnapshot = {
  status: "ACTIVE" | "NOT_ACTIVE" | "UNKNOWN" | "NOT_CONNECTED";
  task: string | null;
  branch: string | null;
  startedAt: string | null;
  runtimeMs: number | null;
  lastProgress: string | null;
  filesModified: number | null;
  testsStatus: string | null;
  note: string;
};

export type ReleaseStackNode = {
  prNumber: number;
  title: string;
  base: string;
  head: string;
  headSha: string | null;
  draft: boolean | null;
  mergeable: string | null;
  ciConclusion: string | null;
  dependsOn: number[];
  readyState: "READY" | "DRAFT" | "BLOCKED" | "UNKNOWN";
  url: string | null;
};

export type ReleaseStackSnapshot = {
  status: "OK" | "UNKNOWN" | "NOT_CONNECTED";
  nodes: ReleaseStackNode[];
  mergeOrder: number[];
  nextSafeMerge: number | null;
  nextSafeMergeReason: string | null;
  requiresApproval: boolean;
  warning: string | null;
};

export type NextSafeActionCode =
  | "WAIT_FOR_CI"
  | "INSPECT_FAILED_STEP"
  | "MARK_READY"
  | "MERGE_DEPENDENCY_FIRST"
  | "REVIEW_MERGE"
  | "REVIEW_DEPLOY"
  | "RESOLVE_HUMAN_GATE"
  | "RESOLVE_SOURCE_CONFLICT"
  | "WAIT_AUTOPILOT"
  | "REFRESH_SOURCES"
  | "NO_SAFE_ACTION"
  | "UNKNOWN";

export type NextSafeAction = {
  code: NextSafeActionCode;
  title: string;
  detail: string;
  destructive: false;
  requiresHuman: boolean;
  relatedPr: number | null;
  relatedTask: string | null;
  evidence: string[];
};

export type OperatorViewSnapshot = {
  currentFacts: string[];
  evidence: string[];
  conflicts: string[];
  risks: string[];
  blockers: string[];
  nextSafeAction: string;
  humanDecisionRequired: string | null;
};

export type MirrorNotification = {
  id: string;
  kind:
    | "CI_SUCCESS"
    | "CI_FAILED"
    | "PR_READY"
    | "HUMAN_GATE"
    | "AUTOPILOT_STALLED"
    | "DATABASE_DOWN"
    | "BACKUP_FAILED"
    | "DEPLOYMENT_RESULT"
    | "INCIDENT"
    | "INFO";
  title: string;
  detail: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  createdAt: string;
  acknowledged: boolean;
  source: string;
};

export type ErrorIntelligenceItem = {
  errorCode: string;
  component: string;
  timestamp: string;
  source: string;
  firstSeen: string;
  lastSeen: string;
  count: number;
  relatedTask: string | null;
  relatedCommit: string | null;
  relatedCi: string | null;
  suggestedSafeAction: string;
};

export type ControlledLogLevel = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export type ControlledLogEntry = {
  id: string;
  at: string;
  level: ControlledLogLevel;
  channel:
    | "AUTOPILOT"
    | "application"
    | "CI"
    | "deployment"
    | "human_actions"
    | "audit"
    | "incidents";
  message: string;
  source: string;
};

export type AutopilotLiveExtended = {
  serviceState: string;
  pid: number | null;
  mode: string | null;
  agentRunning: boolean | null;
  lastEvent: string | null;
  heartbeat: string | null;
  heartbeatAge: string | null;
  cycle: number | null;
  taskClaimed: string | null;
  taskRuntime: string | null;
  lastExit: string | null;
  restartCount: number | null;
  lockState: string | null;
  dirtyWorktree: boolean | null;
  source: string;
  note: string | null;
  autopilotServiceState: string | null;
  autopilotPid: number | null;
  telemetryState: string | null;
  telemetryAge: string | null;
  agentRunningVerified: boolean | null;
  serviceReconcileCode: string | null;
};

export type TaskControlRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dependencies: string[];
  requiresHuman: boolean;
  attempts: number;
  createdAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  duration: string | null;
  evidence: string[];
  commit: string | null;
  pr: string | null;
  ci: string | null;
  blocker: string | null;
  nextAction: string | null;
};

export type HumanDecisionCard = {
  id: string;
  type: string;
  why: string;
  what: string;
  risk: string;
  environment: string;
  exactSha: string | null;
  preconditions: string[];
  expectedEffect: string;
  rollback: string;
  sourceEvidence: string[];
  status: string;
};

export type CommandPaletteAction = {
  id: string;
  label: string;
  available: boolean;
  reason: string | null;
  requiresHuman: boolean;
};

export type OperationalMirrorSnapshot = {
  generatedAt: string;
  degraded: boolean;
  degradationNotes: string[];
  globalFacts: FactCell[];
  sourcesMatrix: SourceMatrixRow[];
  ciInspector: CiInspectorSnapshot;
  diffInspector: DiffInspectorSnapshot;
  releaseStack: ReleaseStackSnapshot;
  cursorAgent: CursorAgentSnapshot;
  autopilotLive: AutopilotLiveExtended;
  taskControl: TaskControlRow[];
  humanDecisions: HumanDecisionCard[];
  nextSafeAction: NextSafeAction;
  operatorView: OperatorViewSnapshot;
  notifications: MirrorNotification[];
  errorIntelligence: ErrorIntelligenceItem[];
  logs: ControlledLogEntry[];
  commandPalette: CommandPaletteAction[];
  mainHead: string | null;
  openPrCount: number | null;
  worktreePath: string | null;
  databaseState: string;
  backupState: string;
  migrationState: string;
  incidentState: string;
  deployedProductionSha: string | null;
};
