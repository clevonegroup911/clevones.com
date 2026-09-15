import "server-only";

import { appendFile, chmod, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { redactMonitoringText } from "@/lib/x200/activity";
import type {
  ControlActionId,
  ControlActionAuditEntry,
  ControlMode,
} from "@/lib/x200/types";

const AUDIT_REL = path.join(".x200", "control-actions.jsonl");

export function controlAuditPath(cwd = process.cwd()): string {
  return path.join(cwd, AUDIT_REL);
}

export function sanitizeAuditValue(value: unknown): unknown {
  if (typeof value === "string") {
    return redactMonitoringText(value, 400);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditValue(item));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const lower = key.toLowerCase();
      if (
        lower.includes("token") ||
        lower.includes("cookie") ||
        lower.includes("password") ||
        lower.includes("secret") ||
        lower === "auth_secret" ||
        lower === "database_url" ||
        lower.includes("mfa")
      ) {
        out[key] = "[REDACTED]";
        continue;
      }
      out[key] = sanitizeAuditValue(child);
    }
    return out;
  }
  return value;
}

export async function appendControlActionAudit(
  entry: Omit<ControlActionAuditEntry, "timestamp"> & { timestamp?: string },
  options: { cwd?: string } = {},
): Promise<ControlActionAuditEntry> {
  const cwd = options.cwd ?? process.cwd();
  const dir = path.join(cwd, ".x200");
  await mkdir(dir, { recursive: true, mode: 0o700 });

  const record: ControlActionAuditEntry = {
    timestamp: entry.timestamp ?? new Date().toISOString(),
    action: entry.action,
    actor: redactMonitoringText(entry.actor, 120),
    result: entry.result,
    durationMs: entry.durationMs,
    beforeState: entry.beforeState,
    afterState: entry.afterState,
    taskId: entry.taskId ?? null,
    code: entry.code ?? null,
    detail: entry.detail
      ? redactMonitoringText(entry.detail, 240)
      : null,
  };

  const line = `${JSON.stringify(sanitizeAuditValue(record))}\n`;
  const filePath = controlAuditPath(cwd);
  await appendFile(filePath, line, { encoding: "utf8", mode: 0o600 });
  try {
    await chmod(filePath, 0o600);
  } catch {
    // best-effort on platforms that ignore mode
  }
  return record;
}

export async function readRecentControlActions(
  limit = 20,
  options: { cwd?: string } = {},
): Promise<ControlActionAuditEntry[]> {
  const filePath = controlAuditPath(options.cwd ?? process.cwd());
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    return [];
  }
  if (!raw.trim()) return [];

  const lines = raw.split("\n").filter((line) => line.trim());
  const entries: ControlActionAuditEntry[] = [];
  for (const line of lines.slice(-Math.max(1, limit * 2))) {
    try {
      const parsed = JSON.parse(line) as ControlActionAuditEntry;
      if (
        parsed &&
        typeof parsed.timestamp === "string" &&
        typeof parsed.action === "string"
      ) {
        entries.push({
          timestamp: parsed.timestamp,
          action: parsed.action as ControlActionId,
          actor: typeof parsed.actor === "string" ? parsed.actor : "unknown",
          result: parsed.result === "SUCCESS" ? "SUCCESS" : "FAILED",
          durationMs:
            typeof parsed.durationMs === "number" ? parsed.durationMs : 0,
          beforeState: (parsed.beforeState as ControlMode) ?? "UNKNOWN",
          afterState: (parsed.afterState as ControlMode) ?? "UNKNOWN",
          taskId: typeof parsed.taskId === "string" ? parsed.taskId : null,
          code: typeof parsed.code === "string" ? parsed.code : null,
          detail: typeof parsed.detail === "string" ? parsed.detail : null,
        });
      }
    } catch {
      // skip corrupt lines
    }
  }
  return entries.slice(-limit).reverse();
}
