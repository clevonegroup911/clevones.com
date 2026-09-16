import type {
  CiInspectorSnapshot,
  CiJobDetail,
} from "@/lib/x200/mirror/types";

export function categorizeCiFailure(
  conclusion: string | null,
  failedStep: string | null,
): { errorCategory: string | null; suggestedNextAction: string | null } {
  if (!conclusion || conclusion === "success") {
    return { errorCategory: null, suggestedNextAction: null };
  }
  if (conclusion === "cancelled") {
    return {
      errorCategory: "CANCELLED",
      suggestedNextAction: "Re-run workflow if cancellation was unintended",
    };
  }
  if (conclusion === "timed_out") {
    return {
      errorCategory: "TIMEOUT",
      suggestedNextAction: "Inspect timed-out job; avoid blind retry loops",
    };
  }
  if (failedStep) {
    const lower = failedStep.toLowerCase();
    if (lower.includes("lint")) {
      return {
        errorCategory: "LINT",
        suggestedNextAction: "Inspect lint failures in CI logs",
      };
    }
    if (lower.includes("type") || lower.includes("tsc")) {
      return {
        errorCategory: "TYPECHECK",
        suggestedNextAction: "Inspect TypeScript errors in failed step",
      };
    }
    if (lower.includes("playwright") || lower.includes("e2e")) {
      return {
        errorCategory: "E2E",
        suggestedNextAction: "Inspect Playwright report for failed spec",
      };
    }
    if (lower.includes("secret") || lower.includes("security")) {
      return {
        errorCategory: "SECURITY",
        suggestedNextAction: "Inspect secret scan / security job output",
      };
    }
    if (lower.includes("test")) {
      return {
        errorCategory: "TEST",
        suggestedNextAction: "Inspect failing unit/integration test",
      };
    }
    if (lower.includes("build")) {
      return {
        errorCategory: "BUILD",
        suggestedNextAction: "Inspect build logs for compile/bundle errors",
      };
    }
  }
  return {
    errorCategory: "CI_FAILURE",
    suggestedNextAction: "Inspect FAILED STEP in CI Inspector",
  };
}

export function buildCiInspectorFromJobs(input: {
  runId: number | null;
  runNumber: number | null;
  runUrl: string | null;
  runStatus: string | null;
  runConclusion: string | null;
  durationMs: number | null;
  jobs: CiJobDetail[];
  fetchedAt: string;
  warning?: string | null;
}): CiInspectorSnapshot {
  let failedStep: string | null = null;
  for (const job of input.jobs) {
    if (job.conclusion === "failure" || job.conclusion === "timed_out") {
      const step =
        job.steps.find(
          (s) => s.conclusion === "failure" || s.conclusion === "timed_out",
        ) ?? null;
      failedStep = step?.name ?? job.name;
      break;
    }
  }

  const { errorCategory, suggestedNextAction } = categorizeCiFailure(
    input.runConclusion,
    failedStep,
  );

  return {
    status: input.runId != null ? "OK" : "UNKNOWN",
    runId: input.runId,
    runNumber: input.runNumber,
    runUrl: input.runUrl,
    runStatus: input.runStatus,
    runConclusion: input.runConclusion,
    durationMs: input.durationMs,
    jobs: input.jobs,
    failedStep,
    errorCategory,
    suggestedNextAction,
    fetchedAt: input.fetchedAt,
    warning: input.warning ?? null,
  };
}

export function emptyCiInspector(
  warning: string | null,
): CiInspectorSnapshot {
  return {
    status: "NOT_CONNECTED",
    runId: null,
    runNumber: null,
    runUrl: null,
    runStatus: null,
    runConclusion: null,
    durationMs: null,
    jobs: [],
    failedStep: null,
    errorCategory: null,
    suggestedNextAction: null,
    fetchedAt: null,
    warning,
  };
}
