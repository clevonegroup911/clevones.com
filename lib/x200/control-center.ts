import "server-only";

import { buildActivityFeed, assertNoSecretsInPayload } from "@/lib/x200/activity";
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
} from "@/lib/x200/sources";
import { readFedoraTelemetrySnapshot } from "@/lib/x200/telemetry";
import type {
  ControlCenterSnapshot,
  ControlCenterSources,
  ControlCenterTask,
  Freshness,
} from "@/lib/x200/types";

function sanitizeDisplayText(value: string): string {
  return value
    .replace(/recovery\s*codes?/gi, "[REDACTED_RECOVERY]")
    .replace(/otpauth:\/\/\S+/gi, "[REDACTED_OTP]")
    .replace(
      /(authorization|bearer|token|password|secret|cookie|session)[=:\s]+[^\s,;]+/gi,
      "$1=[REDACTED]",
    )
    .replace(/ghp_[A-Za-z0-9]{20,}/g, "[REDACTED_TOKEN]")
    .replace(/github_pat_[A-Za-z0-9_]{20,}/g, "[REDACTED_TOKEN]");
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

export async function getControlCenterSnapshot(): Promise<ControlCenterSnapshot> {
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

  const snapshot: ControlCenterSnapshot = {
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
    lastUpdate: generatedAt,
  };

  const secretHits = assertNoSecretsInPayload(snapshot);
  if (secretHits.length > 0) {
    throw new Error(
      `Refusing Control Center payload: forbidden pattern(s) ${secretHits.join(", ")}`,
    );
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
