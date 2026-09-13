import "server-only";

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const AUTOPILOT_SYSTEMD_UNIT = "clevones-x200-autopilot.service";

export type AutopilotServiceSnapshot = {
  status: "OK" | "NOT_CONNECTED" | "ERROR" | "UNAVAILABLE";
  activeState: string | null;
  subState: string | null;
  mainPid: number | null;
  nRestarts: number | null;
  serviceActive: boolean | null;
  warning: string | null;
  source: "systemd --user show";
};

function parseShowOutput(stdout: string): {
  activeState: string | null;
  subState: string | null;
  mainPid: number | null;
  nRestarts: number | null;
} {
  const map = new Map<string, string>();
  for (const line of stdout.split("\n")) {
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    map.set(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
  }
  const mainPidRaw = map.get("MainPID");
  const nRestartsRaw = map.get("NRestarts");
  const mainPid =
    mainPidRaw && /^\d+$/.test(mainPidRaw) ? Number(mainPidRaw) : null;
  const nRestarts =
    nRestartsRaw && /^\d+$/.test(nRestartsRaw) ? Number(nRestartsRaw) : null;
  return {
    activeState: map.get("ActiveState") ?? null,
    subState: map.get("SubState") ?? null,
    mainPid: mainPid != null && mainPid > 0 ? mainPid : mainPid === 0 ? 0 : null,
    nRestarts,
  };
}

/**
 * Fixed argv only — never shell, never caller-controlled unit name.
 * `systemctl --user show clevones-x200-autopilot.service -p ...`
 */
export async function readAutopilotServiceSnapshot(
  options?: { env?: NodeJS.ProcessEnv; timeoutMs?: number },
): Promise<AutopilotServiceSnapshot> {
  const env = options?.env ?? process.env;
  if (env.X200_FORCE_SYSTEMD_UNAVAILABLE === "true") {
    return {
      status: "UNAVAILABLE",
      activeState: null,
      subState: null,
      mainPid: null,
      nRestarts: null,
      serviceActive: null,
      warning: "systemd probe forced unavailable",
      source: "systemd --user show",
    };
  }
  if (env.NODE_ENV === "production" && env.X200_ALLOW_PROD_CONTROL !== "true") {
    return {
      status: "UNAVAILABLE",
      activeState: null,
      subState: null,
      mainPid: null,
      nRestarts: null,
      serviceActive: null,
      warning: "systemd probe skipped in production",
      source: "systemd --user show",
    };
  }

  try {
    const { stdout } = await execFileAsync(
      "systemctl",
      [
        "--user",
        "show",
        AUTOPILOT_SYSTEMD_UNIT,
        "--property=ActiveState",
        "--property=SubState",
        "--property=MainPID",
        "--property=NRestarts",
      ],
      {
        cwd: process.cwd(),
        timeout: options?.timeoutMs ?? 5_000,
        maxBuffer: 64 * 1024,
        env: { ...process.env, ...env },
      },
    );
    const parsed = parseShowOutput(stdout);
    if (!parsed.activeState) {
      return {
        status: "ERROR",
        ...parsed,
        serviceActive: null,
        warning: "systemd show returned no ActiveState",
        source: "systemd --user show",
      };
    }
    const serviceActive = parsed.activeState === "active";
    return {
      status: "OK",
      ...parsed,
      serviceActive,
      warning: null,
      source: "systemd --user show",
    };
  } catch (error) {
    return {
      status: "NOT_CONNECTED",
      activeState: null,
      subState: null,
      mainPid: null,
      nRestarts: null,
      serviceActive: null,
      warning:
        error instanceof Error
          ? `systemd unavailable: ${error.message.slice(0, 160)}`
          : "systemd unavailable",
      source: "systemd --user show",
    };
  }
}

export type TelemetryReconcileInput = {
  telemetryStale: boolean;
  telemetryAgentRunning: boolean | null;
  telemetryPid: number | null;
  service: AutopilotServiceSnapshot;
};

export type TelemetryReconcileResult = {
  /** Used for AGENT_BUSY locks — only true when telemetry is fresh AND claimed running. */
  agentRunningForControl: boolean | null;
  agentRunningVerified: boolean | null;
  telemetryState: "FRESH" | "STALE" | "MISSING";
  noteSuffix: string | null;
  code: string | null;
};

/**
 * Stale telemetry must not be authoritative for agent liveness / control locks.
 * Service inactive ⇒ agentRunning=false for control (unlock Start).
 * Service active + stale ⇒ DEGRADED note; do not pretend agent progress is fresh.
 */
export function reconcileAutopilotLiveness(
  input: TelemetryReconcileInput,
): TelemetryReconcileResult {
  if (!input.telemetryStale) {
    const claimed = input.telemetryAgentRunning === true;
    let verified: boolean | null = null;
    if (input.service.status === "OK" && input.service.serviceActive != null) {
      if (!input.service.serviceActive && claimed) {
        verified = false;
      } else if (input.service.serviceActive && claimed) {
        verified = true;
      } else {
        verified = claimed;
      }
    } else {
      verified = claimed ? true : input.telemetryAgentRunning === false ? false : null;
    }
    return {
      agentRunningForControl: input.telemetryAgentRunning,
      agentRunningVerified: verified,
      telemetryState: "FRESH",
      noteSuffix: null,
      code: null,
    };
  }

  // STALE telemetry
  if (input.service.status === "OK" && input.service.serviceActive === false) {
    return {
      agentRunningForControl: false,
      agentRunningVerified: false,
      telemetryState: "STALE",
      noteSuffix:
        "SERVICE_INACTIVE — stale telemetry ignored for agentRunning/control locks",
      code: "SERVICE_INACTIVE_TELEMETRY_STALE",
    };
  }

  if (input.service.status === "OK" && input.service.serviceActive === true) {
    return {
      agentRunningForControl: false,
      agentRunningVerified: null,
      telemetryState: "STALE",
      noteSuffix:
        "SERVICE_ACTIVE_TELEMETRY_STALE — service up but agent progress not verified",
      code: "SERVICE_ACTIVE_TELEMETRY_STALE",
    };
  }

  return {
    agentRunningForControl: false,
    agentRunningVerified: null,
    telemetryState: "STALE",
    noteSuffix:
      "TELEMETRY_STALE — service probe unavailable; refuse to trust historical agentRunning",
    code: "TELEMETRY_STALE_SERVICE_UNKNOWN",
  };
}
