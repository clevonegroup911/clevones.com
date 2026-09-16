import type {
  MirrorFreshness,
  SourceMatrixRow,
  SourcePlaneState,
} from "@/lib/x200/mirror/types";
import type {
  AutopilotLiveState,
  GitSnapshot,
  GithubSnapshot,
  SourceStatus,
} from "@/lib/x200/types";

function mapSourceStatus(status: SourceStatus): string {
  return status;
}

function planeState(input: {
  local: string;
  remote: string;
  conflict: boolean;
  connected: boolean;
  stale: boolean;
}): SourcePlaneState {
  if (input.conflict) return "CONFLICT";
  if (!input.connected) return "NOT_CONNECTED";
  if (input.stale) return "STALE";
  if (input.local === "OK" || input.remote === "OK") return "VERIFIED";
  if (input.local === "UNKNOWN" || input.remote === "UNKNOWN") return "UNKNOWN";
  return "UNKNOWN";
}

export function buildSourceOfTruthMatrix(input: {
  git: GitSnapshot;
  github: GithubSnapshot;
  fedora: AutopilotLiveState;
  backlogStatus: SourceStatus;
  mainHead: string | null;
  deployedProductionSha: string | null;
  databaseState: string;
  backupState: string;
  migrationState: string;
  paymentsLive: string;
  secretsConnected: boolean;
  monitoringStatus: SourceStatus;
  githubAgeLabel: string | null;
  telemetryAgeLabel: string | null;
  githubFreshness: MirrorFreshness;
  telemetryFreshness: MirrorFreshness;
}): SourceMatrixRow[] {
  const headConflict =
    Boolean(input.git.head) &&
    Boolean(input.github.prHeadSha) &&
    input.git.head !== input.github.prHeadSha;

  const mainDeployConflict =
    Boolean(input.mainHead) &&
    Boolean(input.deployedProductionSha) &&
    input.mainHead !== input.deployedProductionSha;

  const rows: SourceMatrixRow[] = [
    {
      domain: "Git",
      local: mapSourceStatus(input.git.status),
      remote: input.github.status,
      production: input.deployedProductionSha ? "SHA known" : "NOT_CONNECTED",
      truthSource: "git local + GitHub API",
      freshness: input.git.status === "OK" ? "live" : "unavailable",
      ageLabel: null,
      state: planeState({
        local: input.git.status,
        remote: input.github.status,
        conflict: headConflict,
        connected: input.git.status === "OK",
        stale: false,
      }),
      conflict: headConflict,
      conflictLabel: headConflict
        ? "SOURCE_CONFLICT: local HEAD ≠ PR HEAD"
        : null,
    },
    {
      domain: "GitHub",
      local: input.git.branch ?? "N/A",
      remote: input.github.status,
      production: "N/A",
      truthSource: "GitHub API",
      freshness: input.githubFreshness,
      ageLabel: input.githubAgeLabel,
      state: planeState({
        local: "OK",
        remote: input.github.status,
        conflict: false,
        connected: input.github.status === "OK",
        stale: input.githubFreshness === "stale",
      }),
      conflict: false,
      conflictLabel: null,
    },
    {
      domain: "CI",
      local: "N/A",
      remote: input.github.ciLatestConclusion ?? input.github.status,
      production: "N/A",
      truthSource: "GitHub Actions",
      freshness: input.githubFreshness,
      ageLabel: input.githubAgeLabel,
      state: planeState({
        local: "OK",
        remote: input.github.ciLatestConclusion ? "OK" : input.github.status,
        conflict: false,
        connected: Boolean(input.github.ciLatestRunId),
        stale: input.githubFreshness === "stale",
      }),
      conflict: false,
      conflictLabel: null,
    },
    {
      domain: "Backlog",
      local: mapSourceStatus(input.backlogStatus),
      remote: "N/A",
      production: "N/A",
      truthSource: "backlog.json",
      freshness: input.backlogStatus === "OK" ? "file" : "unavailable",
      ageLabel: null,
      state:
        input.backlogStatus === "OK"
          ? "VERIFIED"
          : input.backlogStatus === "UNKNOWN"
            ? "UNKNOWN"
            : "NOT_CONNECTED",
      conflict: false,
      conflictLabel: null,
    },
    {
      domain: "AUTOPILOT",
      local: input.fedora.autopilotLiveState,
      remote: "N/A",
      production: "N/A",
      truthSource: ".x200/telemetry.json / systemd",
      freshness: input.telemetryFreshness,
      ageLabel: input.telemetryAgeLabel,
      state: planeState({
        local: input.fedora.fedoraTelemetry,
        remote: "N/A",
        conflict: false,
        connected: input.fedora.fedoraTelemetry === "OK",
        stale:
          input.fedora.autopilotLiveState === "STALE" ||
          input.telemetryFreshness === "stale",
      }),
      conflict: false,
      conflictLabel: null,
    },
    {
      domain: "Database",
      local: input.databaseState,
      remote: "N/A",
      production: "NOT_CONNECTED",
      truthSource: "database",
      freshness: "unavailable",
      ageLabel: null,
      state:
        input.databaseState === "NOT_CONNECTED" ||
        input.databaseState === "NOT_AVAILABLE"
          ? "NOT_CONNECTED"
          : "UNKNOWN",
      conflict: false,
      conflictLabel: null,
    },
    {
      domain: "Deployment",
      local: input.git.head ?? "N/A",
      remote: input.mainHead ?? "N/A",
      production: input.deployedProductionSha ?? "NOT_CONNECTED",
      truthSource: "deployment adapter",
      freshness: "unavailable",
      ageLabel: null,
      state: input.deployedProductionSha
        ? mainDeployConflict
          ? "CONFLICT"
          : "UNKNOWN"
        : "NOT_CONNECTED",
      conflict: mainDeployConflict,
      conflictLabel: mainDeployConflict
        ? "SOURCE_CONFLICT: main HEAD ≠ deployed production SHA"
        : null,
    },
    {
      domain: "Backups",
      local: input.backupState,
      remote: "N/A",
      production: "NOT_CONNECTED",
      truthSource: "backup adapter",
      freshness: "unavailable",
      ageLabel: null,
      state: "NOT_CONNECTED",
      conflict: false,
      conflictLabel: null,
    },
    {
      domain: "Migrations",
      local: input.migrationState,
      remote: "N/A",
      production: "NOT_CONNECTED",
      truthSource: "Prisma migration history",
      freshness: "unavailable",
      ageLabel: null,
      state: "NOT_CONNECTED",
      conflict: false,
      conflictLabel: null,
    },
    {
      domain: "Payments",
      local: input.paymentsLive,
      remote: "N/A",
      production: "NOT_CONNECTED",
      truthSource: "payment gateway flags",
      freshness: "file",
      ageLabel: null,
      state: "NOT_CONNECTED",
      conflict: false,
      conflictLabel: null,
    },
    {
      domain: "Secrets",
      local: input.secretsConnected ? "configured" : "NOT_CONNECTED",
      remote: "N/A",
      production: "NOT_CONNECTED",
      truthSource: "env presence (names only)",
      freshness: "file",
      ageLabel: null,
      state: input.secretsConnected ? "VERIFIED" : "NOT_CONNECTED",
      conflict: false,
      conflictLabel: null,
    },
    {
      domain: "Monitoring",
      local: mapSourceStatus(input.monitoringStatus),
      remote: input.github.status,
      production: "NOT_CONNECTED",
      truthSource: "control-center sources",
      freshness: input.telemetryFreshness,
      ageLabel: input.telemetryAgeLabel,
      state: planeState({
        local: input.monitoringStatus,
        remote: input.github.status,
        conflict: false,
        connected: input.monitoringStatus === "OK",
        stale: input.telemetryFreshness === "stale",
      }),
      conflict: false,
      conflictLabel: null,
    },
  ];

  return rows;
}
