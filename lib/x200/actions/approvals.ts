import "server-only";

import { appendFile, chmod, mkdir, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { redactMonitoringText } from "@/lib/x200/activity";
import type {
  ApprovalRecord,
  HumanActionEnvironment,
  HumanActionType,
} from "@/lib/x200/actions/types";

const APPROVALS_REL = path.join(".x200", "human-approvals.jsonl");
const DEFAULT_TTL_MS = 10 * 60 * 1000;

export function humanApprovalsPath(cwd = process.cwd()): string {
  return path.join(cwd, APPROVALS_REL);
}

export type IssueApprovalInput = {
  actorId: string;
  actorEmail: string;
  gateType: string;
  taskId: string | null;
  action: HumanActionType;
  reason: string;
  expectedSha: string | null;
  environment: HumanActionEnvironment;
  ttlMs?: number;
  nowMs?: number;
};

export async function issueApproval(
  input: IssueApprovalInput,
  options: { cwd?: string } = {},
): Promise<ApprovalRecord> {
  const now = input.nowMs ?? Date.now();
  const ttl = input.ttlMs ?? DEFAULT_TTL_MS;
  const record: ApprovalRecord = {
    approvalId: randomUUID(),
    timestamp: new Date(now).toISOString(),
    actorId: input.actorId,
    actorEmail: redactMonitoringText(input.actorEmail, 120),
    gateType: input.gateType,
    taskId: input.taskId,
    action: input.action,
    reason: redactMonitoringText(input.reason, 400),
    expectedSha: input.expectedSha,
    environment: input.environment,
    expiresAt: new Date(now + ttl).toISOString(),
    consumedAt: null,
    result: "ISSUED",
  };
  await appendApproval(record, options);
  return record;
}

export type ConsumeApprovalInput = {
  approvalId: string;
  action: HumanActionType;
  expectedSha: string | null;
  environment: HumanActionEnvironment;
  taskId?: string | null;
  nowMs?: number;
};

export type ConsumeApprovalResult =
  | { ok: true; approval: ApprovalRecord }
  | {
      ok: false;
      code: "APPROVAL_NOT_FOUND" | "APPROVAL_EXPIRED" | "APPROVAL_CONSUMED" | "STALE_APPROVAL" | "APPROVAL_MISMATCH";
      message: string;
      approval: ApprovalRecord | null;
    };

/**
 * Consume a single-use approval. SHA mismatch → STALE_APPROVAL (must re-approve).
 */
export async function consumeApproval(
  input: ConsumeApprovalInput,
  options: { cwd?: string } = {},
): Promise<ConsumeApprovalResult> {
  const approvals = await readApprovals(options);
  const found = approvals.find((a) => a.approvalId === input.approvalId);
  if (!found) {
    return {
      ok: false,
      code: "APPROVAL_NOT_FOUND",
      message: "Approval introuvable.",
      approval: null,
    };
  }
  if (found.consumedAt || found.result === "CONSUMED") {
    return {
      ok: false,
      code: "APPROVAL_CONSUMED",
      message: "Approval déjà consommée (non réutilisable).",
      approval: found,
    };
  }
  const now = input.nowMs ?? Date.now();
  if (Date.parse(found.expiresAt) <= now || found.result === "EXPIRED") {
    const expired: ApprovalRecord = { ...found, result: "EXPIRED" };
    await appendApproval(expired, options);
    return {
      ok: false,
      code: "APPROVAL_EXPIRED",
      message: "Approval expirée — nouvelle approbation requise.",
      approval: expired,
    };
  }
  if (found.action !== input.action || found.environment !== input.environment) {
    return {
      ok: false,
      code: "APPROVAL_MISMATCH",
      message: "Approval non liée à cette action/environnement.",
      approval: found,
    };
  }
  if (
    input.taskId != null &&
    found.taskId != null &&
    input.taskId !== found.taskId
  ) {
    return {
      ok: false,
      code: "APPROVAL_MISMATCH",
      message: "Approval non liée à cette tâche.",
      approval: found,
    };
  }
  if (
    found.expectedSha &&
    input.expectedSha &&
    found.expectedSha !== input.expectedSha
  ) {
    const stale: ApprovalRecord = { ...found, result: "STALE" };
    await appendApproval(stale, options);
    return {
      ok: false,
      code: "STALE_APPROVAL",
      message: `STALE_APPROVAL — EXPECTED_SHA=${found.expectedSha} CURRENT_SHA=${input.expectedSha}`,
      approval: stale,
    };
  }

  const consumed: ApprovalRecord = {
    ...found,
    consumedAt: new Date(now).toISOString(),
    result: "CONSUMED",
  };
  await appendApproval(consumed, options);
  return { ok: true, approval: consumed };
}

export async function readApprovals(
  options: { cwd?: string } = {},
): Promise<ApprovalRecord[]> {
  const filePath = humanApprovalsPath(options.cwd ?? process.cwd());
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    return [];
  }
  if (!raw.trim()) return [];
  const byId = new Map<string, ApprovalRecord>();
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line) as ApprovalRecord;
      if (parsed && typeof parsed.approvalId === "string") {
        byId.set(parsed.approvalId, parsed);
      }
    } catch {
      // skip
    }
  }
  return Array.from(byId.values());
}

async function appendApproval(
  record: ApprovalRecord,
  options: { cwd?: string },
): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const dir = path.join(cwd, ".x200");
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const filePath = humanApprovalsPath(cwd);
  const line = `${JSON.stringify(sanitizeApproval(record))}\n`;
  await appendFile(filePath, line, { encoding: "utf8", mode: 0o600 });
  try {
    await chmod(filePath, 0o600);
  } catch {
    // best-effort
  }
}

function sanitizeApproval(record: ApprovalRecord): ApprovalRecord {
  return {
    ...record,
    actorEmail: redactMonitoringText(record.actorEmail, 120),
    reason: redactMonitoringText(record.reason, 400),
  };
}
