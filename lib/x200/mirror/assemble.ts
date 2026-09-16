import "server-only";

import { buildCiInspectorFromJobs, emptyCiInspector } from "@/lib/x200/mirror/ci-inspector";
import {
  buildDiffInspectorFromGitNameStatus,
  emptyDiffInspector,
} from "@/lib/x200/mirror/diff-inspector";
import { buildGlobalCommandCenterFacts } from "@/lib/x200/mirror/facts";
import { formatAgeLabel, freshnessFromAge } from "@/lib/x200/mirror/freshness";
import {
  fetchCiJobs,
  fetchMainHead,
  fetchOpenPrs,
  readLocalDiffNameStatus,
  readWorktreePath,
} from "@/lib/x200/mirror/github-extended";
import { buildControlledLogs } from "@/lib/x200/mirror/logs";
import { computeNextSafeAction } from "@/lib/x200/mirror/next-safe-action";
import {
  buildMirrorNotifications,
  buildErrorIntelligence,
} from "@/lib/x200/mirror/notifications";
import { buildOperatorView } from "@/lib/x200/mirror/operator-view";
import {
  buildAutopilotLiveExtended,
  buildCommandPaletteActions,
  buildCursorAgentSnapshot,
  buildHumanDecisionCards,
  buildTaskControlRows,
} from "@/lib/x200/mirror/panels";
import { buildReleaseStack } from "@/lib/x200/mirror/release-stack";
import { buildSourceOfTruthMatrix } from "@/lib/x200/mirror/sources-matrix";
import type { OperationalMirrorSnapshot } from "@/lib/x200/mirror/types";
import type { HumanActionPlaneSnapshot } from "@/lib/x200/actions/types";
import type {
  AutopilotLiveState,
  Blocker,
  ControlCenterTask,
  ControlPlaneSnapshot,
  GitSnapshot,
  GithubSnapshot,
  HumanGateSnapshot,
  ProductCompleteSnapshot,
  SourceStatus,
} from "@/lib/x200/types";

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
  onTimeout: () => void,
): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      onTimeout();
      resolve(fallback);
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        onTimeout();
        resolve(fallback);
      });
  });
}

