import { randomBytes } from "node:crypto";
import { hostname } from "node:os";

import {
  canCompleteWithClaim,
  canMarkTerminee,
  claimMatches,
  createEvidenceRecord,
  incrementRegistryVersion,
  isClaimExpired,
  SAME_CAUSE_FAILURE_LIMIT,
  selectNextTaskResult,
  utcDateStamp,
  utcNow,
  validateBacklog,
} from "./x100-backlog.mjs";
import { readJsonFile, withExclusiveLock, writeJsonFileAtomic } from "./x100-fs.mjs";

export const DEFAULT_LOCK_PATH = ".x200/executor.lock";
export const DEFAULT_BACKLOG_PATH = "backlog.json";

const SENSITIVE_SCOPE_PATTERN = /(prisma\/migrations|lib\/auth|app\/admin|middleware\.ts|instrumentation\.ts)/i;

export function defaultWorkerId() {
  return process.env.X200_WORKER_ID || `local:${hostname()}`;
}

export function newClaimToken() {
  return randomBytes(16).toString("hex");
}

export function leaseExpiresAt(leaseSeconds, now = new Date()) {
  return new Date(now.getTime() + leaseSeconds * 1000).toISOString();
}

function replaceTask(data, updated) {
  return {
    ...data,
    tasks: data.tasks.map((task) => (task.id === updated.id ? updated : task)),
    history: [
      ...(Array.isArray(data.history) ? data.history : []),
      {
        at: utcDateStamp(),
        taskId: updated.id,
        status: updated.status,
        note: updated.lastTransitionReason || undefined,
      },
    ],
  };
}

