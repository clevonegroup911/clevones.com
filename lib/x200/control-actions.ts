import "server-only";

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";

import { redactMonitoringText } from "@/lib/x200/activity";
import {
  appendControlActionAudit,
  readRecentControlActions,
} from "@/lib/x200/control-audit";
import type {
  ControlActionAuditEntry,
  ControlActionCode,
  ControlActionId,
  ControlMode,
  ControlPlaneSnapshot,
  AutopilotLiveState,
  GitSnapshot,
  HumanGateSnapshot,
  ControlCenterTask,
} from "@/lib/x200/types";

const execFileAsync = promisify(execFile);

export const CONTROL_ACTION_IDS = [
  "AUTOPILOT_START",
  "AUTOPILOT_STOP",
  "AUTOPILOT_RESTART",
  "RUN_ONE_CYCLE",
] as const satisfies readonly ControlActionId[];

/** Strict body — only `action` enum. Arbitrary command/args/shell rejected by Zod. */
export const controlActionRequestSchema = z
  .object({
    action: z.enum(CONTROL_ACTION_IDS),
  })
  .strict();

export type ControlActionRequest = z.infer<typeof controlActionRequestSchema>;

const SYSTEMCTL_UNIT = "clevones-x200-autopilot.service";
const DEFAULT_TIMEOUT_MS = 45_000;
const MAX_OUTPUT = 1_200;

export type FixedExecRequest = {
  file: string;
  args: readonly string[];
  cwd: string;
  timeoutMs: number;
};

export type FixedExecResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
};

export type ControlExecutor = {
  execFixed: (req: FixedExecRequest) => Promise<FixedExecResult>;
  isLocalExecutorAvailable: () => boolean | Promise<boolean>;
};

export type ControlActionContext = {
  actorId: string;
  actorEmail: string;
  actorRole: "SUPER_ADMIN" | "ADMIN";
  git: Pick<GitSnapshot, "dirty" | "status">;
  humanGate: Pick<HumanGateSnapshot, "present">;
  fedora: Pick<AutopilotLiveState, "agentRunning" | "autopilotLiveState" | "taskId">;
  currentTask: ControlCenterTask | null;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  executor?: ControlExecutor;
  nowMs?: number;
};

export type ControlActionOutcome = {
  ok: boolean;
  status: number;
  code: ControlActionCode;
  message: string;
  action: ControlActionId;
  durationMs: number;
  beforeState: ControlMode;
  afterState: ControlMode;
  sanitizedOutput: string | null;
  audit: ControlActionAuditEntry | null;
};

function envFlagTrue(env: NodeJS.ProcessEnv, key: string): boolean {
  const raw = env[key]?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

export function isControlActionsEnvEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return envFlagTrue(env, "X200_CONTROL_ACTIONS_ENABLED");
}

/**
 * Local Fedora-compatible executor: non-production Node runtime and
 * X200_CONTROL_ACTIONS_ENABLED=true. Never assumes remote production systemd.
 */
export function detectLocalExecutorAvailable(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!isControlActionsEnvEnabled(env)) return false;
  if (env.NODE_ENV === "production" && env.X200_ALLOW_PROD_CONTROL !== "true") {
    return false;
  }
  if (env.VERCEL === "1" || env.X200_FORCE_EXECUTOR_UNAVAILABLE === "true") {
    return false;
  }
  return true;
}

export function deriveControlMode(input: {
  actionsEnabled: boolean;
  localExecutorAvailable: boolean;
  humanGatePresent: boolean;
  agentRunning: boolean | null;
  autopilotLiveState: AutopilotLiveState["autopilotLiveState"] | null;
}): ControlMode {
  if (input.humanGatePresent) return "HUMAN_GATE";
  if (!input.actionsEnabled) return "READ_ONLY";
  if (!input.localExecutorAvailable) return "UNAVAILABLE";
  if (
    input.agentRunning === true ||
    input.autopilotLiveState === "RUNNING" ||
    input.autopilotLiveState === "AUTOPLAN"
  ) {
    return "ACTION_RUNNING";
  }
  return "LOCAL_CONTROL_READY";
}

