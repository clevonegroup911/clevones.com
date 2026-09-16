import "server-only";

import {
  buildActivityFeed,
  assertNoSecretsInPayload,
  redactMonitoringText,
} from "@/lib/x200/activity";
import {
  computeEfficiency,
  computeSystemHealth,
  CONTROL_CENTER_ROLES,
  deriveBlockers,
  derivePipeline,
} from "@/lib/x200/derive";
import { readGitSnapshot } from "@/lib/x200/git-local";
import { readGithubSnapshot } from "@/lib/x200/github";
import {
  readBacklogSnapshot,
  readHumanGateSnapshot,
  readProductCompleteSnapshot,
  readProductGoalSnapshot,
  emptyTaskCounts,
} from "@/lib/x200/sources";
import { readFedoraTelemetrySnapshot } from "@/lib/x200/telemetry";
import {
  buildControlPlaneSnapshot,
  readRecentControlActions,
} from "@/lib/x200/control-actions";
import {
  buildHumanActionPlaneSnapshot,
  loadHumanActionPlaneExtras,
} from "@/lib/x200/actions/plane";
import type {
  ControlCenterSnapshot,
  ControlCenterSources,
  ControlCenterTask,
  Freshness,
  ProjectProgressSnapshot,
} from "@/lib/x200/types";

function formatAgeLabel(ageMs: number | null): string | null {
  if (ageMs === null || !Number.isFinite(ageMs)) return null;
  const sec = Math.floor(ageMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  if (min < 60) return `${min}m${String(rem).padStart(2, "0")}s`;
  const hours = Math.floor(min / 60);
  const remMin = min % 60;
  return `${hours}h${String(remMin).padStart(2, "0")}m`;
}

function buildProgressSnapshot(input: {
  counts: ControlCenterSnapshot["backlog"]["counts"];
  efficiency: ControlCenterSnapshot["efficiency"];
  fedoraAgeMs: number | null;
  fedoraStale: boolean;
}): ProjectProgressSnapshot {
  const total = input.counts?.total ?? null;
  const completed = input.counts?.["TERMINÉE"] ?? null;
  const percent =
    total != null && total > 0 && completed != null
      ? Math.round((completed / total) * 1000) / 10
      : null;
  const heartbeatRaw = formatAgeLabel(input.fedoraAgeMs);
  const heartbeatAge =
    heartbeatRaw == null
      ? null
      : input.fedoraStale
        ? `STALE — ${heartbeatRaw.replace(" ago", "")}`
        : heartbeatRaw;

  return {
    completed,
    total,
    percent,
    currentCycleDuration: null,
    ciDuration: null,
    heartbeatAge,
    averageAttempts: input.efficiency.averageAttemptsOnCompleted,
    successRatePercent: input.efficiency.successRatePercent,
    blocked: input.counts?.["BLOQUÉE"] ?? input.efficiency.blockedTasks,
    failed: input.counts?.["ÉCHOUÉE"] ?? input.efficiency.failedTasks,
  };
}

function emptyControlPlane(): ControlCenterSnapshot["control"] {
  return {
    mode: "UNAVAILABLE",
    actionsEnabled: false,
    localExecutorAvailable: false,
    actorRole: "UNKNOWN",
    canMutate: false,
    disabledReasons: {
      MERGE: "Human approval required",
      DEPLOY: "Human approval required",
      AUTOPILOT_START: "Control Center degraded",
      AUTOPILOT_STOP: "Control Center degraded",
      AUTOPILOT_RESTART: "Control Center degraded",
      RUN_ONE_CYCLE: "Control Center degraded",
    },
    recentActions: [],
  };
}

function emptyProgress(): ProjectProgressSnapshot {
  return {
    completed: null,
    total: null,
    percent: null,
    currentCycleDuration: null,
    ciDuration: null,
    heartbeatAge: null,
    averageAttempts: null,
    successRatePercent: null,
    blocked: null,
    failed: null,
  };
}

function sanitizeDisplayText(value: string): string {
  return redactMonitoringText(value, 2000);
}

function sanitizeTask(task: ControlCenterTask): ControlCenterTask {
  return {
    ...task,
    title: sanitizeDisplayText(task.title),
    objective: sanitizeDisplayText(task.objective),
    nextAction: task.nextAction ? sanitizeDisplayText(task.nextAction) : null,
    blockedReason: task.blockedReason
      ? sanitizeDisplayText(task.blockedReason)
      : null,
    lastTransitionReason: task.lastTransitionReason
      ? sanitizeDisplayText(task.lastTransitionReason)
      : null,
    evidence: task.evidence
      .slice(0, 8)
      .map((item) => sanitizeDisplayText(item).slice(0, 240)),
  };
}

function deepRedactStrings(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitizeDisplayText(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepRedactStrings(item));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = deepRedactStrings(child);
    }
    return out;
  }
  return value;
}

