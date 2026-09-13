import "server-only";

import { createHash } from "node:crypto";
import { readFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

import type {
  ControlCenterTask,
  ProductCompleteSnapshot,
  ProductGoalSnapshot,
  HumanGateSnapshot,
  SourceStatus,
  TaskCounts,
  TaskStatus,
} from "@/lib/x200/types";

const ROOT = process.cwd();

const TASK_STATUSES: TaskStatus[] = [
  "À_FAIRE",
  "PRÊTE",
  "EN_COURS",
  "EN_CONTRÔLE",
  "BLOQUÉE",
  "ÉCHOUÉE",
  "TERMINÉE",
  "ANNULÉE",
];

export function repoPath(...segments: string[]): string {
  return path.join(ROOT, ...segments);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export function emptyTaskCounts(): TaskCounts {
  const counts = { total: 0 } as TaskCounts;
  for (const status of TASK_STATUSES) {
    counts[status] = 0;
  }
  return counts;
}

export function normalizeTask(raw: unknown): ControlCenterTask | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const task = raw as Record<string, unknown>;
  if (typeof task.id !== "string" || typeof task.title !== "string") {
    return null;
  }

  const evidence = Array.isArray(task.evidence)
    ? task.evidence.filter((item): item is string => typeof item === "string")
    : [];

  const claim =
    task.claim && typeof task.claim === "object" && !Array.isArray(task.claim)
      ? (task.claim as Record<string, unknown>)
      : null;

  return {
    id: task.id,
    title: task.title,
    objective: typeof task.objective === "string" ? task.objective : "",
    status: typeof task.status === "string" ? task.status : "UNKNOWN",
    priority: typeof task.priority === "string" ? task.priority : "UNKNOWN",
    dependencies: Array.isArray(task.dependencies)
      ? task.dependencies.filter((d): d is string => typeof d === "string")
      : [],
    attempts: typeof task.attempts === "number" ? task.attempts : 0,
    requiresHuman: task.requiresHuman === true,
    nextAction: typeof task.nextAction === "string" ? task.nextAction : null,
    blockedReason:
      typeof task.blockedReason === "string" ? task.blockedReason : null,
    evidence,
    evidenceCount: evidence.length,
    owner: typeof task.owner === "string" ? task.owner : null,
    updatedAt: typeof task.updatedAt === "string" ? task.updatedAt : null,
    claimWorkerId:
      claim && typeof claim.workerId === "string" ? claim.workerId : null,
    claimExpiresAt:
      claim && typeof claim.expiresAt === "string" ? claim.expiresAt : null,
    lastTransitionReason:
      typeof task.lastTransitionReason === "string"
        ? task.lastTransitionReason
        : null,
  };
}

export type BacklogParseResult = {
  status: SourceStatus;
  counts: TaskCounts | null;
  tasks: ControlCenterTask[];
  currentTask: ControlCenterTask | null;
  history: Array<{ at: string; taskId: string; status: string; note: string }>;
  warning: string | null;
  repository: string | null;
};

export function parseBacklogJson(raw: string): BacklogParseResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {
      status: "INVALID",
      counts: null,
      tasks: [],
      currentTask: null,
      history: [],
      warning: "backlog.json is not valid JSON",
      repository: null,
    };
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return {
      status: "INVALID",
      counts: null,
      tasks: [],
      currentTask: null,
      history: [],
      warning: "backlog.json root is not an object",
      repository: null,
    };
  }

  const root = data as Record<string, unknown>;
  const tasksRaw = Array.isArray(root.tasks) ? root.tasks : [];
  const tasks = tasksRaw
    .map(normalizeTask)
    .filter((task): task is ControlCenterTask => task !== null);

  const counts = emptyTaskCounts();
  counts.total = tasks.length;
  for (const task of tasks) {
    if (TASK_STATUSES.includes(task.status as TaskStatus)) {
      counts[task.status as TaskStatus] += 1;
    }
  }

  const currentTask =
    tasks.find((task) => task.status === "EN_COURS") ??
    tasks.find((task) => task.status === "EN_CONTRÔLE") ??
    null;

  const historyRaw = Array.isArray(root.history) ? root.history : [];
  const history = historyRaw
    .filter((item): item is Record<string, unknown> =>
      Boolean(item && typeof item === "object" && !Array.isArray(item)),
    )
    .map((item) => ({
      at: typeof item.at === "string" ? item.at : "UNKNOWN",
      taskId: typeof item.taskId === "string" ? item.taskId : "UNKNOWN",
      status: typeof item.status === "string" ? item.status : "UNKNOWN",
      note: typeof item.note === "string" ? item.note : "",
    }));

  return {
    status: "OK",
    counts,
    tasks,
    currentTask,
    history,
    warning: null,
    repository:
      typeof root.repository === "string" ? root.repository : null,
  };
}