export function buildControlPlaneSnapshot(input: {
  actorRole: "SUPER_ADMIN" | "ADMIN" | "UNKNOWN";
  humanGatePresent: boolean;
  agentRunning: boolean | null;
  autopilotLiveState: AutopilotLiveState["autopilotLiveState"] | null;
  gitDirty: boolean | null;
  recentActions: ControlActionAuditEntry[];
  env?: NodeJS.ProcessEnv;
}): ControlPlaneSnapshot {
  const env = input.env ?? process.env;
  const actionsEnabled = isControlActionsEnvEnabled(env);
  const localExecutorAvailable = detectLocalExecutorAvailable(env);
  const mode = deriveControlMode({
    actionsEnabled,
    localExecutorAvailable,
    humanGatePresent: input.humanGatePresent,
    agentRunning: input.agentRunning,
    autopilotLiveState: input.autopilotLiveState,
  });
  const canMutate =
    input.actorRole === "SUPER_ADMIN" &&
    actionsEnabled &&
    localExecutorAvailable &&
    mode !== "HUMAN_GATE";

  const disabledReasons: ControlPlaneSnapshot["disabledReasons"] = {
    MERGE: "Human approval required",
    DEPLOY: "Human approval required",
  };

  const baseDisable = (action: ControlActionId): string | null => {
    if (input.actorRole !== "SUPER_ADMIN") {
      return "SUPER_ADMIN required";
    }
    if (!actionsEnabled) return "CONTROL_DISABLED — set X200_CONTROL_ACTIONS_ENABLED=true locally";
    if (!localExecutorAvailable) return "LOCAL_EXECUTOR_UNAVAILABLE";
    if (input.humanGatePresent) return "HUMAN_GATE_REQUIRED";
    if (
      (action === "AUTOPILOT_STOP" || action === "AUTOPILOT_RESTART") &&
      input.agentRunning === true
    ) {
      return "AGENT_BUSY — refuse stop/restart while Cursor agent is running";
    }
    if (action === "RUN_ONE_CYCLE") {
      if (input.gitDirty === true) return "WORKTREE_DIRTY";
      if (input.agentRunning === true) return "AGENT_BUSY";
      if (
        input.autopilotLiveState === "RUNNING" ||
        input.autopilotLiveState === "AUTOPLAN"
      ) {
        return "AGENT_BUSY — AUTOPILOT daemon occupied";
      }
    }
    return null;
  };

  for (const action of CONTROL_ACTION_IDS) {
    const reason = baseDisable(action);
    if (reason) disabledReasons[action] = reason;
  }

  return {
    mode,
    actionsEnabled,
    localExecutorAvailable,
    actorRole: input.actorRole,
    canMutate,
    disabledReasons,
    recentActions: input.recentActions,
  };
}

export function createDefaultExecutor(
  env: NodeJS.ProcessEnv = process.env,
): ControlExecutor {
  return {
    isLocalExecutorAvailable: () => detectLocalExecutorAvailable(env),
    execFixed: async (req) => {
      try {
        const { stdout, stderr } = await execFileAsync(req.file, [...req.args], {
          cwd: req.cwd,
          timeout: req.timeoutMs,
          maxBuffer: 512 * 1024,
          env: {
            ...env,
            // Never inherit shell expansion knobs for fixed argv.
          },
          shell: false,
        });
        return {
          exitCode: 0,
          stdout: String(stdout ?? ""),
          stderr: String(stderr ?? ""),
          timedOut: false,
        };
      } catch (error) {
        const err = error as {
          code?: string;
          killed?: boolean;
          signal?: string;
          stdout?: string;
          stderr?: string;
          status?: number | null;
          message?: string;
        };
        const timedOut =
          err.killed === true ||
          err.signal === "SIGTERM" ||
          err.code === "ETIMEDOUT";
        return {
          exitCode: typeof err.status === "number" ? err.status : 1,
          stdout: String(err.stdout ?? ""),
          stderr: String(err.stderr ?? err.message ?? "exec failed"),
          timedOut,
        };
      }
    },
  };
}

