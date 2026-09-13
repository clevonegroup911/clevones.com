import type {
  AutopilotLiveExtended,
  CommandPaletteAction,
  CursorAgentSnapshot,
  HumanDecisionCard,
  TaskControlRow,
} from "@/lib/x200/mirror/types";
import { formatAgeLabel } from "@/lib/x200/mirror/freshness";
import type {
  AutopilotLiveState,
  ControlCenterTask,
  ControlMode,
  GitSnapshot,
  GithubSnapshot,
} from "@/lib/x200/types";
import type { HumanActionItem } from "@/lib/x200/actions/types";

export function buildCursorAgentSnapshot(input: {
  fedora: AutopilotLiveState;
  currentTask: ControlCenterTask | null;
  git: GitSnapshot;
}): CursorAgentSnapshot {
  // Cursor does not expose a verified agent API here — never invent.
  if (input.fedora.agentRunning === true) {
    return {
      status: "ACTIVE",
      task: input.fedora.taskId ?? input.currentTask?.id ?? null,
      branch: input.fedora.branch ?? input.git.branch,
      startedAt: input.fedora.updatedAt,
      runtimeMs: input.fedora.ageMs,
      lastProgress: input.fedora.lastEvent,
      filesModified: input.git.dirtyFileCount,
      testsStatus: "UNKNOWN",
      note: "Inferred from Fedora telemetry agentRunning=true (Cursor API NOT_CONNECTED)",
    };
  }
  if (input.fedora.fedoraTelemetry === "OK") {
    return {
      status: "NOT_ACTIVE",
      task: input.fedora.taskId,
      branch: input.fedora.branch ?? input.git.branch,
      startedAt: null,
      runtimeMs: null,
      lastProgress: input.fedora.lastEvent,
      filesModified: null,
      testsStatus: "UNKNOWN",
      note: "Telemetry reachable; Cursor agent API NOT_CONNECTED",
    };
  }
  return {
    status: "NOT_CONNECTED",
    task: null,
    branch: null,
    startedAt: null,
    runtimeMs: null,
    lastProgress: null,
    filesModified: null,
    testsStatus: null,
    note: "Cursor agent status API not exposed — NOT_CONNECTED",
  };
}

export function buildAutopilotLiveExtended(input: {
  fedora: AutopilotLiveState;
  git: GitSnapshot;
}): AutopilotLiveExtended {
  return {
    serviceState: input.fedora.autopilotLiveState,
    pid: input.fedora.pid,
    mode: input.fedora.mode,
    agentRunning: input.fedora.agentRunning,
    lastEvent: input.fedora.lastEvent,
    heartbeat: input.fedora.updatedAt,
    heartbeatAge: formatAgeLabel(input.fedora.ageMs),
    cycle: input.fedora.cycle,
    taskClaimed: input.fedora.taskId,
    taskRuntime: formatAgeLabel(input.fedora.ageMs),
    lastExit: null,
    restartCount: null,
    lockState: null,
    dirtyWorktree: input.git.dirty,
    source: ".x200/telemetry.json",
    note: input.fedora.note,
  };
}

export function buildTaskControlRows(
  tasks: ControlCenterTask[],
  github: GithubSnapshot,
): TaskControlRow[] {
  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: String(task.status),
    priority: task.priority,
    dependencies: task.dependencies,
    requiresHuman: task.requiresHuman,
    attempts: task.attempts,
    createdAt: null,
    startedAt: task.claimExpiresAt ? task.updatedAt : null,
    finishedAt: task.status === "TERMINÉE" ? task.updatedAt : null,
    duration: null,
    evidence: task.evidence.slice(0, 6),
    commit: null,
    pr: github.prNumber != null ? `#${github.prNumber}` : null,
    ci: github.ciLatestConclusion,
    blocker: task.blockedReason,
    nextAction: task.nextAction,
  }));
}

export function buildHumanDecisionCards(
  inbox: HumanActionItem[],
  exactSha: string | null,
): HumanDecisionCard[] {
  return inbox.map((item) => ({
    id: item.id,
    type: item.type,
    why: item.reason,
    what: item.type,
    risk: item.risk,
    environment: item.environment,
    exactSha,
    preconditions: item.preconditions,
    expectedEffect: `Execute ${item.type} on ${item.environment}`,
    rollback: item.risk === "CRITICAL" || item.risk === "HIGH"
      ? "Use ROLLBACK / restore adapters after approval"
      : "Re-run opposite safe action if available",
    sourceEvidence: [
      `requestedBy=${item.requestedBy}`,
      `createdAt=${item.createdAt}`,
      `status=${item.status}`,
    ],
    status: item.status,
  }));
}

export function buildCommandPaletteActions(input: {
  controlMode: ControlMode;
  canMutate: boolean;
  agentRunning: boolean | null;
  humanGatePresent: boolean;
  prNumber: number | null;
  prDraft: boolean | null;
  ciConclusion: string | null;
}): CommandPaletteAction[] {
  const busy = input.agentRunning === true;
  return [
    {
      id: "refresh_all",
      label: "Refresh all",
      available: true,
      reason: null,
      requiresHuman: false,
    },
    {
      id: "inspect_pr",
      label: "Inspect current PR",
      available: input.prNumber != null,
      reason: input.prNumber == null ? "No PR observed" : null,
      requiresHuman: false,
    },
    {
      id: "inspect_ci",
      label: "Inspect latest CI",
      available: Boolean(input.ciConclusion || input.prNumber),
      reason: null,
      requiresHuman: false,
    },
    {
      id: "start_autopilot",
      label: "Start AUTOPILOT",
      available: input.canMutate && !busy && !input.humanGatePresent,
      reason: !input.canMutate
        ? "Mutations disabled"
        : busy
          ? "Agent running — no arbitrary kill/start"
          : input.humanGatePresent
            ? "Human Gate present"
            : null,
      requiresHuman: false,
    },
    {
      id: "stop_autopilot",
      label: "Stop AUTOPILOT",
      available: input.canMutate && busy !== true,
      reason: busy
        ? "agentRunning=true — no arbitrary kill"
        : !input.canMutate
          ? "Mutations disabled"
          : null,
      requiresHuman: false,
    },
    {
      id: "run_cycle",
      label: "Run cycle",
      available: input.canMutate && !busy && !input.humanGatePresent,
      reason: busy ? "Agent busy" : null,
      requiresHuman: false,
    },
    {
      id: "mark_pr_ready",
      label: "Mark PR ready",
      available: input.prDraft === true,
      reason: input.prDraft !== true ? "PR not draft" : null,
      requiresHuman: true,
    },
    {
      id: "review_merge",
      label: "Review merge",
      available: input.prNumber != null && input.prDraft === false,
      reason: null,
      requiresHuman: true,
    },
    {
      id: "create_backup",
      label: "Create backup",
      available: false,
      reason: "Backup adapter NOT_AVAILABLE",
      requiresHuman: true,
    },
    {
      id: "run_health_check",
      label: "Run health check",
      available: true,
      reason: null,
      requiresHuman: false,
    },
    {
      id: "open_incident",
      label: "Open incident",
      available: true,
      reason: null,
      requiresHuman: true,
    },
  ];
}
