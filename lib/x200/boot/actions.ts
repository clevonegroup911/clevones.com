import "server-only";

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";

import {
  AUTOPILOT_UNIT,
  CONTROL_CENTER_UNIT,
  DB_CONTAINER_NAME,
  DB_RESTART_POLICY_TARGET,
} from "@/lib/x200/boot/constants";
import { BOOT_ACTION_IDS, type BootActionId } from "@/lib/x200/boot/types";
import { assertAllowlistedUnit, systemctlUserControlArgs } from "@/lib/x200/boot/units";
import { appendControlActionAudit } from "@/lib/x200/control-audit";
import { redactMonitoringText } from "@/lib/x200/activity";
import type { ControlMode } from "@/lib/x200/types";

const execFileAsync = promisify(execFile);

export const bootActionRequestSchema = z
  .object({
    action: z.enum(BOOT_ACTION_IDS),
    confirmDisable: z.boolean().optional(),
  })
  .strict();

export type BootActionRequest = z.infer<typeof bootActionRequestSchema>;

export type BootFixedExec = {
  file: string;
  args: readonly string[];
  cwd: string;
  timeoutMs: number;
};

export type BootActionOutcome = {
  ok: boolean;
  status: number;
  code: string;
  message: string;
  action: BootActionId;
  sanitizedOutput: string | null;
};

const CLIENT_ONLY = new Set<BootActionId>([
  "REFRESH_STARTUP_STATUS",
  "OPEN_CONTROL_CENTER",
  "COPY_DIAGNOSTICS",
]);

export function isClientOnlyBootAction(action: BootActionId): boolean {
  return CLIENT_ONLY.has(action);
}

/** Fixed argv map — browser never supplies unit names or shell. */
export function fixedCommandForBootAction(
  action: BootActionId,
  cwd: string,
): BootFixedExec | null {
  switch (action) {
    case "START_CONTROL_CENTER":
      return {
        file: "systemctl",
        args: systemctlUserControlArgs("start", CONTROL_CENTER_UNIT),
        cwd,
        timeoutMs: 45_000,
      };
    case "RESTART_CONTROL_CENTER":
      return {
        file: "systemctl",
        args: systemctlUserControlArgs("restart", CONTROL_CENTER_UNIT),
        cwd,
        timeoutMs: 45_000,
      };
    case "START_AUTOPILOT":
      return {
        file: "systemctl",
        args: systemctlUserControlArgs("start", AUTOPILOT_UNIT),
        cwd,
        timeoutMs: 45_000,
      };
    case "RESTART_AUTOPILOT":
      return {
        file: "systemctl",
        args: systemctlUserControlArgs("restart", AUTOPILOT_UNIT),
        cwd,
        timeoutMs: 45_000,
      };
    case "START_DATABASE":
      return {
        file: "docker",
        args: ["start", DB_CONTAINER_NAME],
        cwd,
        timeoutMs: 60_000,
      };
    case "ENABLE_AUTOSTART":
      return {
        file: process.execPath,
        args: ["scripts/x200-autostart.mjs", "install"],
        cwd,
        timeoutMs: 120_000,
      };
    case "DISABLE_AUTOSTART":
      return {
        file: process.execPath,
        args: ["scripts/x200-autostart.mjs", "disable"],
        cwd,
        timeoutMs: 60_000,
      };
    case "REFRESH_STARTUP_STATUS":
    case "OPEN_CONTROL_CENTER":
    case "COPY_DIAGNOSTICS":
      return null;
    default: {
      const _exhaustive: never = action;
      throw new Error(`Unsupported boot action: ${_exhaustive}`);
    }
  }
}

export function ensureDbRestartPolicyArgs(): {
  file: string;
  args: readonly string[];
} {
  return {
    file: "docker",
    args: [
      "update",
      `--restart=${DB_RESTART_POLICY_TARGET}`,
      DB_CONTAINER_NAME,
    ],
  };
}

