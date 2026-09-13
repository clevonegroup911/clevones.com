import type {
  Blocker,
  ControlCenterTask,
  EfficiencyMetrics,
  FedoraLiveState,
  GitSnapshot,
  GithubSnapshot,
  HealthCriterion,
  HumanGateSnapshot,
  PipelineStep,
  ProductCompleteSnapshot,
  SourceStatus,
  SystemHealth,
  TaskCounts,
} from "@/lib/x200/types";

/**
 * Deterministic system health (T042).
 *
 * Criteria (documented, visible in UI):
 * 1. backlog readable/valid
 * 2. no ÉCHOUÉE tasks
 * 3. no BLOQUÉE tasks
 * 4. worktree clean (when git known)
 * 5. latest CI conclusion success (when GitHub CI known)
 * 6. no active Human Gate file
 *
 * Score percent = passed / applicable × 100 (null if zero applicable → UNKNOWN).
 * Status:
 * - BLOCKED if Human Gate present OR ÉCHOUÉE>0 OR (CI known failure) OR backlog invalid
 * - DEGRADED if any applicable criterion fails without BLOCKED conditions
 * - HEALTHY if all applicable pass
 * - UNKNOWN if backlog unknown and no other conclusive signal
 */
export function computeSystemHealth(input: {
  backlogStatus: SourceStatus;
  counts: TaskCounts | null;
  git: Pick<GitSnapshot, "status" | "dirty">;
  github: Pick<
    GithubSnapshot,
    "status" | "ciLatestConclusion" | "ciLatestStatus"
  >;
  humanGate: Pick<HumanGateSnapshot, "present" | "status">;
}): SystemHealth {
  const criteria: HealthCriterion[] = [];

  const backlogOk =
    input.backlogStatus === "OK"
      ? true
      : input.backlogStatus === "UNKNOWN"
        ? null
        : false;
  criteria.push({
    id: "backlog_valid",
    label: "Backlog lisible / valide",
    passed: backlogOk,
    detail: `source=${input.backlogStatus}`,
  });

  const failedCount = input.counts?.["ÉCHOUÉE"] ?? null;
  criteria.push({
    id: "no_failed",
    label: "Aucune tâche ÉCHOUÉE",
    passed:
      failedCount === null ? null : failedCount === 0,
    detail:
      failedCount === null ? "counts unavailable" : `ÉCHOUÉE=${failedCount}`,
  });

  const blockedCount = input.counts?.["BLOQUÉE"] ?? null;
  criteria.push({
    id: "no_blocked",
    label: "Aucune tâche BLOQUÉE",
    passed:
      blockedCount === null ? null : blockedCount === 0,
    detail:
      blockedCount === null
        ? "counts unavailable"
        : `BLOQUÉE=${blockedCount}`,
  });

  const dirty = input.git.dirty;
  criteria.push({
    id: "worktree_clean",
    label: "Worktree clean",
    passed:
      input.git.status === "OK" && dirty !== null
        ? dirty === false
        : null,
    detail:
      input.git.status !== "OK"
        ? `git=${input.git.status}`
        : dirty === null
          ? "dirty unknown"
          : dirty
            ? "dirty"
            : "clean",
  });

  const ciConclusion = input.github.ciLatestConclusion;
  const ciKnown =
    input.github.status === "OK" &&
    typeof ciConclusion === "string" &&
    ciConclusion.length > 0;
  criteria.push({
    id: "ci_success",
    label: "CI latest success",
    passed: ciKnown ? ciConclusion === "success" : null,
    detail: ciKnown
      ? `conclusion=${ciConclusion}`
      : `github=${input.github.status}; ci=${ciConclusion ?? "N/A"}`,
  });

  const gatePresent =
    input.humanGate.status === "OK" || input.humanGate.status === "INVALID"
      ? input.humanGate.present
      : input.humanGate.status === "MISSING"
        ? false
        : null;
  criteria.push({
    id: "no_human_gate",
    label: "Human Gate absent",
    passed: gatePresent === null ? null : gatePresent === false,
    detail:
      gatePresent === null
        ? `humanGate=${input.humanGate.status}`
        : gatePresent
          ? "present"
          : "absent",
  });

  const applicable = criteria.filter((c) => c.passed !== null);
  const passed = applicable.filter((c) => c.passed === true);
  const scorePercent =
    applicable.length === 0
      ? null
      : Math.round((passed.length / applicable.length) * 100);

  const hasFailed = criteria.some((c) => c.passed === false);
  const blocked =
    backlogOk === false ||
    (failedCount !== null && failedCount > 0) ||
    gatePresent === true ||
    (ciKnown && ciConclusion !== "success" && ciConclusion !== "skipped");

  let status: SystemHealth["status"] = "UNKNOWN";
  let rationale = "Insufficient applicable criteria";

  if (blocked) {
    status = "BLOCKED";
    rationale = "Blocking criterion failed (gate, failed tasks, CI, or backlog)";
  } else if (applicable.length === 0) {
    status = "UNKNOWN";
    rationale = "No conclusive health signals";
  } else if (!hasFailed) {
    status = "HEALTHY";
    rationale = `All ${applicable.length} applicable criteria passed`;
  } else {
    status = "DEGRADED";
    rationale = `${passed.length}/${applicable.length} applicable criteria passed`;
  }

  return { status, scorePercent, criteria, rationale };
}