/** Last-resort snapshot when an unexpected exception escapes source readers. */
export function buildControlCenterFatalSnapshot(
  error: unknown,
): ControlCenterSnapshot {
  const generatedAt = new Date().toISOString();
  const message =
    error instanceof Error ? error.message : "unexpected control-center failure";
  const emptyCounts = emptyTaskCounts();
  const sources: ControlCenterSources = {
    backlog: "ERROR",
    productGoal: "ERROR",
    humanGate: "ERROR",
    productComplete: "ERROR",
    git: "ERROR",
    github: "ERROR",
    fedoraTelemetry: "ERROR",
  };
  const freshness = Object.fromEntries(
    Object.keys(sources).map((key) => [key, "unavailable"]),
  ) as Record<keyof ControlCenterSources, Freshness>;

  return {
    generatedAt,
    sources,
    freshness,
    warnings: [
      sanitizeDisplayText(
        `Control Center degraded: ${message}. Monitoring sources marked ERROR; auth still required.`,
      ),
    ],
    systemHealth: {
      status: "UNKNOWN",
      scorePercent: null,
      criteria: [],
      rationale: "Control Center snapshot assembly failed; criteria unavailable.",
    },
    pipeline: [],
    backlog: {
      status: "ERROR",
      counts: emptyCounts,
      currentTask: null,
      tasks: [],
    },
    productGoal: {
      status: "ERROR",
      exists: false,
      hash: null,
      byteLength: null,
      detectableCriteriaCount: null,
      warning: sanitizeDisplayText(message),
    },
    humanGate: {
      status: "ERROR",
      present: false,
      createdAt: null,
      reason: null,
      taskId: null,
      requiredAction: null,
      blocking: [],
      merged: null,
      deployed: null,
      warning: sanitizeDisplayText(message),
    },
    productComplete: {
      status: "ERROR",
      present: false,
      head: null,
      goalHash: null,
      generatedAt: null,
      matchesCurrentHead: null,
      matchesCurrentGoalHash: null,
      summary: null,
      warning: sanitizeDisplayText(message),
    },
    git: {
      head: null,
      branch: null,
      dirty: null,
      dirtyFileCount: null,
      recentCommits: [],
      status: "ERROR",
      warning: sanitizeDisplayText(message),
    },
    github: {
      status: "ERROR",
      warning: sanitizeDisplayText(message),
      repository: "UNKNOWN",
      prNumber: null,
      prTitle: null,
      prState: null,
      prDraft: null,
      prMergeable: null,
      prHeadSha: null,
      prUrl: null,
      ciLatestRunId: null,
      ciLatestRunNumber: null,
      ciLatestConclusion: null,
      ciLatestStatus: null,
      ciLatestUrl: null,
      ciLatestName: null,
    },
    fedora: {
      fedoraTelemetry: "ERROR",
      autopilotLiveState: "WAITING_FOR_TELEMETRY",
      note: sanitizeDisplayText(message),
      updatedAt: null,
      ageMs: null,
      pid: null,
      host: null,
      mode: null,
      head: null,
      branch: null,
      lastEvent: null,
      cycle: null,
      agentRunning: null,
      taskId: null,
    },
    efficiency: {
      completedTasks: 0,
      successRatePercent: null,
      totalAttempts: 0,
      blockedTasks: 0,
      failedTasks: 0,
      averageAttemptsOnCompleted: null,
      averageCycleDays: null,
      humanWaitHint: null,
      notes: ["N/A — snapshot degraded"],
    },
    blockers: [
      {
        id: "control_center_degraded",
        severity: "HIGH",
        title: "Control Center degraded",
        detail: sanitizeDisplayText(message),
        source: "backlog",
      },
    ],
    activity: [],
    roles: CONTROL_CENTER_ROLES.map((role) => ({
      id: role.id,
      name: role.name,
      responsibilities: [...role.responsibilities],
    })),
    control: emptyControlPlane(),
    progress: emptyProgress(),
    lastUpdate: generatedAt,
    humanActions: null,
  };
}

