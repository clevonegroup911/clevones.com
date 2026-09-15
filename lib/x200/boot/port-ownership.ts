/**
 * Port ownership logic — never kill unknown processes.
 */

import {
  CONTROL_CENTER_ENV_MARKER,
  CONTROL_CENTER_PORT,
} from "@/lib/x200/boot/constants";
import type { PortOwner, PortState } from "@/lib/x200/boot/types";

export type PortProbeInput = {
  port?: number;
  listening: boolean;
  pid: number | null;
  processName: string | null;
  cmdline: string | null;
  cwd: string | null;
  environ: string | null;
  listenAddress: string | null;
  repoRoot: string | null;
  controlCenterMainPid: number | null;
};

export type PortProbeResult = {
  port: number;
  owner: PortOwner;
  state: PortState;
  pid: number | null;
  processName: string | null;
  cmdline: string | null;
  cwd: string | null;
  listenAddress: string | null;
  detail: string;
};

function normalizePath(value: string | null): string | null {
  if (!value) return null;
  return value.replace(/\/+$/, "");
}

export function isX200OwnedProcess(input: {
  pid: number | null;
  cmdline: string | null;
  cwd: string | null;
  environ: string | null;
  repoRoot: string | null;
  controlCenterMainPid: number | null;
}): boolean {
  if (input.pid == null || input.pid <= 0) return false;
  if (
    input.controlCenterMainPid != null &&
    input.controlCenterMainPid > 0 &&
    input.pid === input.controlCenterMainPid
  ) {
    return true;
  }
  if (input.environ?.includes(CONTROL_CENTER_ENV_MARKER)) {
    return true;
  }
  const repo = normalizePath(input.repoRoot);
  const cwd = normalizePath(input.cwd);
  const cmd = input.cmdline ?? "";
  const looksLikeNext =
    /\bnext(-server)?\b/i.test(cmd) ||
    /x200-control-center-serve\.mjs/.test(cmd) ||
    /node_modules\/\.bin\/next/.test(cmd);
  if (repo && cwd && cwd === repo && looksLikeNext) {
    return true;
  }
  if (repo && cmd.includes(repo) && looksLikeNext) {
    return true;
  }
  return false;
}

/**
 * Safe ownership detection. Never recommends killing unknown PIDs.
 */
export function classifyPortOwnership(input: PortProbeInput): PortProbeResult {
  const port = input.port ?? CONTROL_CENTER_PORT;
  if (!input.listening) {
    return {
      port,
      owner: "FREE",
      state: "FREE",
      pid: null,
      processName: null,
      cmdline: null,
      cwd: null,
      listenAddress: null,
      detail: `Port ${port} is free`,
    };
  }

  const owned = isX200OwnedProcess({
    pid: input.pid,
    cmdline: input.cmdline,
    cwd: input.cwd,
    environ: input.environ,
    repoRoot: input.repoRoot,
    controlCenterMainPid: input.controlCenterMainPid,
  });

  if (owned) {
    return {
      port,
      owner: "X200",
      state: "ALREADY_RUNNING",
      pid: input.pid,
      processName: input.processName,
      cmdline: input.cmdline,
      cwd: input.cwd,
      listenAddress: input.listenAddress,
      detail: "ALREADY_RUNNING — healthy X200 Control Center listener",
    };
  }

  return {
    port,
    owner: "UNKNOWN",
    state: "PORT_3001_CONFLICT",
    pid: input.pid,
    processName: input.processName,
    cmdline: input.cmdline,
    cwd: input.cwd,
    listenAddress: input.listenAddress,
    detail:
      "PORT_3001_CONFLICT — unknown process occupies port; do not kill; human action required",
  };
}

/** Explicit refusal helper for tests and callers. */
export function refuseUnknownProcessKill(state: PortState): {
  allowed: false;
  reason: string;
} {
  if (state === "PORT_3001_CONFLICT") {
    return {
      allowed: false,
      reason: "REFUSED — never kill unknown process on port 3001",
    };
  }
  return {
    allowed: false,
    reason: "REFUSED — arbitrary process kill is never permitted",
  };
}
