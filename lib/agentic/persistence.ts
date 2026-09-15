import { appendFile, mkdir, readFile, chmod } from "node:fs/promises";
import path from "node:path";

import type { AgentAuditRecord } from "@/lib/agentic/audit";
import type { BusinessApprovalRecord } from "@/lib/agentic/approvals";
import type { DomainEventEnvelope } from "@/lib/agentic/events";
import type { AgenticOrchestrationRow } from "@/lib/agentic/observability";
import { sanitizeAuditValue } from "@/lib/x200/actions/audit";

const EVENTS_REL = path.join(".x200", "agentic-events.jsonl");
const APPROVALS_REL = path.join(".x200", "agentic-approvals.jsonl");
const AUDITS_REL = path.join(".x200", "agentic-audits.jsonl");
const ORCH_REL = path.join(".x200", "agentic-orchestrations.jsonl");

export function agenticEventsPath(cwd = process.cwd()): string {
  return path.join(cwd, EVENTS_REL);
}
export function agenticApprovalsPath(cwd = process.cwd()): string {
  return path.join(cwd, APPROVALS_REL);
}
export function agenticAuditsPath(cwd = process.cwd()): string {
  return path.join(cwd, AUDITS_REL);
}
export function agenticOrchestrationsPath(cwd = process.cwd()): string {
  return path.join(cwd, ORCH_REL);
}

async function ensureDir(cwd: string): Promise<void> {
  await mkdir(path.join(cwd, ".x200"), { recursive: true, mode: 0o700 });
}

async function appendJsonl(filePath: string, row: unknown, cwd: string): Promise<void> {
  await ensureDir(cwd);
  const safe = sanitizeAuditValue(row);
  await appendFile(filePath, `${JSON.stringify(safe)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  try {
    await chmod(filePath, 0o600);
  } catch {
    // best-effort
  }
}

async function readJsonl<T>(filePath: string, limit: number): Promise<T[]> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    return [];
  }
  if (!raw.trim()) return [];
  const lines = raw.split("\n").filter(Boolean);
  const sliced = lines.slice(-Math.max(1, limit));
  const out: T[] = [];
  for (const line of sliced) {
    try {
      out.push(JSON.parse(line) as T);
    } catch {
      // skip corrupt
    }
  }
  return out;
}

export type PersistedApprovalRow = {
  approvalDigest: string;
  agentId: string;
  tool: BusinessApprovalRecord["tool"];
  reason: string;
  issuedAt: string;
  expiresAt: string;
  consumedAt: string | null;
  issuerId: string;
};

/** Persist domain event without elevating payload to policy. */
export async function appendAgenticEvent(
  event: DomainEventEnvelope,
  options: { cwd?: string } = {},
): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  await appendJsonl(agenticEventsPath(cwd), event, cwd);
}

/** Persist approval with raw token stripped — digest only (no token* keys). */
export async function appendAgenticApproval(
  approval: BusinessApprovalRecord,
  options: { cwd?: string } = {},
): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const row: PersistedApprovalRow = {
    approvalDigest: approval.tokenDigest,
    agentId: approval.agentId,
    tool: approval.tool,
    reason: approval.reason
      .replace(/(api[_-]?key|token|secret|password)\s*[:=]\s*\S+/gi, "$1=[REDACTED]")
      .slice(0, 400),
    issuedAt: approval.issuedAt,
    expiresAt: approval.expiresAt,
    consumedAt: approval.consumedAt,
    issuerId: approval.issuerId,
  };
  await appendJsonl(agenticApprovalsPath(cwd), row, cwd);
}

export async function appendAgenticAudit(
  audit: AgentAuditRecord,
  options: { cwd?: string } = {},
): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  await appendJsonl(agenticAuditsPath(cwd), audit, cwd);
}

export async function appendAgenticOrchestration(
  row: AgenticOrchestrationRow,
  options: { cwd?: string } = {},
): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  await appendJsonl(
    agenticOrchestrationsPath(cwd),
    { ...row, moneyMoved: false as const },
    cwd,
  );
}

export type AgenticJournalSnapshot = {
  events: DomainEventEnvelope[];
  approvals: PersistedApprovalRow[];
  audits: AgentAuditRecord[];
  orchestrations: AgenticOrchestrationRow[];
};

export async function loadAgenticJournal(
  options: { cwd?: string; limit?: number } = {},
): Promise<AgenticJournalSnapshot> {
  const cwd = options.cwd ?? process.cwd();
  const limit = options.limit ?? 50;
  const [events, approvals, audits, orchestrations] = await Promise.all([
    readJsonl<DomainEventEnvelope>(agenticEventsPath(cwd), limit),
    readJsonl<PersistedApprovalRow>(agenticApprovalsPath(cwd), limit),
    readJsonl<AgentAuditRecord>(agenticAuditsPath(cwd), limit),
    readJsonl<AgenticOrchestrationRow>(agenticOrchestrationsPath(cwd), limit),
  ]);
  return { events, approvals, audits, orchestrations };
}
