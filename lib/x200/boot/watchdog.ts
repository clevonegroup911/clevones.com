/**
 * Bounded local self-recovery watchdog state machine.
 * Never reboots the host, never kills unknown PIDs, never resets DB.
 */

import {
  WATCHDOG_COOLDOWN_MS,
  WATCHDOG_FAILURE_THRESHOLD,
  WATCHDOG_MAX_RECOVERIES,
} from "@/lib/x200/boot/constants";

export type WatchdogPersistedState = {
  consecutiveFailures: number;
  recoveryCount: number;
  lastRecoveryAt: string | null;
  lastFailureAt: string | null;
  cooldownUntil: string | null;
  lastCheckAt: string | null;
  lastResult: "OK" | "FAIL" | null;
};

export type WatchdogDecision =
  | { action: "NONE"; reason: string; state: WatchdogPersistedState }
  | { action: "RECORD_OK"; reason: string; state: WatchdogPersistedState }
  | {
      action: "RECOVER";
      reason: string;
      state: WatchdogPersistedState;
    }
  | {
      action: "COOLDOWN";
      reason: string;
      state: WatchdogPersistedState;
    }
  | {
      action: "WAIT_THRESHOLD";
      reason: string;
      state: WatchdogPersistedState;
    };

export function emptyWatchdogState(): WatchdogPersistedState {
  return {
    consecutiveFailures: 0,
    recoveryCount: 0,
    lastRecoveryAt: null,
    lastFailureAt: null,
    cooldownUntil: null,
    lastCheckAt: null,
    lastResult: null,
  };
}

export function isInCooldown(
  state: WatchdogPersistedState,
  nowMs: number,
): boolean {
  if (!state.cooldownUntil) return false;
  const until = Date.parse(state.cooldownUntil);
  return Number.isFinite(until) && until > nowMs;
}

/**
 * Evaluate one health tick. Recovery only after consecutive failures
 * and under max recovery budget; then enters cooldown.
 */
export function evaluateWatchdogTick(input: {
  healthy: boolean;
  state: WatchdogPersistedState;
  nowMs?: number;
  failureThreshold?: number;
  maxRecoveries?: number;
  cooldownMs?: number;
}): WatchdogDecision {
  const nowMs = input.nowMs ?? Date.now();
  const threshold = input.failureThreshold ?? WATCHDOG_FAILURE_THRESHOLD;
  const maxRecoveries = input.maxRecoveries ?? WATCHDOG_MAX_RECOVERIES;
  const cooldownMs = input.cooldownMs ?? WATCHDOG_COOLDOWN_MS;
  const nowIso = new Date(nowMs).toISOString();

  if (isInCooldown(input.state, nowMs)) {
    return {
      action: "COOLDOWN",
      reason: "COOLDOWN_ACTIVE — skipping recovery",
      state: {
        ...input.state,
        lastCheckAt: nowIso,
      },
    };
  }

  if (input.healthy) {
    return {
      action: "RECORD_OK",
      reason: "health OK",
      state: {
        ...input.state,
        consecutiveFailures: 0,
        lastCheckAt: nowIso,
        lastResult: "OK",
        cooldownUntil: null,
      },
    };
  }

  const consecutiveFailures = input.state.consecutiveFailures + 1;
  const base: WatchdogPersistedState = {
    ...input.state,
    consecutiveFailures,
    lastFailureAt: nowIso,
    lastCheckAt: nowIso,
    lastResult: "FAIL",
  };

  if (consecutiveFailures < threshold) {
    return {
      action: "WAIT_THRESHOLD",
      reason: `consecutive failures ${consecutiveFailures}/${threshold}`,
      state: base,
    };
  }

  if (input.state.recoveryCount >= maxRecoveries) {
    return {
      action: "COOLDOWN",
      reason: "MAX_RECOVERIES — entering cooldown",
      state: {
        ...base,
        cooldownUntil: new Date(nowMs + cooldownMs).toISOString(),
      },
    };
  }

  return {
    action: "RECOVER",
    reason: "threshold reached — bounded recovery of allowlisted unit only",
    state: {
      ...base,
      consecutiveFailures: 0,
      recoveryCount: input.state.recoveryCount + 1,
      lastRecoveryAt: nowIso,
      cooldownUntil:
        input.state.recoveryCount + 1 >= maxRecoveries
          ? new Date(nowMs + cooldownMs).toISOString()
          : input.state.cooldownUntil,
    },
  };
}

export function watchdogStatusLabel(
  state: WatchdogPersistedState,
  nowMs = Date.now(),
): "OK" | "DEGRADED" | "COOLDOWN" | "DISABLED" | "UNKNOWN" {
  if (isInCooldown(state, nowMs)) return "COOLDOWN";
  if (state.lastResult === "OK" && state.consecutiveFailures === 0) return "OK";
  if (state.consecutiveFailures > 0) return "DEGRADED";
  if (state.lastResult == null) return "UNKNOWN";
  return "OK";
}