export function derivePipeline(input: {
  currentTask: ControlCenterTask | null;
  git: Pick<GitSnapshot, "status" | "head" | "recentCommits">;
  github: Pick<
    GithubSnapshot,
    | "status"
    | "prNumber"
    | "prDraft"
    | "prState"
    | "ciLatestConclusion"
    | "ciLatestStatus"
    | "ciLatestUrl"
  >;
  productComplete: Pick<
    ProductCompleteSnapshot,
    "present" | "matchesCurrentHead" | "matchesCurrentGoalHash"
  >;
}): PipelineStep[] {
  const task = input.currentTask;
  const status = task?.status ?? null;

  const relatedCommit =
    input.git.status === "OK" && input.git.head ? input.git.head : null;
  const relatedCiUrl = input.github.ciLatestUrl ?? null;
  const taskUpdatedAt = task?.updatedAt ?? null;

  const plan: PipelineStep = {
    id: "PLAN",
    state:
      task || input.productComplete.present
        ? "DONE"
        : "WAITING",
    detail: task
      ? `Task ${task.id} present in registry`
      : input.productComplete.present
        ? "PRODUCT_COMPLETE marker present (historical plan)"
        : "No current task",
    source: "backlog/productComplete",
    evidence: task
      ? `task=${task.id}`
      : input.productComplete.present
        ? "PRODUCT_COMPLETE present"
        : null,
    timestamp: taskUpdatedAt,
    reason: null,
    relatedCommit,
    relatedCiUrl: null,
  };

  const claim: PipelineStep = {
    id: "CLAIM",
    state:
      status === "EN_COURS" || status === "EN_CONTRÔLE" || status === "TERMINÉE"
        ? status === "EN_COURS"
          ? "ACTIVE"
          : "DONE"
        : status
          ? "WAITING"
          : "UNKNOWN",
    detail: task
      ? `status=${task.status}; worker=${task.claimWorkerId ?? "N/A"}`
      : "N/A",
    source: "backlog.claim",
    evidence: task?.claimWorkerId
      ? `worker=${task.claimWorkerId}; expires=${task.claimExpiresAt ?? "N/A"}`
      : null,
    timestamp: taskUpdatedAt,
    reason: task?.lastTransitionReason ?? null,
    relatedCommit,
    relatedCiUrl: null,
  };

  const build: PipelineStep = {
    id: "BUILD",
    state:
      status === "EN_COURS"
        ? "ACTIVE"
        : status === "EN_CONTRÔLE" || status === "TERMINÉE"
          ? "DONE"
          : status === "ÉCHOUÉE"
            ? "FAILED"
            : status
              ? "WAITING"
              : "UNKNOWN",
    detail: task?.nextAction ?? "Derived from task status only",
    source: "backlog.status",
    evidence: task?.nextAction ?? null,
    timestamp: taskUpdatedAt,
    reason: task?.blockedReason ?? null,
    relatedCommit,
    relatedCiUrl: null,
  };

  const test: PipelineStep = {
    id: "TEST",
    state:
      status === "EN_CONTRÔLE" || status === "TERMINÉE"
        ? "DONE"
        : status === "EN_COURS"
          ? "ACTIVE"
          : status === "ÉCHOUÉE"
            ? "FAILED"
            : status
              ? "WAITING"
              : "UNKNOWN",
    detail: "Inferred from EN_CONTRÔLE/TERMINÉE transitions when present",
    source: "backlog.status",
    evidence:
      status === "EN_CONTRÔLE" || status === "TERMINÉE"
        ? `status=${status}`
        : null,
    timestamp: taskUpdatedAt,
    reason: null,
    relatedCommit,
    relatedCiUrl: null,
  };

  const hasLocalHead =
    input.git.status === "OK" && Boolean(input.git.head);
  const pushFixed: PipelineStep = {
    id: "PUSH",
    state: !hasLocalHead
      ? "UNKNOWN"
      : input.github.status === "OK" && input.github.prNumber != null
        ? "DONE"
        : input.git.recentCommits.length > 0
          ? "WAITING"
          : "WAITING",
    detail:
      input.github.prNumber != null
        ? `PR #${input.github.prNumber}`
        : hasLocalHead
          ? `Local HEAD ${input.git.head?.slice(0, 7) ?? "N/A"}; remote PR not confirmed`
          : "UNKNOWN",
    source: "git/github",
    evidence: relatedCommit ? `head=${relatedCommit.slice(0, 12)}` : null,
    timestamp: input.git.recentCommits[0]?.at ?? null,
    reason: null,
    relatedCommit,
    relatedCiUrl: null,
  };

  const ciConclusion = input.github.ciLatestConclusion;
  const ciStatus = input.github.ciLatestStatus;
  const ci: PipelineStep = {
    id: "CI",
    state:
      input.github.status !== "OK" && !ciConclusion
        ? "UNKNOWN"
        : ciStatus === "in_progress" || ciStatus === "queued"
          ? "ACTIVE"
          : ciConclusion === "success"
            ? "DONE"
            : ciConclusion === "failure" ||
                ciConclusion === "cancelled" ||
                ciConclusion === "timed_out"
              ? "FAILED"
              : "WAITING",
    detail: ciConclusion
      ? `conclusion=${ciConclusion}`
      : ciStatus
        ? `status=${ciStatus}`
        : "CI not available",
    source: "github.actions",
    evidence: ciConclusion
      ? `conclusion=${ciConclusion}`
      : ciStatus
        ? `status=${ciStatus}`
        : null,
    timestamp: null,
    reason: null,
    relatedCommit,
    relatedCiUrl,
  };

  const review: PipelineStep = {
    id: "REVIEW",
    state:
      input.github.prNumber == null
        ? "UNKNOWN"
        : input.github.prDraft === true
          ? "ACTIVE"
          : input.github.prState === "open"
            ? "ACTIVE"
            : input.github.prState === "closed"
              ? "DONE"
              : "WAITING",
    detail:
      input.github.prNumber != null
        ? `PR #${input.github.prNumber} draft=${String(input.github.prDraft)}`
        : "No PR",
    source: "github.pr",
    evidence:
      input.github.prNumber != null
        ? `PR #${input.github.prNumber}`
        : null,
    timestamp: null,
    reason: null,
    relatedCommit,
    relatedCiUrl,
  };

  const merge: PipelineStep = {
    id: "MERGE",
    state:
      input.github.prState === "closed" && input.github.prDraft === false
        ? "DONE"
        : input.productComplete.matchesCurrentHead === true &&
            input.productComplete.matchesCurrentGoalHash === true
          ? "WAITING"
          : "WAITING",
    detail: "Merge remains a human gate — never auto-derived as production done",
    source: "human-gate",
    evidence: "Human approval required",
    timestamp: null,
    reason: "HUMAN_GATE",
    relatedCommit,
    relatedCiUrl: null,
  };

  return [plan, claim, build, test, pushFixed, ci, review, merge];
}