export async function assembleOperationalMirror(input: {
  generatedAt: string;
  repository: string;
  git: GitSnapshot;
  github: GithubSnapshot;
  fedora: AutopilotLiveState;
  humanGate: HumanGateSnapshot;
  productComplete: ProductCompleteSnapshot;
  backlogStatus: SourceStatus;
  currentTask: ControlCenterTask | null;
  nextTaskId: string | null;
  tasks: ControlCenterTask[];
  blockers: Blocker[];
  warnings: string[];
  control: ControlPlaneSnapshot;
  humanActions: HumanActionPlaneSnapshot | null | undefined;
  paymentsLive?: string;
}): Promise<OperationalMirrorSnapshot> {
  const degradationNotes: string[] = [];
  const markDegraded = (note: string) => {
    degradationNotes.push(note);
  };

  const e2eFast = ["1", "true", "yes", "on"].includes(
    String(process.env.X200_E2E || "").toLowerCase(),
  );
  const [mainRes, openPrsRes, ciJobsRes, diffRes, worktreePath] =
    await Promise.all([
      e2eFast
        ? Promise.resolve({
            sha: null as string | null,
            warning: "e2e: remote main HEAD skipped",
            source: "NOT_CONNECTED" as const,
          })
        : withTimeout(
            fetchMainHead(input.repository),
            10_000,
            { sha: null, warning: "main HEAD timeout", source: "NOT_CONNECTED" as const },
            () => markDegraded("main HEAD fetch timeout/degraded"),
          ),
      e2eFast
        ? Promise.resolve({
            prs: [] as Awaited<ReturnType<typeof fetchOpenPrs>>["prs"],
            warning: "e2e: remote open PRs skipped",
            source: "NOT_CONNECTED" as const,
          })
        : withTimeout(
            fetchOpenPrs(input.repository),
            10_000,
            { prs: [], warning: "open PRs timeout", source: "NOT_CONNECTED" as const },
            () => markDegraded("open PRs fetch timeout/degraded"),
          ),
      e2eFast
        ? Promise.resolve({
            jobs: [] as Awaited<ReturnType<typeof fetchCiJobs>>["jobs"],
            durationMs: null as number | null,
            warning: "e2e: remote CI jobs skipped",
            source: "NOT_CONNECTED" as const,
          })
        : withTimeout(
            fetchCiJobs({
              repository: input.repository,
              runId: input.github.ciLatestRunId,
            }),
            12_000,
            {
              jobs: [],
              durationMs: null,
              warning: "CI jobs timeout",
              source: "NOT_CONNECTED" as const,
            },
            () => markDegraded("CI jobs fetch timeout/degraded"),
          ),
      withTimeout(
        readLocalDiffNameStatus(),
        8_000,
        { nameStatus: "", numstat: "", warning: "diff timeout" },
        () => markDegraded("git diff timeout/degraded"),
      ),
      withTimeout(
        readWorktreePath(),
        5_000,
        process.cwd(),
        () => markDegraded("worktree path timeout"),
      ),
    ]);

  if (mainRes.warning) markDegraded(mainRes.warning);
  if (openPrsRes.warning) markDegraded(openPrsRes.warning);
  if (ciJobsRes.warning) markDegraded(ciJobsRes.warning);
  if (diffRes.warning) markDegraded(diffRes.warning);

  const databaseState =
    process.env.DATABASE_URL?.trim()
      ? "configured (connectivity NOT probed in mirror)"
      : "NOT_CONNECTED";
  const backupState = "NOT_AVAILABLE";
  const migrationState = "NOT_AVAILABLE";
  const incidentState = input.humanActions?.activeIncident
    ? `OPEN:${input.humanActions.activeIncident.severity}`
    : "none";
  const deployedProductionSha = null;
  const paymentsLive = input.paymentsLive ?? input.humanActions?.paymentsLive ?? "NOT_AVAILABLE";

  const driftLabel =
    input.humanActions?.drift?.state ??
    (input.git.head &&
    input.github.prHeadSha &&
    input.git.head !== input.github.prHeadSha
      ? "DRIFT"
      : input.git.head
        ? "IN_SYNC_OR_UNKNOWN"
        : "UNKNOWN");

  const genAge = Math.max(0, Date.now() - Date.parse(input.generatedAt));
  const githubFreshness = freshnessFromAge(genAge, 60_000, "live");
  const telemetryFreshness = freshnessFromAge(
    input.fedora.ageMs,
    180_000,
    "live",
  );

  const sourcesMatrix = buildSourceOfTruthMatrix({
    git: input.git,
    github: input.github,
    fedora: input.fedora,
    backlogStatus: input.backlogStatus,
    mainHead: mainRes.sha,
    deployedProductionSha,
    databaseState,
    backupState,
    migrationState,
    paymentsLive: String(paymentsLive),
    secretsConnected: Boolean(process.env.AUTH_SECRET?.trim()),
    monitoringStatus:
      input.fedora.fedoraTelemetry === "OK" ? "OK" : input.fedora.fedoraTelemetry,
    githubAgeLabel: formatAgeLabel(genAge),
    telemetryAgeLabel: formatAgeLabel(input.fedora.ageMs),
    githubFreshness,
    telemetryFreshness,
  });

  const releaseStack = buildReleaseStack({
    openPrs: openPrsRes.prs.map((pr) =>
      pr.number === input.github.prNumber
        ? { ...pr, ciConclusion: input.github.ciLatestConclusion }
        : pr,
    ),
    currentPrNumber: input.github.prNumber,
    githubStatus: input.github.status,
    openPrsSource: openPrsRes.source,
  });

  const ciInspector =
    input.github.ciLatestRunId != null
      ? buildCiInspectorFromJobs({
          runId: input.github.ciLatestRunId,
          runNumber: input.github.ciLatestRunNumber,
          runUrl: input.github.ciLatestUrl,
          runStatus: input.github.ciLatestStatus,
          runConclusion: input.github.ciLatestConclusion,
          durationMs: ciJobsRes.durationMs,
          jobs: ciJobsRes.jobs,
          fetchedAt: input.generatedAt,
          warning: ciJobsRes.warning,
        })
      : emptyCiInspector(ciJobsRes.warning ?? "No CI run");

  const diffInspector =
    diffRes.nameStatus || diffRes.numstat
      ? buildDiffInspectorFromGitNameStatus({
          nameStatusStdout: diffRes.nameStatus,
          numstatStdout: diffRes.numstat,
          commits: input.git.recentCommits,
          warning: diffRes.warning,
        })
      : emptyDiffInspector(diffRes.warning ?? "No local diff");

  // If worktree clean, still show recent commits as change history context.
  if (
    (!diffInspector.filesChanged || diffInspector.filesChanged === 0) &&
    input.git.recentCommits.length > 0
  ) {
    diffInspector.commits = input.git.recentCommits.slice(0, 20);
    if (!diffInspector.warning) {
      diffInspector.warning =
        input.git.dirty === false
          ? "Worktree clean — showing recent commit list only"
          : diffInspector.warning;
    }
  }

  const nextSafeAction = computeNextSafeAction({
    github: input.github,
    humanGate: input.humanGate,
    fedora: input.fedora,
    sourcesMatrix,
    releaseStack,
    currentTaskId: input.currentTask?.id ?? null,
  });

  const operatorView = buildOperatorView({
    github: input.github,
    humanGate: input.humanGate,
    sourcesMatrix,
    blockers: input.blockers,
    nextSafeAction,
    driftLabel: String(driftLabel),
    mainHead: mainRes.sha,
  });

  const globalFacts = buildGlobalCommandCenterFacts({
    generatedAt: input.generatedAt,
    environment: process.env.NODE_ENV || "unknown",
    repository: input.repository,
    git: input.git,
    github: input.github,
    fedora: input.fedora,
    humanGate: input.humanGate,
    productComplete: input.productComplete,
    currentTask: input.currentTask,
    nextTaskId: input.nextTaskId,
    mainHead: mainRes.sha,
    worktreePath,
    databaseState,
    backupState,
    migrationState,
    incidentState,
    deployedProductionSha,
    driftLabel: String(driftLabel),
    ciDurationMs: ciJobsRes.durationMs,
  });

  const inbox = input.humanActions?.inbox ?? [];
  const humanDecisions = buildHumanDecisionCards(
    inbox,
    input.github.prHeadSha ?? input.git.head,
  );

  const notifications = buildMirrorNotifications({
    generatedAt: input.generatedAt,
    github: input.github,
    humanGate: input.humanGate,
    fedora: input.fedora,
    incidentPresent: Boolean(input.humanActions?.activeIncident),
    databaseState,
  });

  const errorIntelligence = buildErrorIntelligence({
    blockers: input.blockers,
    github: input.github,
    warnings: input.warnings,
    currentTaskId: input.currentTask?.id ?? null,
    localHead: input.git.head,
    generatedAt: input.generatedAt,
  });

  const logs = buildControlledLogs({
    generatedAt: input.generatedAt,
    telemetryNote: input.fedora.note,
    telemetryEvent: input.fedora.lastEvent,
    warnings: input.warnings,
    receiptSummaries: (input.humanActions?.recentReceipts ?? []).map((r) => ({
      at: r.finishedAt,
      action: r.action,
      result: r.result,
      message: r.message,
    })),
    incidentSummaries: input.humanActions?.activeIncident
      ? [
          {
            at: input.generatedAt,
            message: `${input.humanActions.activeIncident.incidentId} ${input.humanActions.activeIncident.severity}`,
            level: "ERROR",
          },
        ]
      : [],
    ciSummary:
      input.github.ciLatestRunNumber != null
        ? `CI #${input.github.ciLatestRunNumber} ${input.github.ciLatestConclusion ?? input.github.ciLatestStatus ?? "unknown"}`
        : null,
  });

  return {
    generatedAt: input.generatedAt,
    degraded: degradationNotes.length > 0,
    degradationNotes,
    globalFacts,
    sourcesMatrix,
    ciInspector,
    diffInspector,
    releaseStack,
    cursorAgent: buildCursorAgentSnapshot({
      fedora: input.fedora,
      currentTask: input.currentTask,
      git: input.git,
    }),
    autopilotLive: buildAutopilotLiveExtended({
      fedora: input.fedora,
      git: input.git,
    }),
    taskControl: buildTaskControlRows(input.tasks, input.github),
    humanDecisions,
    nextSafeAction,
    operatorView,
    notifications,
    errorIntelligence,
    logs,
    commandPalette: buildCommandPaletteActions({
      controlMode: input.control.mode,
      canMutate: input.control.canMutate,
      agentRunning: input.fedora.agentRunning,
      humanGatePresent: input.humanGate.present,
      prNumber: input.github.prNumber,
      prDraft: input.github.prDraft,
      ciConclusion: input.github.ciLatestConclusion,
    }),
    mainHead: mainRes.sha,
    openPrCount: openPrsRes.prs.length,
    worktreePath,
    databaseState,
    backupState,
    migrationState,
    incidentState,
    deployedProductionSha,
  };
}