/** Fixed argv map — browser never supplies command/args. */
export function fixedCommandForAction(
  action: ControlActionId,
  cwd: string,
): FixedExecRequest {
  switch (action) {
    case "AUTOPILOT_START":
      return {
        file: "systemctl",
        args: ["--user", "start", SYSTEMCTL_UNIT],
        cwd,
        timeoutMs: DEFAULT_TIMEOUT_MS,
      };
    case "AUTOPILOT_STOP":
      return {
        file: "systemctl",
        args: ["--user", "stop", SYSTEMCTL_UNIT],
        cwd,
        timeoutMs: DEFAULT_TIMEOUT_MS,
      };
    case "AUTOPILOT_RESTART":
      return {
        file: "systemctl",
        args: ["--user", "restart", SYSTEMCTL_UNIT],
        cwd,
        timeoutMs: DEFAULT_TIMEOUT_MS,
      };
    case "RUN_ONE_CYCLE":
      return {
        file: process.execPath,
        args: ["scripts/x200-autopilot.mjs", "--once"],
        cwd,
        timeoutMs: 120_000,
      };
    default: {
      const _exhaustive: never = action;
      throw new Error(`Unsupported action: ${_exhaustive}`);
    }
  }
}

export function sanitizeExecOutput(stdout: string, stderr: string): string {
  const merged = [stdout, stderr].filter(Boolean).join("\n---\n");
  return redactMonitoringText(merged, MAX_OUTPUT);
}

export function preflightControlAction(
  action: ControlActionId,
  ctx: ControlActionContext,
): { ok: true } | { ok: false; code: ControlActionCode; message: string; status: number } {
  if (ctx.actorRole !== "SUPER_ADMIN") {
    return {
      ok: false,
      code: "ACTION_NOT_ALLOWED",
      message: "Seuls les SUPER_ADMIN peuvent exécuter des actions de contrôle.",
      status: 403,
    };
  }

  const env = ctx.env ?? process.env;
  if (!isControlActionsEnvEnabled(env)) {
    return {
      ok: false,
      code: "CONTROL_DISABLED",
      message: "X200_CONTROL_ACTIONS_ENABLED n'est pas activé.",
      status: 403,
    };
  }

  if (!detectLocalExecutorAvailable(env)) {
    return {
      ok: false,
      code: "LOCAL_EXECUTOR_UNAVAILABLE",
      message: "Exécuteur local indisponible (production distante ou environnement non compatible).",
      status: 503,
    };
  }

  if (ctx.humanGate.present) {
    return {
      ok: false,
      code: "HUMAN_GATE_REQUIRED",
      message: "Human Gate actif — aucune action automatique.",
      status: 409,
    };
  }

  if (
    (action === "AUTOPILOT_STOP" || action === "AUTOPILOT_RESTART") &&
    ctx.fedora.agentRunning === true
  ) {
    return {
      ok: false,
      code: "AGENT_BUSY",
      message: "Agent Cursor actif — STOP/RESTART refusés (pas de FORCE STOP).",
      status: 409,
    };
  }

  if (action === "RUN_ONE_CYCLE") {
    if (ctx.git.dirty === true) {
      return {
        ok: false,
        code: "WORKTREE_DIRTY",
        message: "Worktree dirty — RUN_ONE_CYCLE refusé.",
        status: 409,
      };
    }
    if (ctx.fedora.agentRunning === true) {
      return {
        ok: false,
        code: "AGENT_BUSY",
        message: "Agent déjà en cours.",
        status: 409,
      };
    }
    if (
      ctx.fedora.autopilotLiveState === "RUNNING" ||
      ctx.fedora.autopilotLiveState === "AUTOPLAN"
    ) {
      return {
        ok: false,
        code: "AGENT_BUSY",
        message: "AUTOPILOT daemon déjà occupé.",
        status: 409,
      };
    }
    if (ctx.currentTask?.requiresHuman === true) {
      return {
        ok: false,
        code: "HUMAN_GATE_REQUIRED",
        message: "Tâche courante requiresHuman — cycle refusé.",
        status: 409,
      };
    }
  }

  return { ok: true };
}

