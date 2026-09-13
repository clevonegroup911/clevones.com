import type {
  ErrorIntelligenceItem,
  MirrorNotification,
} from "@/lib/x200/mirror/types";
import type { Blocker, GithubSnapshot, HumanGateSnapshot } from "@/lib/x200/types";
import type { AutopilotLiveState } from "@/lib/x200/types";

export function buildMirrorNotifications(input: {
  generatedAt: string;
  github: GithubSnapshot;
  humanGate: HumanGateSnapshot;
  fedora: AutopilotLiveState;
  incidentPresent: boolean;
  databaseState: string;
}): MirrorNotification[] {
  const notes: MirrorNotification[] = [];

  if (input.github.ciLatestConclusion === "success") {
    notes.push({
      id: `ci-success-${input.github.ciLatestRunId ?? "na"}`,
      kind: "CI_SUCCESS",
      title: "CI SUCCESS",
      detail: `run #${input.github.ciLatestRunNumber ?? "N/A"}`,
      severity: "INFO",
      createdAt: input.generatedAt,
      acknowledged: false,
      source: "GitHub Actions",
    });
  } else if (
    input.github.ciLatestConclusion &&
    input.github.ciLatestConclusion !== "success"
  ) {
    notes.push({
      id: `ci-failed-${input.github.ciLatestRunId ?? "na"}`,
      kind: "CI_FAILED",
      title: "CI FAILED",
      detail: `conclusion=${input.github.ciLatestConclusion}`,
      severity: "ERROR",
      createdAt: input.generatedAt,
      acknowledged: false,
      source: "GitHub Actions",
    });
  }

  if (input.github.prDraft === false && input.github.prState === "open") {
    notes.push({
      id: `pr-ready-${input.github.prNumber ?? "na"}`,
      kind: "PR_READY",
      title: "PR READY",
      detail: `PR #${input.github.prNumber ?? "N/A"} is not draft`,
      severity: "INFO",
      createdAt: input.generatedAt,
      acknowledged: false,
      source: "GitHub API",
    });
  }

  if (input.humanGate.present) {
    notes.push({
      id: `human-gate-${input.humanGate.createdAt ?? "present"}`,
      kind: "HUMAN_GATE",
      title: "Human Gate waiting",
      detail: input.humanGate.requiredAction ?? "decision required",
      severity: "CRITICAL",
      createdAt: input.humanGate.createdAt ?? input.generatedAt,
      acknowledged: false,
      source: ".x200/HUMAN_GATE.json",
    });
  }

  if (input.fedora.autopilotLiveState === "STALE") {
    notes.push({
      id: "autopilot-stalled",
      kind: "AUTOPILOT_STALLED",
      title: "AUTOPILOT stalled",
      detail: input.fedora.note || "telemetry STALE",
      severity: "WARNING",
      createdAt: input.fedora.updatedAt ?? input.generatedAt,
      acknowledged: false,
      source: ".x200/telemetry.json",
    });
  }

  if (
    input.databaseState === "down" ||
    input.databaseState === "unreachable"
  ) {
    notes.push({
      id: "database-down",
      kind: "DATABASE_DOWN",
      title: "Database down",
      detail: input.databaseState,
      severity: "CRITICAL",
      createdAt: input.generatedAt,
      acknowledged: false,
      source: "database",
    });
  }

  if (input.incidentPresent) {
    notes.push({
      id: "incident-active",
      kind: "INCIDENT",
      title: "Active incident",
      detail: "Incident console has an open record",
      severity: "ERROR",
      createdAt: input.generatedAt,
      acknowledged: false,
      source: ".x200/incidents",
    });
  }

  return notes;
}

export function buildErrorIntelligence(input: {
  blockers: Blocker[];
  github: GithubSnapshot;
  warnings: string[];
  currentTaskId: string | null;
  localHead: string | null;
  generatedAt: string;
}): ErrorIntelligenceItem[] {
  const map = new Map<string, ErrorIntelligenceItem>();

  const upsert = (item: Omit<ErrorIntelligenceItem, "count" | "firstSeen" | "lastSeen"> & {
    firstSeen?: string;
    lastSeen?: string;
  }) => {
    const existing = map.get(item.errorCode);
    if (existing) {
      existing.count += 1;
      existing.lastSeen = item.lastSeen ?? input.generatedAt;
      return;
    }
    map.set(item.errorCode, {
      ...item,
      count: 1,
      firstSeen: item.firstSeen ?? input.generatedAt,
      lastSeen: item.lastSeen ?? input.generatedAt,
    });
  };

  for (const blocker of input.blockers) {
    upsert({
      errorCode: `BLOCKER_${blocker.id}`.toUpperCase(),
      component: String(blocker.source),
      timestamp: input.generatedAt,
      source: String(blocker.source),
      relatedTask: input.currentTaskId,
      relatedCommit: input.localHead,
      relatedCi: input.github.ciLatestUrl,
      suggestedSafeAction: "Inspect blocker in Control Center",
    });
  }

  if (
    input.github.ciLatestConclusion &&
    input.github.ciLatestConclusion !== "success"
  ) {
    upsert({
      errorCode: `CI_${input.github.ciLatestConclusion}`.toUpperCase(),
      component: "CI",
      timestamp: input.generatedAt,
      source: "GitHub Actions",
      relatedTask: input.currentTaskId,
      relatedCommit: input.github.prHeadSha,
      relatedCi: input.github.ciLatestUrl,
      suggestedSafeAction: "Open CI Inspector / FAILED STEP",
    });
  }

  for (const warning of input.warnings.slice(0, 20)) {
    const code = `WARN_${warning.slice(0, 40).replace(/\W+/g, "_")}`.toUpperCase();
    upsert({
      errorCode: code.slice(0, 64),
      component: "control-center",
      timestamp: input.generatedAt,
      source: "snapshot.warnings",
      relatedTask: input.currentTaskId,
      relatedCommit: input.localHead,
      relatedCi: input.github.ciLatestUrl,
      suggestedSafeAction: "Refresh sources and inspect warning detail",
    });
  }

  return [...map.values()].sort((a, b) => b.count - a.count);
}
