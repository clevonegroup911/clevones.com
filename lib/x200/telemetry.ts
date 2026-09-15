import "server-only";

import { readFile, access, stat } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

import type {
  AutopilotLiveState,
  FedoraLiveState,
  SourceStatus,
} from "@/lib/x200/types";

const TELEMETRY_PATH = () => path.join(process.cwd(), ".x200", "telemetry.json");

/** Default: 3 minutes — longer than default poll (60s) but short enough to detect death. */
export const DEFAULT_TELEMETRY_STALE_MS = Number(
  process.env.X200_TELEMETRY_STALE_MS || 180_000,
);

export type FedoraTelemetryFile = {
  version: number;
  updatedAt: string;
  pid: number;
  host: string;
  mode: string;
  head: string | null;
  branch: string | null;
  lastEvent: string;
  cycle: number;
  agentRunning: boolean;
  taskId: string | null;
};

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function parseTelemetryJson(raw: string): {
  status: SourceStatus;
  data: FedoraTelemetryFile | null;
  warning: string | null;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "INVALID", data: null, warning: "telemetry.json is not valid JSON" };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { status: "INVALID", data: null, warning: "telemetry.json root must be an object" };
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.version !== 1) {
    return { status: "INVALID", data: null, warning: "telemetry.json version unsupported" };
  }
  if (!isIsoDate(obj.updatedAt)) {
    return { status: "INVALID", data: null, warning: "telemetry.json updatedAt missing/invalid" };
  }
  if (typeof obj.pid !== "number" || !Number.isFinite(obj.pid)) {
    return { status: "INVALID", data: null, warning: "telemetry.json pid missing/invalid" };
  }
  if (typeof obj.host !== "string" || !obj.host.trim()) {
    return { status: "INVALID", data: null, warning: "telemetry.json host missing" };
  }
  if (typeof obj.mode !== "string" || !obj.mode.trim()) {
    return { status: "INVALID", data: null, warning: "telemetry.json mode missing" };
  }
  if (typeof obj.lastEvent !== "string" || !obj.lastEvent.trim()) {
    return { status: "INVALID", data: null, warning: "telemetry.json lastEvent missing" };
  }

  return {
    status: "OK",
    data: {
      version: 1,
      updatedAt: obj.updatedAt,
      pid: obj.pid,
      host: obj.host.trim(),
      mode: obj.mode.trim(),
      head: typeof obj.head === "string" ? obj.head : null,
      branch: typeof obj.branch === "string" ? obj.branch : null,
      lastEvent: obj.lastEvent.trim(),
      cycle: typeof obj.cycle === "number" && Number.isFinite(obj.cycle) ? obj.cycle : 0,
      agentRunning: obj.agentRunning === true,
      taskId: typeof obj.taskId === "string" ? obj.taskId : null,
    },
    warning: null,
  };
}

export function deriveLiveStateFromTelemetry(
  data: FedoraTelemetryFile,
  {
    nowMs = Date.now(),
    staleMs = DEFAULT_TELEMETRY_STALE_MS,
  }: { nowMs?: number; staleMs?: number } = {},
): { liveState: FedoraLiveState; ageMs: number; stale: boolean } {
  const ageMs = Math.max(0, nowMs - Date.parse(data.updatedAt));
  if (ageMs > staleMs) {
    return { liveState: "STALE", ageMs, stale: true };
  }

  const event = data.lastEvent.toUpperCase();
  if (data.agentRunning || event === "FAST_LANE" || event === "AUTOPLAN") {
    if (event === "AUTOPLAN") return { liveState: "AUTOPLAN", ageMs, stale: false };
    return { liveState: "RUNNING", ageMs, stale: false };
  }
  if (event === "AUTOPLAN_COMPLETE" || event === "COMPLETE") {
    return { liveState: "COMPLETE", ageMs, stale: false };
  }
  if (event === "WAIT" || event === "IDLE" || event === "BOOT" || event === "HUMAN_GATE") {
    return { liveState: "IDLE", ageMs, stale: false };
  }
  return { liveState: "IDLE", ageMs, stale: false };
}

export async function readFedoraTelemetrySnapshot(
  options: { nowMs?: number; staleMs?: number } = {},
): Promise<AutopilotLiveState> {
  try {
    await access(TELEMETRY_PATH(), constants.R_OK);
  } catch {
    return {
      fedoraTelemetry: "NOT_CONNECTED",
      autopilotLiveState: "WAITING_FOR_TELEMETRY",
      note: "No .x200/telemetry.json — Fedora AUTOPILOT heartbeat not connected.",
      updatedAt: null,
      ageMs: null,
      pid: null,
      host: null,
      mode: null,
      head: null,
      branch: null,
      lastEvent: null,
      cycle: null,
      agentRunning: null,
      taskId: null,
    };
  }

  let raw: string;
  try {
    raw = await readFile(TELEMETRY_PATH(), "utf8");
  } catch (error) {
    return {
      fedoraTelemetry: "ERROR",
      autopilotLiveState: "WAITING_FOR_TELEMETRY",
      note: `Failed to read telemetry.json: ${error instanceof Error ? error.message : "unknown"}`,
      updatedAt: null,
      ageMs: null,
      pid: null,
      host: null,
      mode: null,
      head: null,
      branch: null,
      lastEvent: null,
      cycle: null,
      agentRunning: null,
      taskId: null,
    };
  }

  if (!raw.trim()) {
    return {
      fedoraTelemetry: "INVALID",
      autopilotLiveState: "WAITING_FOR_TELEMETRY",
      note: "telemetry.json is empty (possible mid-write race avoided by atomic rename)",
      updatedAt: null,
      ageMs: null,
      pid: null,
      host: null,
      mode: null,
      head: null,
      branch: null,
      lastEvent: null,
      cycle: null,
      agentRunning: null,
      taskId: null,
    };
  }

  const parsed = parseTelemetryJson(raw);
  if (!parsed.data) {
    return {
      fedoraTelemetry: parsed.status,
      autopilotLiveState: "WAITING_FOR_TELEMETRY",
      note: parsed.warning ?? "Invalid telemetry payload",
      updatedAt: null,
      ageMs: null,
      pid: null,
      host: null,
      mode: null,
      head: null,
      branch: null,
      lastEvent: null,
      cycle: null,
      agentRunning: null,
      taskId: null,
    };
  }

  const derived = deriveLiveStateFromTelemetry(parsed.data, options);
  // Touch mtime only for diagnostics — content updatedAt is authoritative.
  try {
    await stat(TELEMETRY_PATH());
  } catch {
    // ignore
  }

  return {
    fedoraTelemetry: "OK",
    autopilotLiveState: derived.liveState,
    note: derived.stale
      ? `Telemetry stale (ageMs=${derived.ageMs} > ${options.staleMs ?? DEFAULT_TELEMETRY_STALE_MS})`
      : `Telemetry live from host=${parsed.data.host} pid=${parsed.data.pid}`,
    updatedAt: parsed.data.updatedAt,
    ageMs: derived.ageMs,
    pid: parsed.data.pid,
    host: parsed.data.host,
    mode: parsed.data.mode,
    head: parsed.data.head,
    branch: parsed.data.branch,
    lastEvent: parsed.data.lastEvent,
    cycle: parsed.data.cycle,
    agentRunning: parsed.data.agentRunning,
    taskId: parsed.data.taskId,
  };
}