export async function readBacklogSnapshot(): Promise<BacklogParseResult> {
  const filePath = repoPath("backlog.json");
  if (!(await fileExists(filePath))) {
    return {
      status: "MISSING",
      counts: null,
      tasks: [],
      currentTask: null,
      history: [],
      warning: "backlog.json not found",
      repository: null,
    };
  }

  try {
    const raw = await readFile(filePath, "utf8");
    return parseBacklogJson(raw);
  } catch (error) {
    return {
      status: "ERROR",
      counts: null,
      tasks: [],
      currentTask: null,
      history: [],
      warning: error instanceof Error ? error.message : "backlog read failed",
      repository: null,
    };
  }
}

export function hashProductGoal(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export function countDetectableCriteria(content: string): number {
  const matches = content.match(/^\d+\.\s+/gm);
  return matches ? matches.length : 0;
}

export async function readProductGoalSnapshot(): Promise<ProductGoalSnapshot> {
  const filePath = repoPath("PRODUCT_GOAL.md");
  if (!(await fileExists(filePath))) {
    return {
      status: "MISSING",
      exists: false,
      hash: null,
      byteLength: null,
      detectableCriteriaCount: null,
      warning: "PRODUCT_GOAL.md not found",
    };
  }

  try {
    const content = await readFile(filePath, "utf8");
    return {
      status: "OK",
      exists: true,
      hash: hashProductGoal(content),
      byteLength: Buffer.byteLength(content, "utf8"),
      detectableCriteriaCount: countDetectableCriteria(content),
      warning: null,
    };
  } catch (error) {
    return {
      status: "ERROR",
      exists: true,
      hash: null,
      byteLength: null,
      detectableCriteriaCount: null,
      warning:
        error instanceof Error ? error.message : "PRODUCT_GOAL read failed",
    };
  }
}

function sanitizeGateText(value: unknown, max = 400): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

export async function readHumanGateSnapshot(): Promise<HumanGateSnapshot> {
  const filePath = repoPath(".x200", "HUMAN_GATE.json");
  if (!(await fileExists(filePath))) {
    return {
      status: "MISSING",
      present: false,
      createdAt: null,
      reason: null,
      taskId: null,
      requiredAction: null,
      blocking: [],
      merged: null,
      deployed: null,
      warning: null,
    };
  }

  try {
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw) as Record<string, unknown>;
    const blocking = Array.isArray(data.blocking)
      ? data.blocking
          .filter((item): item is string => typeof item === "string")
          .map((item) => sanitizeGateText(item, 120) ?? item)
      : [];

    return {
      status: "OK",
      present: true,
      createdAt: sanitizeGateText(data.createdAt),
      reason: sanitizeGateText(data.reason),
      taskId: sanitizeGateText(data.taskId, 32),
      requiredAction: sanitizeGateText(data.requiredAction),
      blocking,
      merged: typeof data.merged === "boolean" ? data.merged : null,
      deployed: typeof data.deployed === "boolean" ? data.deployed : null,
      warning: null,
    };
  } catch (error) {
    return {
      status: "INVALID",
      present: true,
      createdAt: null,
      reason: null,
      taskId: null,
      requiredAction: null,
      blocking: [],
      merged: null,
      deployed: null,
      warning:
        error instanceof Error ? error.message : "HUMAN_GATE parse failed",
    };
  }
}

export async function readProductCompleteSnapshot(options: {
  currentHead: string | null;
  currentGoalHash: string | null;
}): Promise<ProductCompleteSnapshot> {
  const filePath = repoPath(".x200", "PRODUCT_COMPLETE.json");
  if (!(await fileExists(filePath))) {
    return {
      status: "MISSING",
      present: false,
      head: null,
      goalHash: null,
      generatedAt: null,
      matchesCurrentHead: null,
      matchesCurrentGoalHash: null,
      summary: null,
      warning: null,
    };
  }

  try {
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw) as Record<string, unknown>;
    const head = typeof data.head === "string" ? data.head : null;
    const goalHash = typeof data.goalHash === "string" ? data.goalHash : null;

    return {
      status: "OK",
      present: true,
      head,
      goalHash,
      generatedAt:
        typeof data.generatedAt === "string" ? data.generatedAt : null,
      matchesCurrentHead:
        head && options.currentHead ? head === options.currentHead : null,
      matchesCurrentGoalHash:
        goalHash && options.currentGoalHash
          ? goalHash === options.currentGoalHash
          : null,
      summary: sanitizeGateText(data.summary, 500),
      warning: null,
    };
  } catch (error) {
    return {
      status: "INVALID",
      present: true,
      head: null,
      goalHash: null,
      generatedAt: null,
      matchesCurrentHead: null,
      matchesCurrentGoalHash: null,
      summary: null,
      warning:
        error instanceof Error
          ? error.message
          : "PRODUCT_COMPLETE parse failed",
    };
  }
}
