import type {
  NextSafeAction,
  ReleaseStackSnapshot,
  SourceMatrixRow,
} from "@/lib/x200/mirror/types";
import type {
  AutopilotLiveState,
  GithubSnapshot,
  HumanGateSnapshot,
} from "@/lib/x200/types";

/**
 * Deterministic NEXT SAFE ACTION engine (T047).
 * Never recommends destructive auto-execution.
 */
export function computeNextSafeAction(input: {
  github: Pick<
    GithubSnapshot,
    | "prNumber"
    | "prDraft"
    | "prState"
    | "prMergeable"
    | "ciLatestConclusion"
    | "ciLatestStatus"
    | "status"
  >;
  humanGate: Pick<HumanGateSnapshot, "present" | "requiredAction">;
  fedora: Pick<AutopilotLiveState, "autopilotLiveState" | "agentRunning">;
  sourcesMatrix: SourceMatrixRow[];
  releaseStack: ReleaseStackSnapshot;
  currentTaskId: string | null;
}): NextSafeAction {
  const conflicts = input.sourcesMatrix.filter((row) => row.conflict);
  if (conflicts.length > 0) {
    return {
      code: "RESOLVE_SOURCE_CONFLICT",
      title: "Resolve source conflict",
      detail: conflicts.map((c) => c.conflictLabel).filter(Boolean).join("; "),
      destructive: false,
      requiresHuman: true,
      relatedPr: input.github.prNumber,
      relatedTask: input.currentTaskId,
      evidence: conflicts.map((c) => `${c.domain}:${c.truthSource}`),
    };
  }

  if (input.humanGate.present) {
    return {
      code: "RESOLVE_HUMAN_GATE",
      title: "Human gate waiting",
      detail: input.humanGate.requiredAction ?? "Approve or resolve Human Gate",
      destructive: false,
      requiresHuman: true,
      relatedPr: input.github.prNumber,
      relatedTask: input.currentTaskId,
      evidence: [".x200/HUMAN_GATE.json"],
    };
  }

  const ciStatus = input.github.ciLatestStatus;
  const ciConclusion = input.github.ciLatestConclusion;

  if (ciStatus === "in_progress" || ciStatus === "queued") {
    return {
      code: "WAIT_FOR_CI",
      title: "Wait for CI",
      detail: `CI status=${ciStatus}`,
      destructive: false,
      requiresHuman: false,
      relatedPr: input.github.prNumber,
      relatedTask: input.currentTaskId,
      evidence: ["GitHub Actions"],
    };
  }

  if (ciConclusion && ciConclusion !== "success") {
    return {
      code: "INSPECT_FAILED_STEP",
      title: "Inspect failed CI step",
      detail: `CI conclusion=${ciConclusion}`,
      destructive: false,
      requiresHuman: false,
      relatedPr: input.github.prNumber,
      relatedTask: input.currentTaskId,
      evidence: ["GitHub Actions"],
    };
  }

  if (
    input.releaseStack.nextSafeMerge != null &&
    input.github.prNumber != null &&
    input.releaseStack.nextSafeMerge !== input.github.prNumber
  ) {
    return {
      code: "MERGE_DEPENDENCY_FIRST",
      title: "Merge stack predecessor first",
      detail: `NEXT SAFE MERGE = PR #${input.releaseStack.nextSafeMerge} before PR #${input.github.prNumber}`,
      destructive: false,
      requiresHuman: true,
      relatedPr: input.releaseStack.nextSafeMerge,
      relatedTask: input.currentTaskId,
      evidence: ["GitHub PR stack"],
    };
  }

  if (
    input.github.prState === "open" &&
    input.github.prDraft === true &&
    ciConclusion === "success"
  ) {
    return {
      code: "MARK_READY",
      title: "Mark PR ready for review",
      detail: "PR is draft with green CI",
      destructive: false,
      requiresHuman: true,
      relatedPr: input.github.prNumber,
      relatedTask: input.currentTaskId,
      evidence: ["GitHub API", "CI success"],
    };
  }

  const mergeable =
    input.github.prMergeable === "MERGEABLE" ||
    input.github.prMergeable === "true" ||
    input.github.prMergeable === "clean";

  if (
    input.github.prState === "open" &&
    input.github.prDraft === false &&
    mergeable &&
    ciConclusion === "success"
  ) {
    return {
      code: "REVIEW_MERGE",
      title: "Review merge",
      detail: "PR ready + mergeable + CI success — human approval required",
      destructive: false,
      requiresHuman: true,
      relatedPr: input.github.prNumber,
      relatedTask: input.currentTaskId,
      evidence: ["GitHub API"],
    };
  }

  if (input.fedora.autopilotLiveState === "STALE") {
    return {
      code: "WAIT_AUTOPILOT",
      title: "Autopilot telemetry stale",
      detail: "Refresh telemetry / inspect AUTOPILOT service",
      destructive: false,
      requiresHuman: false,
      relatedPr: input.github.prNumber,
      relatedTask: input.currentTaskId,
      evidence: [".x200/telemetry.json"],
    };
  }

  if (input.github.status !== "OK") {
    return {
      code: "REFRESH_SOURCES",
      title: "Refresh remote sources",
      detail: `GitHub status=${input.github.status}`,
      destructive: false,
      requiresHuman: false,
      relatedPr: null,
      relatedTask: input.currentTaskId,
      evidence: ["GitHub API"],
    };
  }

  return {
    code: "NO_SAFE_ACTION",
    title: "No automatic safe action",
    detail: "Observe Control Center; no non-destructive recommendation",
    destructive: false,
    requiresHuman: false,
    relatedPr: input.github.prNumber,
    relatedTask: input.currentTaskId,
    evidence: ["derived"],
  };
}