export function computeEfficiency(input: {
  counts: TaskCounts | null;
  tasks: ControlCenterTask[];
  history: Array<{ at: string; taskId: string; status: string }>;
  humanGatePresent: boolean;
}): EfficiencyMetrics {
  const notes: string[] = [];
  const counts = input.counts;
  const completedTasks = counts?.["TERMINÉE"] ?? 0;
  const failedTasks = counts?.["ÉCHOUÉE"] ?? 0;
  const blockedTasks = counts?.["BLOQUÉE"] ?? 0;
  const totalAttempts = input.tasks.reduce(
    (sum, task) => sum + (Number.isFinite(task.attempts) ? task.attempts : 0),
    0,
  );

  const finished = completedTasks + failedTasks;
  const successRatePercent =
    finished > 0 ? Math.round((completedTasks / finished) * 1000) / 10 : null;
  if (successRatePercent === null) {
    notes.push("Donnée insuffisante pour le taux de réussite");
  }

  const completed = input.tasks.filter((task) => task.status === "TERMINÉE");
  const averageAttemptsOnCompleted =
    completed.length > 0
      ? Math.round(
          (completed.reduce((sum, task) => sum + task.attempts, 0) /
            completed.length) *
            100,
        ) / 100
      : null;

  // Average cycle days only if history has enough dated TERMINÉE transitions
  // with prior EN_COURS for the same task.
  const byTask = new Map<string, string[]>();
  for (const entry of input.history) {
    if (!/^\d{4}-\d{2}-\d{2}/.test(entry.at)) continue;
    const list = byTask.get(entry.taskId) ?? [];
    if (entry.status === "EN_COURS" || entry.status === "TERMINÉE") {
      list.push(`${entry.status}@${entry.at.slice(0, 10)}`);
      byTask.set(entry.taskId, list);
    }
  }

  const cycleDays: number[] = [];
  for (const events of byTask.values()) {
    const start = events.find((e) => e.startsWith("EN_COURS@"));
    const end = [...events].reverse().find((e) => e.startsWith("TERMINÉE@"));
    if (!start || !end) continue;
    const startDate = Date.parse(start.split("@")[1] ?? "");
    const endDate = Date.parse(end.split("@")[1] ?? "");
    if (!Number.isFinite(startDate) || !Number.isFinite(endDate)) continue;
    const days = Math.max(0, (endDate - startDate) / 86_400_000);
    cycleDays.push(days);
  }

  const averageCycleDays =
    cycleDays.length >= 3
      ? Math.round(
          (cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length) * 10,
        ) / 10
      : null;
  if (averageCycleDays === null) {
    notes.push("Donnée insuffisante pour le cycle moyen (≥3 paires EN_COURS→TERMINÉE datées)");
  }

  return {
    completedTasks,
    successRatePercent,
    totalAttempts,
    blockedTasks,
    failedTasks,
    averageAttemptsOnCompleted,
    averageCycleDays,
    humanWaitHint: input.humanGatePresent
      ? "HUMAN_GATE present — waiting on owner"
      : "N/A",
    notes,
  };
}