export async function executeControlAction(
  action: ControlActionId,
  ctx: ControlActionContext,
): Promise<ControlActionOutcome> {
  const started = ctx.nowMs ?? Date.now();
  const env = ctx.env ?? process.env;
  const cwd = ctx.cwd ?? process.cwd();
  const executor = ctx.executor ?? createDefaultExecutor(env);

  const beforeState = deriveControlMode({
    actionsEnabled: isControlActionsEnvEnabled(env),
    localExecutorAvailable: await Promise.resolve(
      executor.isLocalExecutorAvailable(),
    ),
    humanGatePresent: ctx.humanGate.present,
    agentRunning: ctx.fedora.agentRunning,
    autopilotLiveState: ctx.fedora.autopilotLiveState,
  });

  const gate = preflightControlAction(action, ctx);
  if (!gate.ok) {
    const durationMs = Math.max(0, Date.now() - started);
    const audit = await appendControlActionAudit({
      action,
      actor: `${ctx.actorRole}:${ctx.actorEmail}`,
      result: "FAILED",
      durationMs,
      beforeState,
      afterState: beforeState,
      taskId: ctx.fedora.taskId ?? ctx.currentTask?.id ?? null,
      code: gate.code,
      detail: gate.message,
    }, { cwd });
    return {
      ok: false,
      status: gate.status,
      code: gate.code,
      message: gate.message,
      action,
      durationMs,
      beforeState,
      afterState: beforeState,
      sanitizedOutput: null,
      audit,
    };
  }

  const available = await Promise.resolve(executor.isLocalExecutorAvailable());
  if (!available) {
    const durationMs = Math.max(0, Date.now() - started);
    const audit = await appendControlActionAudit({
      action,
      actor: `${ctx.actorRole}:${ctx.actorEmail}`,
      result: "FAILED",
      durationMs,
      beforeState,
      afterState: "UNAVAILABLE",
      taskId: ctx.fedora.taskId ?? ctx.currentTask?.id ?? null,
      code: "LOCAL_EXECUTOR_UNAVAILABLE",
      detail: "Executor reported unavailable",
    }, { cwd });
    return {
      ok: false,
      status: 503,
      code: "LOCAL_EXECUTOR_UNAVAILABLE",
      message: "Exécuteur local indisponible.",
      action,
      durationMs,
      beforeState,
      afterState: "UNAVAILABLE",
      sanitizedOutput: null,
      audit,
    };
  }

  const cmd = fixedCommandForAction(action, cwd);
  const result = await executor.execFixed(cmd);
  const durationMs = Math.max(0, Date.now() - started);
  const sanitizedOutput = sanitizeExecOutput(result.stdout, result.stderr);

  if (result.timedOut) {
    const afterState: ControlMode = "ACTION_RUNNING";
    const audit = await appendControlActionAudit({
      action,
      actor: `${ctx.actorRole}:${ctx.actorEmail}`,
      result: "FAILED",
      durationMs,
      beforeState,
      afterState,
      taskId: ctx.fedora.taskId ?? ctx.currentTask?.id ?? null,
      code: "TIMEOUT",
      detail: "Command timed out",
    }, { cwd });
    return {
      ok: false,
      status: 504,
      code: "TIMEOUT",
      message: "Délai d'exécution dépassé.",
      action,
      durationMs,
      beforeState,
      afterState,
      sanitizedOutput,
      audit,
    };
  }

  if (result.exitCode !== 0) {
    const afterState = beforeState;
    const audit = await appendControlActionAudit({
      action,
      actor: `${ctx.actorRole}:${ctx.actorEmail}`,
      result: "FAILED",
      durationMs,
      beforeState,
      afterState,
      taskId: ctx.fedora.taskId ?? ctx.currentTask?.id ?? null,
      code: "EXEC_FAILED",
      detail: `exit=${result.exitCode}`,
    }, { cwd });
    return {
      ok: false,
      status: 500,
      code: "EXEC_FAILED",
      message: "Échec d'exécution de la commande fixe.",
      action,
      durationMs,
      beforeState,
      afterState,
      sanitizedOutput,
      audit,
    };
  }

  const afterState: ControlMode =
    action === "AUTOPILOT_STOP" ? "LOCAL_CONTROL_READY" : "ACTION_RUNNING";
  const audit = await appendControlActionAudit({
    action,
    actor: `${ctx.actorRole}:${ctx.actorEmail}`,
    result: "SUCCESS",
    durationMs,
    beforeState,
    afterState,
    taskId: ctx.fedora.taskId ?? ctx.currentTask?.id ?? null,
    code: "OK",
    detail: "ok",
  }, { cwd });

  return {
    ok: true,
    status: 200,
    code: "OK",
    message: "Action exécutée.",
    action,
    durationMs,
    beforeState,
    afterState,
    sanitizedOutput,
    audit,
  };
}

export { readRecentControlActions };