export function preflightBootAction(
  action: BootActionId,
  ctx: {
    actorRole: "SUPER_ADMIN" | "ADMIN" | "UNKNOWN";
    confirmDisable?: boolean;
    controlActionsEnabled: boolean;
  },
): { ok: true } | { ok: false; code: string; message: string; status: number } {
  if (ctx.actorRole !== "SUPER_ADMIN") {
    return {
      ok: false,
      code: "ACTION_NOT_ALLOWED",
      message: "SUPER_ADMIN required for boot actions",
      status: 403,
    };
  }
  if (!ctx.controlActionsEnabled && !isClientOnlyBootAction(action)) {
    return {
      ok: false,
      code: "CONTROL_DISABLED",
      message: "X200_CONTROL_ACTIONS_ENABLED is not set",
      status: 403,
    };
  }
  if (action === "DISABLE_AUTOSTART" && ctx.confirmDisable !== true) {
    return {
      ok: false,
      code: "CONFIRMATION_REQUIRED",
      message: "DISABLE_AUTOSTART requires explicit confirmDisable=true",
      status: 409,
    };
  }
  // Touch allowlist path to keep unit assertion covered for control actions.
  assertAllowlistedUnit(CONTROL_CENTER_UNIT);
  assertAllowlistedUnit(AUTOPILOT_UNIT);
  return { ok: true };
}

export async function executeBootAction(
  action: BootActionId,
  ctx: {
    actorId: string;
    actorEmail: string;
    actorRole: "SUPER_ADMIN" | "ADMIN" | "UNKNOWN";
    confirmDisable?: boolean;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    controlMode?: ControlMode;
  },
): Promise<BootActionOutcome> {
  const cwd = ctx.cwd ?? process.cwd();
  const env = ctx.env ?? process.env;
  const enabled =
    env.X200_CONTROL_ACTIONS_ENABLED === "true" ||
    env.X200_CONTROL_ACTIONS_ENABLED === "1";

  const gate = preflightBootAction(action, {
    actorRole: ctx.actorRole,
    confirmDisable: ctx.confirmDisable,
    controlActionsEnabled: enabled,
  });
  if (!gate.ok) {
    await appendControlActionAudit(
      {
        action: "AUTOPILOT_START",
        actor: `${ctx.actorRole}:${ctx.actorEmail}`,
        result: "FAILED",
        durationMs: 0,
        beforeState: ctx.controlMode ?? "READ_ONLY",
        afterState: ctx.controlMode ?? "READ_ONLY",
        taskId: "T048",
        code: gate.code,
        detail: `boot:${action} ${gate.message}`,
      },
      { cwd },
    );
    return {
      ok: false,
      status: gate.status,
      code: gate.code,
      message: gate.message,
      action,
      sanitizedOutput: null,
    };
  }

  if (isClientOnlyBootAction(action)) {
    return {
      ok: true,
      status: 200,
      code: "OK",
      message: `Client-side action ${action}`,
      action,
      sanitizedOutput: null,
    };
  }

  const cmd = fixedCommandForBootAction(action, cwd);
  if (!cmd) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_ACTION",
      message: "No fixed command for action",
      action,
      sanitizedOutput: null,
    };
  }

  const started = Date.now();
  try {
    const { stdout, stderr } = await execFileAsync(cmd.file, [...cmd.args], {
      cwd: cmd.cwd,
      timeout: cmd.timeoutMs,
      maxBuffer: 512 * 1024,
      env: { ...process.env, ...env },
      shell: false,
    });
    const durationMs = Date.now() - started;
    const sanitized = redactMonitoringText(
      [stdout, stderr].filter(Boolean).join("\n"),
      1_200,
    );
    await appendControlActionAudit(
      {
        action: "AUTOPILOT_START",
        actor: `${ctx.actorRole}:${ctx.actorEmail}`,
        result: "SUCCESS",
        durationMs,
        beforeState: ctx.controlMode ?? "LOCAL_CONTROL_READY",
        afterState: ctx.controlMode ?? "LOCAL_CONTROL_READY",
        taskId: "T048",
        code: "OK",
        detail: `boot:${action}`,
      },
      { cwd },
    );
    return {
      ok: true,
      status: 200,
      code: "OK",
      message: `${action} executed`,
      action,
      sanitizedOutput: sanitized,
    };
  } catch (error) {
    const durationMs = Date.now() - started;
    const message =
      error instanceof Error ? error.message.slice(0, 200) : "exec failed";
    await appendControlActionAudit(
      {
        action: "AUTOPILOT_START",
        actor: `${ctx.actorRole}:${ctx.actorEmail}`,
        result: "FAILED",
        durationMs,
        beforeState: ctx.controlMode ?? "LOCAL_CONTROL_READY",
        afterState: ctx.controlMode ?? "LOCAL_CONTROL_READY",
        taskId: "T048",
        code: "EXEC_FAILED",
        detail: `boot:${action} ${message}`,
      },
      { cwd },
    );
    return {
      ok: false,
      status: 500,
      code: "EXEC_FAILED",
      message,
      action,
      sanitizedOutput: null,
    };
  }
}