export function deriveBlockers(input: {
  humanGate: HumanGateSnapshot;
  github: GithubSnapshot;
  git: GitSnapshot;
  counts: TaskCounts | null;
  backlogStatus: SourceStatus;
  fedoraConnected: boolean;
  fedoraLiveState?: FedoraLiveState;
}): Blocker[] {
  const blockers: Blocker[] = [];

  if (input.humanGate.present) {
    blockers.push({
      id: "human_gate",
      severity: "CRITICAL",
      title: "HUMAN_GATE actif",
      detail: input.humanGate.reason ?? "Human gate file present",
      source: "humanGate",
    });
  }

  if (
    input.github.ciLatestConclusion === "failure" ||
    input.github.ciLatestConclusion === "timed_out"
  ) {
    blockers.push({
      id: "ci_failure",
      severity: "HIGH",
      title: "CI failure",
      detail: `conclusion=${input.github.ciLatestConclusion}`,
      source: "github",
    });
  }

  if (input.git.dirty === true) {
    blockers.push({
      id: "worktree_dirty",
      severity: "WARNING",
      title: "Worktree dirty",
      detail: `${input.git.dirtyFileCount ?? "?"} modified paths`,
      source: "git",
    });
  }

  if ((input.counts?.["BLOQUÉE"] ?? 0) > 0) {
    blockers.push({
      id: "task_blocked",
      severity: "HIGH",
      title: "Tâche BLOQUÉE",
      detail: `count=${input.counts?.["BLOQUÉE"]}`,
      source: "backlog",
    });
  }

  if ((input.counts?.["ÉCHOUÉE"] ?? 0) > 0) {
    blockers.push({
      id: "task_failed",
      severity: "HIGH",
      title: "Tâche ÉCHOUÉE",
      detail: `count=${input.counts?.["ÉCHOUÉE"]}`,
      source: "backlog",
    });
  }

  if (input.github.status === "UNKNOWN" || input.github.status === "ERROR") {
    blockers.push({
      id: "github_unreachable",
      severity: "WARNING",
      title: "GitHub unreachable / incomplete",
      detail: input.github.warning ?? "GitHub status UNKNOWN",
      source: "github",
    });
  }

  if (input.fedoraLiveState === "STALE") {
    blockers.push({
      id: "telemetry_stale",
      severity: "WARNING",
      title: "Telemetry stale",
      detail: "Fedora AUTOPILOT heartbeat is STALE — supervisor may be stopped",
      source: "fedoraTelemetry",
    });
  } else if (!input.fedoraConnected) {
    blockers.push({
      id: "telemetry_unavailable",
      severity: "INFO",
      title: "Telemetry unavailable",
      detail: "Fedora AUTOPILOT live state WAITING_FOR_TELEMETRY",
      source: "fedoraTelemetry",
    });
  }

  if (input.backlogStatus !== "OK") {
    blockers.push({
      id: "backlog_issue",
      severity: "CRITICAL",
      title: "Backlog unavailable",
      detail: `status=${input.backlogStatus}`,
      source: "backlog",
    });
  }

  return blockers;
}

export const CONTROL_CENTER_ROLES = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    responsibilities: [
      "architecture",
      "revue",
      "contrôle",
      "décision",
      "human gate assistance",
    ],
  },
  {
    id: "autoplan",
    name: "AUTOPLAN",
    responsibilities: ["analyse PRODUCT_GOAL", "création prochaines tâches"],
  },
  {
    id: "autopilot",
    name: "AUTOPILOT",
    responsibilities: [
      "supervision",
      "sélection prochaine action",
      "reprise agents",
    ],
  },
  {
    id: "cursor",
    name: "Cursor Agent",
    responsibilities: [
      "implémentation locale",
      "tests",
      "commit/push autorisés",
    ],
  },
  {
    id: "github",
    name: "GitHub",
    responsibilities: [
      "source de vérité distante",
      "branches",
      "PR",
      "historique",
    ],
  },
  {
    id: "actions",
    name: "GitHub Actions",
    responsibilities: ["CI", "tests", "build", "Playwright", "sécurité"],
  },
  {
    id: "owner",
    name: "Owner / SUPER_ADMIN",
    responsibilities: [
      "merge",
      "production",
      "migrations",
      "secrets",
      "paiements réels",
      "opérations destructives",
    ],
  },
] as const;