function normalizeScopeEntry(value) {
  return String(value || "").trim().replace(/^\.\//, "").replace(/\/+$/, "");
}

export function scopesConflict(a = [], b = []) {
  for (const leftRaw of a) {
    const left = normalizeScopeEntry(leftRaw);
    if (!left) continue;
    for (const rightRaw of b) {
      const right = normalizeScopeEntry(rightRaw);
      if (!right) continue;
      if (left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`)) {
        return true;
      }
    }
  }
  return false;
}

function taskIsSensitive(task) {
  const haystack = [...(task.scope || []), task.title || "", task.objective || ""].join("\n");
  return SENSITIVE_SCOPE_PATTERN.test(haystack);
}

function activeWork(data) {
  return (data.tasks || []).filter((task) => ["EN_COURS", "EN_CONTRÔLE"].includes(task.status));
}

export function mutateBacklogAtomic({
  filePath = DEFAULT_BACKLOG_PATH,
  lockPath = DEFAULT_LOCK_PATH,
  expectedVersion = null,
  dryRun = false,
  workerId = defaultWorkerId(),
  mutator,
}) {
  const loaded = readJsonFile(filePath);
  if (!loaded.ok) {
    return {
      ok: false,
      error: loaded.error,
      path: loaded.path,
      preserved: true,
    };
  }

  const runMutate = () => {
    const fresh = readJsonFile(filePath);
    if (!fresh.ok) {
      return { ok: false, error: fresh.error, path: fresh.path, preserved: true };
    }
    if (expectedVersion != null && fresh.data.registryVersion !== expectedVersion) {
      return {
        ok: false,
        error: `registryVersion divergente (attendu ${expectedVersion}, actuel ${fresh.data.registryVersion})`,
        preserved: true,
      };
    }
    const validation = validateBacklog(fresh.data);
    if (!validation.ok) {
      return { ok: false, error: "BACKLOG_INVALID", errors: validation.errors, preserved: true };
    }

    const mutation = mutator(fresh.data);
    if (!mutation || mutation.ok === false) {
      return { ok: false, ...(mutation || { error: "mutation refusée" }), preserved: true };
    }

    const nextData = incrementRegistryVersion(mutation.data);
    const nextValidation = validateBacklog(nextData);
    if (!nextValidation.ok) {
      return {
        ok: false,
        error: "mutation invalide",
        errors: nextValidation.errors,
        preserved: true,
      };
    }

    if (dryRun) {
      return { ok: true, dryRun: true, data: nextData, wrote: false, ...mutation };
    }

    writeJsonFileAtomic(filePath, nextData);
    return { ok: true, dryRun: false, data: nextData, wrote: true, ...mutation };
  };

  if (dryRun) {
    return runMutate();
  }

  return withExclusiveLock(
    lockPath,
    { workerId, pid: process.pid, at: utcNow(), purpose: "backlog-write" },
    runMutate,
  );
}

export function claimTask(data, {
  taskId = null,
  workerId = defaultWorkerId(),
  leaseSeconds,
  now = new Date(),
  includeHuman = false,
} = {}) {
  const seconds = Number.isInteger(leaseSeconds)
    ? leaseSeconds
    : data.claimPolicy?.leaseSeconds || 7200;

  const task = taskId
    ? data.tasks.find((item) => item.id === taskId)
    : selectNextTaskResult(data, { includeHuman }).task;

  if (!task && taskId) {
    return { ok: false, error: `tâche introuvable (${taskId})` };
  }
  if (!task) {
    const selection = selectNextTaskResult(data, { includeHuman });
    return { ok: false, error: selection.reason || "NO_READY_TASK", blocking: selection.blocking };
  }

  if (task.requiresHuman && !includeHuman) {
    return { ok: false, error: "HUMAN_GATE_REQUIRED" };
  }

  if (task.status === "EN_COURS" && task.claim && !isClaimExpired(task.claim, now)) {
    if (claimMatches(task.claim, { workerId })) {
      const renewed = {
        ...task,
        claim: {
          ...task.claim,
          expiresAt: leaseExpiresAt(seconds, now),
          renewedAt: utcNow(now),
        },
        lastTransitionReason: "renouvellement de réservation",
        updatedAt: utcDateStamp(now),
      };
      return { ok: true, action: "renewed", task: renewed, data: replaceTask(data, renewed) };
    }
    return { ok: false, error: "LOCK_HELD", holder: task.claim.workerId };
  }

  if (task.status === "EN_COURS" && task.claim && isClaimExpired(task.claim, now)) {
    return {
      ok: false,
      error: "LEASE_EXPIRED_RECONCILE",
      taskId: task.id,
      hint: "npm run x200:resume — un bail expiré ne prouve pas l'absence d'effet",
    };
  }

  if (task.status !== "PRÊTE") {
    return { ok: false, error: `tâche non PRÊTE (${task.status})` };
  }

  if (task.consecutiveSameCauseFailures >= SAME_CAUSE_FAILURE_LIMIT) {
    return { ok: false, error: "trois échecs identiques" };
  }

  const active = activeWork(data);
  const activeInProgress = active.filter((item) => item.status === "EN_COURS");
  if (activeInProgress.length >= (data.wipLimits?.maxActiveTasks || 3)) {
    return { ok: false, error: "WIP_LIMIT", blocking: activeInProgress.map((item) => item.id) };
  }

  const conflicting = active.find((item) => item.id !== task.id && scopesConflict(task.scope, item.scope));
  if (conflicting) {
    return { ok: false, error: "SCOPE_CONFLICT", blocking: [conflicting.id] };
  }

  if (taskIsSensitive(task)) {
    const sensitive = active.find((item) => item.id !== task.id && taskIsSensitive(item));
    if (sensitive) {
      return { ok: false, error: "SENSITIVE_PARALLELISM_FORBIDDEN", blocking: [sensitive.id] };
    }
  }

  const claimed = {
    ...task,
    status: "EN_COURS",
    attempts: task.attempts + 1,
    lastTransitionReason: `réservation par ${workerId}`,
    nextAction: "exécuter le périmètre puis quality-gate",
    updatedAt: utcDateStamp(now),
    claim: {
      workerId,
      token: newClaimToken(),
      claimedAt: utcNow(now),
      expiresAt: leaseExpiresAt(seconds, now),
      leaseSeconds: seconds,
    },
  };

  const next = replaceTask({ ...data, nextTaskId: null }, claimed);
  return { ok: true, action: "claimed", task: claimed, data: next };
}

export function releaseTask(data, { taskId, workerId, token, now = new Date() } = {}) {
  const task = data.tasks.find((item) => item.id === taskId);
  if (!task) {
    return { ok: false, error: `tâche introuvable (${taskId})` };
  }
  if (task.status !== "EN_COURS") {
    return { ok: false, error: `release interdit depuis ${task.status}` };
  }
  if (!task.claim) {
    return { ok: false, error: "aucune réservation" };
  }
  if (!claimMatches(task.claim, { workerId, token })) {
    return { ok: false, error: "jeton ou travailleur non reconnus" };
  }
  const released = {
    ...task,
    status: "PRÊTE",
    claim: null,
    lastTransitionReason: "réservation relâchée",
    nextAction: "sélectionner à nouveau",
    updatedAt: utcDateStamp(now),
  };
  return { ok: true, action: "released", task: released, data: replaceTask(data, released) };
}

export function completeTask(data, {
  taskId,
  workerId,
  token,
  gate,
  now = new Date(),
  targetStatus = "EN_CONTRÔLE",
} = {}) {
  const task = data.tasks.find((item) => item.id === taskId);
  if (!task) {
    return { ok: false, error: `tâche introuvable (${taskId})` };
  }
  const claimCheck = canCompleteWithClaim(task, { workerId, token, now });
  if (!claimCheck.ok) {
    return claimCheck;
  }
  if (!gate || gate.ok !== true || gate.taskId !== task.id) {
    return { ok: false, error: "quality-gate absent, en échec ou d'une autre tâche" };
  }
  if (targetStatus === "TERMINÉE") {
    const terminee = canMarkTerminee(task, gate);
    if (!terminee.ok) {
      return terminee;
    }
  }

  const evidenceRecords = [
    ...(Array.isArray(task.evidenceRecords) ? task.evidenceRecords : []),
    createEvidenceRecord({
      type: "control",
      command: "npm run x200:quality-gate",
      result: "pass",
      exitCode: 0,
      reference: ".x200/quality-results.json",
      location: ".x200/quality-results.json",
    }),
  ];

  const completed = {
    ...task,
    status: targetStatus,
    claim: null,
    evidenceRecords,
    lastTransitionReason: targetStatus === "EN_CONTRÔLE"
      ? "contrôles locaux réussis ; attente du job quality"
      : "critères et contrôles satisfaits",
    nextAction: targetStatus === "EN_CONTRÔLE"
      ? "réconcilier le job quality puis clôturer et continuer dans le même cycle"
      : null,
    updatedAt: utcDateStamp(now),
  };

  return { ok: true, action: "completed", task: completed, data: replaceTask(data, completed) };
}

export function resumeInspection(data, { gitDirty = false, now = new Date() } = {}) {
  const active = (data.tasks || []).filter((task) => task.status === "EN_COURS");
  const findings = active.map((task) => {
    const expired = isClaimExpired(task.claim, now);
    return {
      id: task.id,
      status: task.status,
      expired,
      workerId: task.claim?.workerId || null,
      gitDirty,
      doubleEffectRisk: expired || gitDirty,
      action: expired
        ? gitDirty
          ? "BLOQUÉE — réconcilier les effets avant toute répétition"
          : "reprendre via resume --apply seulement après inspection"
        : "renouveler le bail puis continuer",
    };
  });
  return {
    executionMode: data.executionMode,
    active: findings,
    inControl: (data.tasks || []).filter((task) => task.status === "EN_CONTRÔLE").map((task) => task.id),
    exactlyOnce: false,
    note: "aucune garantie générale exactement-une-fois",
  };
}