export function emptyOperationalMirror(
  generatedAt: string,
  note: string,
): OperationalMirrorSnapshot {
  return {
    generatedAt,
    degraded: true,
    degradationNotes: [note],
    globalFacts: [],
    sourcesMatrix: [],
    ciInspector: emptyCiInspector(note),
    diffInspector: emptyDiffInspector(note),
    releaseStack: {
      status: "UNKNOWN",
      nodes: [],
      mergeOrder: [],
      nextSafeMerge: null,
      nextSafeMergeReason: note,
      requiresApproval: true,
      warning: note,
    },
    cursorAgent: {
      status: "NOT_CONNECTED",
      task: null,
      branch: null,
      startedAt: null,
      runtimeMs: null,
      lastProgress: null,
      filesModified: null,
      testsStatus: null,
      note,
    },
    autopilotLive: {
      serviceState: "UNKNOWN",
      pid: null,
      mode: null,
      agentRunning: null,
      lastEvent: null,
      heartbeat: null,
      heartbeatAge: null,
      cycle: null,
      taskClaimed: null,
      taskRuntime: null,
      lastExit: null,
      restartCount: null,
      lockState: null,
      dirtyWorktree: null,
      source: "unavailable",
      note,
      autopilotServiceState: null,
      autopilotPid: null,
      telemetryState: null,
      telemetryAge: null,
      agentRunningVerified: null,
      serviceReconcileCode: null,
    },
    taskControl: [],
    humanDecisions: [],
    nextSafeAction: {
      code: "UNKNOWN",
      title: "Mirror degraded",
      detail: note,
      destructive: false,
      requiresHuman: false,
      relatedPr: null,
      relatedTask: null,
      evidence: [],
    },
    operatorView: {
      currentFacts: ["Mirror degraded"],
      evidence: [],
      conflicts: [],
      risks: [note],
      blockers: [],
      nextSafeAction: "REFRESH_SOURCES",
      humanDecisionRequired: null,
    },
    notifications: [],
    errorIntelligence: [],
    logs: [],
    commandPalette: [
      {
        id: "refresh_all",
        label: "Refresh all",
        available: true,
        reason: null,
        requiresHuman: false,
      },
    ],
    mainHead: null,
    openPrCount: null,
    worktreePath: null,
    databaseState: "NOT_CONNECTED",
    backupState: "NOT_AVAILABLE",
    migrationState: "NOT_AVAILABLE",
    incidentState: "UNKNOWN",
    deployedProductionSha: null,
  };
}
