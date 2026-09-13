import "server-only";

import { readRecentReceipts } from "@/lib/x200/actions/audit";
import { computeDrift } from "@/lib/x200/actions/drift";
import { buildHumanActionInbox } from "@/lib/x200/actions/inbox";
import { readActiveIncident } from "@/lib/x200/actions/incident";
import { buildNotificationAdapterStatus } from "@/lib/x200/actions/notifications";
import {
  isHumanActionsEnvEnabled,
  isProductionActionsEnvEnabled,
} from "@/lib/x200/actions/policy";
import { buildSecretsStatus } from "@/lib/x200/actions/secrets-status";
import { detectAutopilotStall } from "@/lib/x200/actions/stall";
import type { HumanActionPlaneSnapshot } from "@/lib/x200/actions/types";
import type {
  AutopilotLiveState,
  ControlCenterTask,
  GitSnapshot,
  GithubSnapshot,
  HumanGateSnapshot,
  ProductCompleteSnapshot,
  SystemHealth,
} from "@/lib/x200/types";

export function buildHumanActionPlaneSnapshot(input: {
  actorRole: "SUPER_ADMIN" | "ADMIN" | "UNKNOWN";
  git: GitSnapshot;
  github: GithubSnapshot;
  humanGate: HumanGateSnapshot;
  productComplete: ProductCompleteSnapshot;
  fedora: AutopilotLiveState;
  currentTask: ControlCenterTask | null;
  systemHealth: SystemHealth;
  csrfStatus: "OK" | "ORIGIN_MISMATCH" | "CONFIG_MISSING";
  appOriginConfigured: boolean;
  localAllowListActive: boolean;
  mainHead?: string | null;
  deployedProductionSha?: string | null;
  env?: NodeJS.ProcessEnv;
  recentReceipts?: HumanActionPlaneSnapshot["recentReceipts"];
  activeIncident?: HumanActionPlaneSnapshot["activeIncident"];
}): HumanActionPlaneSnapshot {
  const env = input.env ?? process.env;
  const enabled = isHumanActionsEnvEnabled(env);
  const productionEnabled = isProductionActionsEnvEnabled(env);

  const drift = computeDrift({
    localHead: input.git.head,
    prHead: input.github.prHeadSha,
    mainHead: input.mainHead ?? null,
    deployedProductionSha: input.deployedProductionSha ?? null,
    productCompleteHead: input.productComplete.head,
  });

  const inbox = buildHumanActionInbox({
    humanGate: input.humanGate,
    github: input.github,
    git: input.git,
    currentTask: input.currentTask,
    paymentsLiveAvailable: false,
  });

  const stall = detectAutopilotStall({
    fedora: input.fedora,
    git: input.git,
  });

  const controlLocal = enabled && input.actorRole === "SUPER_ADMIN";

  return {
    enabled,
    productionEnabled,
    csrf: {
      status: input.csrfStatus,
      appOriginConfigured: input.appOriginConfigured,
      localAllowListActive: input.localAllowListActive,
    },
    inbox,
    environments: [
      {
        id: "LOCAL",
        versionSha: input.git.head,
        health: input.systemHealth.status,
        database: env.DATABASE_URL ? "configured" : "missing",
        deployState: "local-dev",
        migrationState: "N/A",
        lastDeploy: null,
        uptime: null,
        controlActionsEnabled: controlLocal,
      },
      {
        id: "STAGING",
        versionSha: null,
        health: "N/A",
        database: "N/A",
        deployState: "NOT_CONNECTED",
        migrationState: "N/A",
        lastDeploy: null,
        uptime: null,
        controlActionsEnabled: false,
      },
      {
        id: "PRODUCTION",
        versionSha: input.deployedProductionSha ?? null,
        health: "UNKNOWN",
        database: "N/A",
        deployState: "NOT_CONNECTED",
        migrationState: "N/A",
        lastDeploy: null,
        uptime: null,
        controlActionsEnabled: false,
      },
    ],
    drift,
    release: {
      currentRelease: input.git.branch,
      candidateRelease: input.github.prNumber
        ? `PR #${input.github.prNumber}`
        : null,
      head: input.git.head,
      ci: input.github.ciLatestConclusion,
      pr:
        input.github.prNumber != null
          ? `#${input.github.prNumber}${input.github.prDraft ? " (draft)" : ""}`
          : null,
      migration: "N/A",
      backup: "UNKNOWN",
      deploymentStatus: productionEnabled ? "FLAG_ENABLED" : "DISABLED",
      frozen: false,
      pipeline: [
        { id: "CODE", state: input.git.head ? "DONE" : "UNKNOWN", detail: "local HEAD" },
        {
          id: "CI",
          state:
            input.github.ciLatestConclusion === "success"
              ? "DONE"
              : input.github.ciLatestConclusion
                ? "FAILED"
                : "WAITING",
          detail: input.github.ciLatestConclusion ?? "N/A",
        },
        {
          id: "REVIEW",
          state: input.github.prDraft === false ? "DONE" : "WAITING",
          detail: input.github.prDraft ? "draft" : "ready",
        },
        { id: "MERGE", state: "WAITING", detail: "human action" },
        { id: "BACKUP", state: "WAITING", detail: "required before prod" },
        { id: "MIGRATION", state: "WAITING", detail: "human action" },
        { id: "DEPLOY", state: "WAITING", detail: "human action" },
        { id: "VERIFY", state: "WAITING", detail: "postcheck" },
        { id: "COMPLETE", state: "WAITING", detail: "not claimed" },
      ],
    },
    secrets: buildSecretsStatus(env),
    paymentsLive: "NOT_AVAILABLE",
    notifications: buildNotificationAdapterStatus(env),
    stall,
    metrics: {
      ciRuns: null,
      ciDuration: null,
      agentCycles: input.fedora.cycle,
      retries: null,
      failureRate: null,
      mttr: null,
      averageTaskDuration: null,
      humanWaitingTime: input.humanGate.present ? "gate waiting" : null,
      deployments: null,
      rollbackCount: null,
      cost: "N/A",
    },
    recentReceipts: input.recentReceipts ?? [],
    activeIncident: input.activeIncident ?? null,
  };
}

export async function loadHumanActionPlaneExtras(cwd = process.cwd()) {
  const [recentReceipts, activeIncident] = await Promise.all([
    readRecentReceipts(20, { cwd }),
    readActiveIncident({ cwd }),
  ]);
  return { recentReceipts, activeIncident };
}
