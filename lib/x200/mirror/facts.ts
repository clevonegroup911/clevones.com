import { fact, freshnessFromAge } from "@/lib/x200/mirror/freshness";
import type { FactCell } from "@/lib/x200/mirror/types";
import type {
  AutopilotLiveState,
  ControlCenterTask,
  GitSnapshot,
  GithubSnapshot,
  HumanGateSnapshot,
  ProductCompleteSnapshot,
} from "@/lib/x200/types";

const GITHUB_STALE_MS = 60_000;
const TELEMETRY_STALE_MS = 180_000;
const FILE_STALE_MS = 300_000;

export function buildGlobalCommandCenterFacts(input: {
  generatedAt: string;
  environment: string;
  repository: string;
  git: GitSnapshot;
  github: GithubSnapshot;
  fedora: AutopilotLiveState;
  humanGate: HumanGateSnapshot;
  productComplete: ProductCompleteSnapshot;
  currentTask: ControlCenterTask | null;
  nextTaskId: string | null;
  mainHead: string | null;
  worktreePath: string | null;
  databaseState: string;
  backupState: string;
  migrationState: string;
  incidentState: string;
  deployedProductionSha: string | null;
  driftLabel: string;
  ciDurationMs: number | null;
  nowMs?: number;
}): FactCell[] {
  const now = input.nowMs ?? Date.now();
  const genAge = Math.max(0, now - Date.parse(input.generatedAt));
  const fedoraAge = input.fedora.ageMs;
  const githubFresh = freshnessFromAge(genAge, GITHUB_STALE_MS, "live");
  const telemetryFresh = freshnessFromAge(
    fedoraAge,
    TELEMETRY_STALE_MS,
    "live",
  );
  const fileFresh = freshnessFromAge(genAge, FILE_STALE_MS, "file");

  const githubOk = input.github.status === "OK";
  const gitOk = input.git.status === "OK";

  return [
    fact({
      id: "environment",
      label: "Environment",
      value: input.environment,
      source: "process.env.NODE_ENV",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: fileFresh,
      verification: "VERIFIED",
    }),
    fact({
      id: "repository",
      label: "Repository",
      value: input.repository,
      source: "backlog.json",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: fileFresh,
      verification: "VERIFIED",
    }),
    fact({
      id: "branch_local",
      label: "Branch locale",
      value: input.git.branch,
      source: "git local",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: gitOk ? "live" : "unavailable",
      verification: gitOk ? "VERIFIED" : "UNKNOWN",
    }),
    fact({
      id: "head_local",
      label: "HEAD local",
      value: input.git.head,
      source: "git local",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: gitOk ? "live" : "unavailable",
      verification: gitOk ? "VERIFIED" : "UNKNOWN",
    }),
    fact({
      id: "main_head",
      label: "main HEAD",
      value: input.mainHead,
      source: "GitHub API",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: input.mainHead ? githubFresh : "unavailable",
      verification: input.mainHead ? "VERIFIED" : "NOT_CONNECTED",
    }),
    fact({
      id: "pr_head",
      label: "PR HEAD",
      value: input.github.prHeadSha,
      source: "GitHub API",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: githubOk ? githubFresh : "unavailable",
      verification: input.github.prHeadSha ? "VERIFIED" : "UNKNOWN",
    }),
    fact({
      id: "pr_number",
      label: "PR number",
      value: input.github.prNumber,
      source: "GitHub API",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: githubOk ? githubFresh : "unavailable",
      verification: input.github.prNumber != null ? "VERIFIED" : "UNKNOWN",
    }),
    fact({
      id: "pr_state",
      label: "PR state",
      value: input.github.prState,
      source: "GitHub API",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: githubOk ? githubFresh : "unavailable",
      verification: input.github.prState ? "VERIFIED" : "UNKNOWN",
    }),
    fact({
      id: "pr_draft",
      label: "PR draft",
      value: input.github.prDraft,
      source: "GitHub API",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: githubOk ? githubFresh : "unavailable",
      verification:
        typeof input.github.prDraft === "boolean" ? "VERIFIED" : "UNKNOWN",
    }),
    fact({
      id: "pr_mergeable",
      label: "PR mergeable",
      value: input.github.prMergeable,
      source: "GitHub API",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: githubOk ? githubFresh : "unavailable",
      verification: input.github.prMergeable ? "VERIFIED" : "UNKNOWN",
    }),
    fact({
      id: "ci_run",
      label: "CI run",
      value: input.github.ciLatestRunNumber,
      source: "GitHub API",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: githubOk ? githubFresh : "unavailable",
      verification: input.github.ciLatestRunId != null ? "VERIFIED" : "UNKNOWN",
    }),
    fact({
      id: "ci_conclusion",
      label: "CI conclusion",
      value: input.github.ciLatestConclusion,
      source: "GitHub API",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: githubOk ? githubFresh : "unavailable",
      verification: input.github.ciLatestConclusion ? "VERIFIED" : "UNKNOWN",
    }),
    fact({
      id: "ci_duration",
      label: "CI duration",
      value:
        input.ciDurationMs != null
          ? `${Math.round(input.ciDurationMs / 1000)}s`
          : null,
      source: "GitHub API",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: input.ciDurationMs != null ? githubFresh : "unavailable",
      verification: input.ciDurationMs != null ? "VERIFIED" : "UNKNOWN",
    }),
    fact({
      id: "worktree",
      label: "worktree",
      value: input.worktreePath,
      source: "process.cwd",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: "live",
      verification: "VERIFIED",
    }),
    fact({
      id: "autopilot_status",
      label: "AUTOPILOT status",
      value: input.fedora.autopilotLiveState,
      source: ".x200/telemetry.json",
      timestamp: input.fedora.updatedAt,
      ageMs: fedoraAge,
      freshness: telemetryFresh,
      verification:
        input.fedora.fedoraTelemetry === "OK"
          ? telemetryFresh === "stale"
            ? "STALE"
            : "VERIFIED"
          : "NOT_CONNECTED",
    }),
    fact({
      id: "agent_status",
      label: "agent status",
      value:
        input.fedora.agentRunning === null
          ? null
          : input.fedora.agentRunning
            ? "running"
            : "idle",
      source: ".x200/telemetry.json",
      timestamp: input.fedora.updatedAt,
      ageMs: fedoraAge,
      freshness: telemetryFresh,
      verification:
        input.fedora.agentRunning === null ? "UNKNOWN" : "VERIFIED",
    }),
    fact({
      id: "heartbeat",
      label: "heartbeat",
      value: input.fedora.updatedAt,
      source: ".x200/telemetry.json",
      timestamp: input.fedora.updatedAt,
      ageMs: fedoraAge,
      freshness: telemetryFresh,
      verification:
        input.fedora.updatedAt
          ? telemetryFresh === "stale"
            ? "STALE"
            : "VERIFIED"
          : "NOT_CONNECTED",
    }),
    fact({
      id: "current_task",
      label: "current task",
      value: input.currentTask?.id ?? null,
      source: "backlog.json",
      timestamp: input.currentTask?.updatedAt ?? input.generatedAt,
      ageMs: genAge,
      freshness: fileFresh,
      verification: input.currentTask ? "VERIFIED" : "UNKNOWN",
    }),
    fact({
      id: "next_task",
      label: "next task",
      value: input.nextTaskId,
      source: "backlog.json",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: fileFresh,
      verification: "VERIFIED",
    }),
    fact({
      id: "human_gate",
      label: "human gate",
      value: input.humanGate.present
        ? input.humanGate.requiredAction ?? "PRESENT"
        : "absent",
      source: ".x200/HUMAN_GATE.json",
      timestamp: input.humanGate.createdAt,
      ageMs: input.humanGate.createdAt
        ? Math.max(0, now - Date.parse(input.humanGate.createdAt))
        : genAge,
      freshness: input.humanGate.present ? "file" : "unavailable",
      verification:
        input.humanGate.status === "OK" || input.humanGate.status === "MISSING"
          ? "VERIFIED"
          : "UNKNOWN",
    }),
    fact({
      id: "product_complete",
      label: "PRODUCT_COMPLETE",
      value: input.productComplete.present
        ? input.productComplete.matchesCurrentHead &&
          input.productComplete.matchesCurrentGoalHash
          ? "valid"
          : "present_invalid"
        : "absent",
      source: ".x200/PRODUCT_COMPLETE.json",
      timestamp: input.productComplete.generatedAt,
      ageMs: input.productComplete.generatedAt
        ? Math.max(0, now - Date.parse(input.productComplete.generatedAt))
        : genAge,
      freshness: input.productComplete.present ? "file" : "unavailable",
      verification: input.productComplete.present ? "UNVERIFIED" : "VERIFIED",
    }),
    fact({
      id: "deployed_sha",
      label: "deployed production SHA",
      value: input.deployedProductionSha,
      source: "deployment adapter",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: "unavailable",
      verification: input.deployedProductionSha
        ? "UNVERIFIED"
        : "NOT_AVAILABLE",
    }),
    fact({
      id: "database_state",
      label: "database state",
      value: input.databaseState,
      source: "database",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: "unavailable",
      verification:
        input.databaseState === "NOT_CONNECTED" ||
        input.databaseState === "NOT_AVAILABLE"
          ? "NOT_CONNECTED"
          : "UNKNOWN",
    }),
    fact({
      id: "backup_state",
      label: "backup state",
      value: input.backupState,
      source: "backup adapter",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: "unavailable",
      verification: "NOT_AVAILABLE",
    }),
    fact({
      id: "migration_state",
      label: "migration state",
      value: input.migrationState,
      source: "migration adapter",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: "unavailable",
      verification: "NOT_AVAILABLE",
    }),
    fact({
      id: "incident_state",
      label: "incident state",
      value: input.incidentState,
      source: ".x200/incidents",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: "file",
      verification: "VERIFIED",
    }),
    fact({
      id: "drift",
      label: "drift",
      value: input.driftLabel,
      source: "derived",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: "live",
      verification: "VERIFIED",
    }),
    fact({
      id: "last_refresh",
      label: "last refresh",
      value: input.generatedAt,
      source: "control-center",
      timestamp: input.generatedAt,
      ageMs: genAge,
      freshness: "live",
      verification: "VERIFIED",
    }),
  ];
}
