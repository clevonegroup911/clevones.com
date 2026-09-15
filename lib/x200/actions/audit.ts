import "server-only";

import { appendFile, chmod, mkdir, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { redactMonitoringText } from "@/lib/x200/activity";
import type { ActionReceipt, HumanActionType } from "@/lib/x200/actions/types";

const AUDIT_REL = path.join(".x200", "human-actions.jsonl");
const IDEMPOTENCY_REL = path.join(".x200", "human-action-idempotency.jsonl");

export function humanActionsAuditPath(cwd = process.cwd()): string {
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
        lower.includes("mfa") ||
        lower.includes("totp") ||
        lower === "code"
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

export async function appendHumanActionAudit(
  receipt: Omit<ActionReceipt, "auditId"> & { auditId?: string },
  options: { cwd?: string } = {},
): Promise<ActionReceipt> {
  const cwd = options.cwd ?? process.cwd();
  await mkdir(path.join(cwd, ".x200"), { recursive: true, mode: 0o700 });
  const full: ActionReceipt = {
    ...receipt,
    auditId: receipt.auditId ?? randomUUID(),
    actor: redactMonitoringText(receipt.actor, 120),
    message: redactMonitoringText(receipt.message, 400),
    before: sanitizeAuditValue(receipt.before) as Record<string, unknown>,
    after: sanitizeAuditValue(receipt.after) as Record<string, unknown>,
  };
  const filePath = humanActionsAuditPath(cwd);
  await appendFile(filePath, `${JSON.stringify(sanitizeAuditValue(full))}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  try {
    await chmod(filePath, 0o600);
  } catch {
    // best-effort
  }
  return full;
}

export async function readRecentReceipts(
  limit = 30,
  options: { cwd?: string } = {},
): Promise<ActionReceipt[]> {
  const filePath = humanActionsAuditPath(options.cwd ?? process.cwd());
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    return [];
  }
  if (!raw.trim()) return [];
  const entries: ActionReceipt[] = [];
  for (const line of raw.split("\n").filter(Boolean).slice(-Math.max(1, limit * 2))) {
    try {
      const parsed = JSON.parse(line) as ActionReceipt;
      if (parsed?.actionId && parsed?.action) entries.push(parsed);
    } catch {
      // skip
    }
  }
  return entries.slice(-limit).reverse();
}

type IdempotencyRecord = {
  idempotencyKey: string;
  actionId: string;
  action: HumanActionType;
  result: ActionReceipt["result"];
  finishedAt: string;
};

export async function findIdempotencyHit(
  idempotencyKey: string,
  options: { cwd?: string } = {},
): Promise<IdempotencyRecord | null> {
  const filePath = path.join(options.cwd ?? process.cwd(), IDEMPOTENCY_REL);
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    return null;
  }
  for (const line of raw.split("\n").reverse()) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line) as IdempotencyRecord;
      if (parsed.idempotencyKey === idempotencyKey) return parsed;
    } catch {
      // skip
    }
  }
  return null;
}

export async function recordIdempotency(
  record: IdempotencyRecord,
  options: { cwd?: string } = {},
): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  await mkdir(path.join(cwd, ".x200"), { recursive: true, mode: 0o700 });
  const filePath = path.join(cwd, IDEMPOTENCY_REL);
  await appendFile(filePath, `${JSON.stringify(record)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  try {
    await chmod(filePath, 0o600);
  } catch {
    // best-effort
  }
}