export async function getControlCenterSnapshot(options?: {
  actorRole?: "SUPER_ADMIN" | "ADMIN" | "UNKNOWN";
}): Promise<ControlCenterSnapshot> {
  try {
    return await assembleControlCenterSnapshot(options);
  } catch (error) {
    // Monitoring must never 500 the dashboard for source/assembly failures.
    return buildControlCenterFatalSnapshot(error);
  }
}

async function assembleControlCenterSnapshot(options?: {
  actorRole?: "SUPER_ADMIN" | "ADMIN" | "UNKNOWN";
}): Promise<ControlCenterSnapshot> {
  const generatedAt = new Date().toISOString();
  const warnings: string[] = [];

  const [backlog, productGoal, humanGate, git, fedora] = await Promise.all([
    readBacklogSnapshot(),
    readProductGoalSnapshot(),
    readHumanGateSnapshot(),
    readGitSnapshot(),
    readFedoraTelemetrySnapshot(),
  ]);

  if (backlog.warning) warnings.push(backlog.warning);
  if (productGoal.warning) warnings.push(productGoal.warning);
  if (humanGate.warning) warnings.push(humanGate.warning);
  if (git.warning) warnings.push(git.warning);
  if (fedora.note && fedora.fedoraTelemetry !== "OK") {
    warnings.push(fedora.note);
  }

  const productComplete = await readProductCompleteSnapshot({
    currentHead: git.head,
    currentGoalHash: productGoal.hash,
  });
  if (productComplete.warning) warnings.push(productComplete.warning);

  const github = await readGithubSnapshot({
    repository: backlog.repository,
    branch: git.branch,
  });
  if (github.warning) warnings.push(github.warning);

  if (humanGate.reason) {
    humanGate.reason = sanitizeDisplayText(humanGate.reason);
  }
  if (humanGate.requiredAction) {
    humanGate.requiredAction = sanitizeDisplayText(humanGate.requiredAction);
  }
  humanGate.blocking = humanGate.blocking.map((item) =>
    sanitizeDisplayText(item),
  );

  if (productComplete.summary) {
    productComplete.summary = sanitizeDisplayText(productComplete.summary);
  }

  const sources: ControlCenterSources = {
    backlog: backlog.status,
    productGoal: productGoal.status,
    humanGate: humanGate.status === "MISSING" ? "MISSING" : humanGate.status,
    productComplete:
      productComplete.status === "MISSING"
        ? "MISSING"
        : productComplete.status,
    git: git.status,
    github: github.status,
    fedoraTelemetry: fedora.fedoraTelemetry,
  };

  const freshness: Record<keyof ControlCenterSources, Freshness> = {
    backlog: backlog.status === "OK" ? "file" : "unavailable",
    productGoal: productGoal.status === "OK" ? "file" : "unavailable",
    humanGate: humanGate.present ? "file" : "unavailable",
    productComplete: productComplete.present ? "file" : "unavailable",
    git: git.status === "OK" ? "live" : "unavailable",
    github: github.status === "OK" ? "live" : "unavailable",
    fedoraTelemetry:
      fedora.fedoraTelemetry === "OK" && fedora.autopilotLiveState !== "STALE"
        ? "live"
        : fedora.fedoraTelemetry === "OK"
          ? "cached"
          : "unavailable",
  };

  const systemHealth = computeSystemHealth({
    backlogStatus: backlog.status,
    counts: backlog.counts,
    git,
    github,
    humanGate,
    telemetryStale:
      fedora.autopilotLiveState === "STALE"
        ? true
        : fedora.fedoraTelemetry === "OK"
          ? false
          : fedora.fedoraTelemetry === "MISSING"
            ? null
            : null,
    telemetryStatus: fedora.fedoraTelemetry,
  });

  const pipeline = derivePipeline({
    currentTask: backlog.currentTask,
    git,
    github,
    productComplete,
  });

  const efficiency = computeEfficiency({
    counts: backlog.counts,
    tasks: backlog.tasks,
    history: backlog.history,
    humanGatePresent: humanGate.present,
  });

  const blockers = deriveBlockers({
    humanGate,
    github,
    git,
    counts: backlog.counts,
    backlogStatus: backlog.status,
    fedoraConnected:
      fedora.fedoraTelemetry === "OK" && fedora.autopilotLiveState !== "STALE",
    fedoraLiveState: fedora.autopilotLiveState,
  }).map((blocker) => ({
    ...blocker,
    title: sanitizeDisplayText(blocker.title),
    detail: sanitizeDisplayText(blocker.detail),
  }));

  const sanitizedTasks = backlog.tasks.map(sanitizeTask);
  const sanitizedCurrent = backlog.currentTask
    ? sanitizeTask(backlog.currentTask)
    : null;

  const activity = buildActivityFeed({
    history: backlog.history.map((entry) => ({
      ...entry,
      note: sanitizeDisplayText(entry.note),
    })),
    tasks: sanitizedTasks,
    git,
    github,
    humanGate,
    productComplete,
  });

  const recentActions = await readRecentControlActions(20);
  const control = buildControlPlaneSnapshot({
    actorRole: options?.actorRole ?? "UNKNOWN",
    humanGatePresent: humanGate.present,
    agentRunning: fedora.agentRunning,
    autopilotLiveState: fedora.autopilotLiveState,
    gitDirty: git.dirty,
    recentActions,
  });

  const progress = buildProgressSnapshot({
    counts: backlog.counts,
    efficiency,
    fedoraAgeMs: fedora.ageMs,
    fedoraStale: fedora.autopilotLiveState === "STALE",
  });

  const extras = await loadHumanActionPlaneExtras().catch(() => ({
    recentReceipts: [],
    activeIncident: null,
  }));
  const appOriginConfigured = Boolean(process.env.APP_ORIGIN?.trim());
  const localAllowListActive =
    process.env.NODE_ENV !== "production" &&
    Boolean(process.env.X200_LOCAL_ALLOWED_ORIGINS?.trim());
  const humanActions = buildHumanActionPlaneSnapshot({
    actorRole: options?.actorRole ?? "UNKNOWN",
    git,
    github,
    humanGate,
    productComplete,
    fedora,
    currentTask: sanitizedCurrent,
    systemHealth,
    csrfStatus: appOriginConfigured ? "OK" : "CONFIG_MISSING",
    appOriginConfigured,
    localAllowListActive,
    recentReceipts: extras.recentReceipts,
    activeIncident: extras.activeIncident,
  });

  let snapshot: ControlCenterSnapshot = {
    generatedAt,
    sources,
    freshness,
    warnings: warnings.map((warning) => sanitizeDisplayText(warning)),
    systemHealth,
    pipeline,
    backlog: {
      status: backlog.status,
      counts: backlog.counts,
      currentTask: sanitizedCurrent,
      tasks: sanitizedTasks,
    },
    productGoal,
    humanGate,
    productComplete,
    git,
    github,
    fedora: {
      ...fedora,
      note: sanitizeDisplayText(fedora.note),
      host: fedora.host ? sanitizeDisplayText(fedora.host) : null,
      lastEvent: fedora.lastEvent ? sanitizeDisplayText(fedora.lastEvent) : null,
      taskId: fedora.taskId ? sanitizeDisplayText(fedora.taskId) : null,
    },
    efficiency,
    blockers,
    activity,
    roles: CONTROL_CENTER_ROLES.map((role) => ({
      id: role.id,
      name: role.name,
      responsibilities: [...role.responsibilities],
    })),
    control,
    progress,
    lastUpdate: generatedAt,
    humanActions,
  };

  const secretHits = assertNoSecretsInPayload(snapshot);
  if (secretHits.length > 0) {
    snapshot = deepRedactStrings(snapshot) as ControlCenterSnapshot;
    snapshot.warnings = [
      ...snapshot.warnings,
      `Redacted forbidden monitoring patterns (${secretHits.length}) instead of crashing.`,
    ];
    const stillHit = assertNoSecretsInPayload(snapshot);
    if (stillHit.length > 0) {
      // Strip offending activity/evidence rather than HTTP 500.
      snapshot.activity = [];
      snapshot.backlog = {
        ...snapshot.backlog,
        tasks: snapshot.backlog.tasks.map((task) => ({
          ...task,
          evidence: [],
          objective: "[REDACTED]",
          nextAction: null,
          blockedReason: null,
          lastTransitionReason: null,
        })),
        currentTask: snapshot.backlog.currentTask
          ? {
              ...snapshot.backlog.currentTask,
              evidence: [],
              objective: "[REDACTED]",
              nextAction: null,
              blockedReason: null,
              lastTransitionReason: null,
            }
          : null,
      };
      snapshot.warnings.push(
        "Cleared activity/evidence after residual secret-pattern hits.",
      );
    }
  }

  return snapshot;
}

export {
  parseBacklogJson,
  hashProductGoal,
  countDetectableCriteria,
  emptyTaskCounts,
} from "@/lib/x200/sources";
export {
  computeSystemHealth,
  derivePipeline,
  computeEfficiency,
  deriveBlockers,
} from "@/lib/x200/derive";
export { assertNoSecretsInPayload, buildActivityFeed } from "@/lib/x200/activity";
