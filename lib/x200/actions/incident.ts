import "server-only";

import { appendFile, chmod, mkdir, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { redactMonitoringText } from "@/lib/x200/activity";
import type { IncidentRecord, IncidentSeverity } from "@/lib/x200/actions/types";

const INCIDENTS_REL = path.join(".x200", "incidents.jsonl");
const EMERGENCY_STOP_REL = path.join(".x200", "EMERGENCY_STOP.json");

export const INCIDENT_SAFE_ACTIONS = [
  "ENTER_MAINTENANCE",
  "RESTART_APPLICATION",
  "RESTART_AUTOPILOT",
  "PAUSE_AUTOMATION",
  "RESUME_AUTOMATION",
  "COLLECT_DIAGNOSTICS",
  "RUN_HEALTH_CHECKS",
  "EMERGENCY_STOP",
] as const;

export async function createIncident(input: {
  severity: IncidentSeverity;
  notes: string;
  owner: string;
  cwd?: string;
}): Promise<IncidentRecord> {
  const record: IncidentRecord = {
    incidentId: randomUUID(),
    severity: input.severity,
    startedAt: new Date().toISOString(),
    notes: redactMonitoringText(input.notes, 500),
    owner: redactMonitoringText(input.owner, 120),
    timeline: [
      {
        at: new Date().toISOString(),
        event: "INCIDENT_OPENED",
        detail: input.severity,
      },
    ],
  };
  await appendIncident(record, input.cwd);
  return record;
}

export async function appendIncidentEvent(
  incidentId: string,
  event: string,
  detail: string,
  cwd = process.cwd(),
): Promise<IncidentRecord | null> {
  const all = await readIncidents({ cwd });
  const found = all.find((i) => i.incidentId === incidentId);
  if (!found) return null;
  const updated: IncidentRecord = {
    ...found,
    timeline: [
      ...found.timeline,
      {
        at: new Date().toISOString(),
        event,
        detail: redactMonitoringText(detail, 400),
      },
    ],
  };
  await appendIncident(updated, cwd);
  return updated;
}

export async function readIncidents(
  options: { cwd?: string } = {},
): Promise<IncidentRecord[]> {
  const filePath = path.join(options.cwd ?? process.cwd(), INCIDENTS_REL);
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    return [];
  }
  const map = new Map<string, IncidentRecord>();
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line) as IncidentRecord;
      if (parsed?.incidentId) map.set(parsed.incidentId, parsed);
    } catch {
      // skip
    }
  }
  return Array.from(map.values());
}

export async function readActiveIncident(
  options: { cwd?: string } = {},
): Promise<IncidentRecord | null> {
  const all = await readIncidents(options);
  return all.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null;
}

/**
 * Emergency stop: pause AUTOPILOT / new cycles / X200 mutations.
 * Must NOT delete files, kill DB, delete VM, or reset Git.
 */
export async function activateEmergencyStop(input: {
  actor: string;
  reason: string;
  cwd?: string;
}): Promise<{ ok: true; path: string }> {
  const cwd = input.cwd ?? process.cwd();
  await mkdir(path.join(cwd, ".x200"), { recursive: true, mode: 0o700 });
  const filePath = path.join(cwd, EMERGENCY_STOP_REL);
  const payload = {
    active: true,
    at: new Date().toISOString(),
    actor: redactMonitoringText(input.actor, 120),
    reason: redactMonitoringText(input.reason, 400),
    effects: [
      "stop_autopilot",
      "stop_new_cycles",
      "disable_x200_mutations",
      "preserve_state",
    ],
    forbidden: ["delete_files", "kill_db", "delete_vm", "reset_git"],
  };
  const { writeFile } = await import("node:fs/promises");
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  try {
    await chmod(filePath, 0o600);
  } catch {
    // best-effort
  }
  return { ok: true, path: filePath };
}

export async function isEmergencyStopActive(
  cwd = process.cwd(),
): Promise<boolean> {
  try {
    const raw = await readFile(path.join(cwd, EMERGENCY_STOP_REL), "utf8");
    const parsed = JSON.parse(raw) as { active?: boolean };
    return parsed.active === true;
  } catch {
    return false;
  }
}

async function appendIncident(
  record: IncidentRecord,
  cwd = process.cwd(),
): Promise<void> {
  await mkdir(path.join(cwd, ".x200"), { recursive: true, mode: 0o700 });
  const filePath = path.join(cwd, INCIDENTS_REL);
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
