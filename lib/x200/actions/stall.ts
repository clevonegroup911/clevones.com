import type { StallSnapshot } from "@/lib/x200/actions/types";
import type { AutopilotLiveState, GitSnapshot } from "@/lib/x200/types";

export function detectAutopilotStall(input: {
  fedora: Pick<
    AutopilotLiveState,
    "autopilotLiveState" | "ageMs" | "agentRunning" | "lastEvent"
  >;
  git: Pick<GitSnapshot, "dirty">;
  repeatedFailureCount?: number;
  ciStuck?: boolean;
  staleMs?: number;
}): StallSnapshot {
  const staleMs = input.staleMs ?? 180_000;
  const age = input.fedora.ageMs;

  if (input.fedora.autopilotLiveState === "STALE" || (age != null && age > staleMs)) {
    return {
      stalled: true,
      reason: "heartbeat stale",
      durationMs: age,
      suggestedAction: "Refresh telemetry / Inspect AUTOPILOT / Restart supervisor",
    };
  }

  if (input.fedora.agentRunning === true && age != null && age > staleMs * 2) {
    return {
      stalled: true,
      reason: "agent active too long without fresh heartbeat",
      durationMs: age,
      suggestedAction: "Inspect agent — do not kill active agent from UI",
    };
  }

  if ((input.repeatedFailureCount ?? 0) >= 3) {
    return {
      stalled: true,
      reason: "same failure repeated",
      durationMs: null,
      suggestedAction: "Diagnose and change strategy — stop blind retries",
    };
  }

  if (input.git.dirty === true && input.fedora.autopilotLiveState === "IDLE") {
    return {
      stalled: true,
      reason: "dirty worktree blocked",
      durationMs: null,
      suggestedAction: "Inspect worktree — clean or human resolve",
    };
  }

  if (input.ciStuck) {
    return {
      stalled: true,
      reason: "CI stuck",
      durationMs: null,
      suggestedAction: "Inspect GitHub Actions run",
    };
  }

  return {
    stalled: false,
    reason: null,
    durationMs: null,
    suggestedAction: null,
  };
}
