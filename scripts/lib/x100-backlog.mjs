export const SCHEMA_VERSION = "1.0.0";

export const ALLOWED_STATUSES = Object.freeze([
  "À_FAIRE",
  "PRÊTE",
  "EN_COURS",
  "EN_CONTRÔLE",
  "BLOQUÉE",
  "ÉCHOUÉE",
  "TERMINÉE",
]);

export const ALLOWED_PRIORITIES = Object.freeze(["P0", "P1", "P2", "P3"]);

export const ALLOWED_RISKS = Object.freeze(["low", "medium", "high"]);

export const TASK_ID_PATTERN = /^T([0-9]{3})$/;

export const REQUIRED_ROOT_FIELDS = Object.freeze([
  "schemaVersion",
  "project",
  "repository",
  "updatedAt",
  "allowedStatuses",
  "allowedPriorities",
  "wipLimits",
  "selectionPolicy",
  "nextTaskId",
  "tasks",
  "history",
]);

export const REQUIRED_TASK_FIELDS = Object.freeze([
  "id",
  "title",
  "objective",
  "priority",
  "owner",
  "dependencies",
  "scope",
  "acceptanceCriteria",
  "tests",
  "status",
  "evidence",
  "estimatedCost",
  "risk",
  "attempts",
  "requiresHuman",
  "updatedAt",
]);

export const ACTIVE_STATUSES = Object.freeze(["EN_COURS"]);

export const SELECTABLE_STATUS = "PRÊTE";

export const NON_SELECTABLE_STATUSES = Object.freeze([
  "BLOQUÉE",
  "ÉCHOUÉE",
  "EN_CONTRÔLE",
]);

const STATUSES_REQUIRING_COMPLETE_DEPS = Object.freeze([
  "PRÊTE",
  "EN_COURS",
  "EN_CONTRÔLE",
]);

const AUTH_OR_MIGRATION_PATTERN =
  /(prisma\/migrations|lib\/auth|app\/admin|middleware\.ts|instrumentation\.ts)/i;

const PRIORITY_RANK = { P0: 0, P1: 1, P2: 2, P3: 3 };
const RISK_RANK = { low: 0, medium: 1, high: 2 };

export function parseTaskIdNumber(id) {
  const match = TASK_ID_PATTERN.exec(id);
  if (!match) {
    return null;
  }
  return Number.parseInt(match[1], 10);
}

export function isAllowedTaskId(id) {
  const n = parseTaskIdNumber(id);
  return n !== null && n >= 1 && n <= 100;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function sameStringSet(actual, expected) {
  if (!Array.isArray(actual)) {
    return false;
  }
  if (actual.length !== expected.length) {
    return false;
  }
  return expected.every((item) => actual.includes(item));
}

function hasAuthOrMigrationScope(task) {
  const haystack = [...task.scope, task.title, task.objective].join("\n");
  return AUTH_OR_MIGRATION_PATTERN.test(haystack);
}

export function collectDependencyGraphErrors(tasks) {
  const errors = [];
  const byId = new Map(tasks.map((task) => [task.id, task]));

  for (const task of tasks) {
    for (const depId of task.dependencies) {
      if (!byId.has(depId)) {
        errors.push(`${task.id}: dépendance inexistante ${depId}`);
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();

  function visit(id, stack) {
    if (visited.has(id)) {
      return;
    }
    if (visiting.has(id)) {
      const cycleStart = stack.indexOf(id);
      const cycle = [...stack.slice(cycleStart), id].join(" -> ");
      errors.push(`dépendance circulaire: ${cycle}`);
      return;
    }
    visiting.add(id);
    stack.push(id);
    const task = byId.get(id);
    if (task) {
      for (const depId of task.dependencies) {
        if (byId.has(depId)) {
          visit(depId, stack);
        }
      }
    }
    stack.pop();
    visiting.delete(id);
    visited.add(id);
  }

  for (const task of tasks) {
    visit(task.id, []);
  }

  return errors;
}

export function validateTask(task, index) {
  const errors = [];
  const label = task && typeof task === "object" && isNonEmptyString(task.id)
    ? task.id
    : `tasks[${index}]`;

  if (!task || typeof task !== "object" || Array.isArray(task)) {
    return [`${label}: la tâche doit être un objet`];
  }

  for (const field of REQUIRED_TASK_FIELDS) {
    if (!(field in task)) {
      errors.push(`${label}: champ obligatoire absent (${field})`);
    }
  }

  if (!isAllowedTaskId(task.id)) {
    errors.push(`${label}: ID hors T001–T100`);
  }

  if (!isNonEmptyString(task.title)) {
    errors.push(`${label}: title doit être une chaîne non vide`);
  }
  if (!isNonEmptyString(task.objective)) {
    errors.push(`${label}: objective doit être une chaîne non vide`);
  }
  if (!ALLOWED_PRIORITIES.includes(task.priority)) {
    errors.push(`${label}: priorité inconnue (${String(task.priority)})`);
  }
  if (!isNonEmptyString(task.owner)) {
    errors.push(`${label}: owner doit être une chaîne non vide`);
  }
  if (!isStringArray(task.dependencies)) {
    errors.push(`${label}: dependencies doit être un tableau de chaînes`);
  }
  if (!isStringArray(task.scope) || task.scope.length === 0) {
    errors.push(`${label}: scope doit être un tableau de chaînes non vide`);
  }
  if (!isStringArray(task.acceptanceCriteria) || task.acceptanceCriteria.length === 0) {
    errors.push(
      `${label}: acceptanceCriteria doit être un tableau de chaînes non vide`,
    );
  }
  if (!isStringArray(task.tests)) {
    errors.push(`${label}: tests doit être un tableau de chaînes`);
  }
  if (!ALLOWED_STATUSES.includes(task.status)) {
    errors.push(`${label}: état inconnu (${String(task.status)})`);
  }
  if (!isStringArray(task.evidence)) {
    errors.push(`${label}: evidence doit être un tableau de chaînes`);
  }
  if (typeof task.estimatedCost !== "number" || !Number.isFinite(task.estimatedCost) || task.estimatedCost < 0) {
    errors.push(`${label}: estimatedCost doit être un nombre >= 0`);
  }
  if (!ALLOWED_RISKS.includes(task.risk)) {
    errors.push(`${label}: risk inconnu (${String(task.risk)})`);
  }
  if (!Number.isInteger(task.attempts) || task.attempts < 0) {
    errors.push(`${label}: attempts doit être un entier >= 0`);
  }
  if (typeof task.requiresHuman !== "boolean") {
    errors.push(`${label}: requiresHuman doit être un booléen`);
  }
  if (!isNonEmptyString(task.updatedAt)) {
    errors.push(`${label}: updatedAt doit être une chaîne non vide`);
  }

  if (task.status === "TERMINÉE") {
    const evidence = Array.isArray(task.evidence) ? task.evidence.filter((item) => item.trim()) : [];
    if (evidence.length === 0) {
      errors.push(`${label}: preuve absente pour une tâche terminée`);
    }
  }

  return errors;
}

export function validateBacklog(data) {
  const errors = [];

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, errors: ["le backlog doit être un objet JSON"] };
  }

  for (const field of REQUIRED_ROOT_FIELDS) {
    if (!(field in data)) {
      errors.push(`champ racine obligatoire absent (${field})`);
    }
  }

  if (data.schemaVersion !== SCHEMA_VERSION) {
    errors.push(`schemaVersion attendu ${SCHEMA_VERSION}`);
  }
  if (!isNonEmptyString(data.project)) {
    errors.push("project doit être une chaîne non vide");
  }
  if (!isNonEmptyString(data.repository)) {
    errors.push("repository doit être une chaîne non vide");
  }
  if (!isNonEmptyString(data.updatedAt)) {
    errors.push("updatedAt doit être une chaîne non vide");
  }
  if (!sameStringSet(data.allowedStatuses, ALLOWED_STATUSES)) {
    errors.push("allowedStatuses doit contenir exactement les états autorisés");
  }
  if (!sameStringSet(data.allowedPriorities, ALLOWED_PRIORITIES)) {
    errors.push("allowedPriorities doit contenir exactement P0–P3");
  }

  const wip = data.wipLimits;
  if (!wip || typeof wip !== "object") {
    errors.push("wipLimits doit être un objet");
  } else {
    if (wip.maxActiveP0 !== 1) {
      errors.push("wipLimits.maxActiveP0 doit valoir 1");
    }
    if (wip.maxActiveTasks !== 3) {
      errors.push("wipLimits.maxActiveTasks doit valoir 3");
    }
    if (!Array.isArray(wip.activeStatuses) || !wip.activeStatuses.includes("EN_COURS")) {
      errors.push("wipLimits.activeStatuses doit inclure EN_COURS");
    }
  }

  if (!data.selectionPolicy || typeof data.selectionPolicy !== "object") {
    errors.push("selectionPolicy doit être un objet");
  }

  if (!Array.isArray(data.tasks)) {
    errors.push("tasks doit être un tableau");
    return { ok: false, errors };
  }

  if (!Array.isArray(data.history)) {
    errors.push("history doit être un tableau");
  }

  const seen = new Set();
  for (let index = 0; index < data.tasks.length; index += 1) {
    const task = data.tasks[index];
    errors.push(...validateTask(task, index));
    if (task && typeof task === "object" && isNonEmptyString(task.id)) {
      if (seen.has(task.id)) {
        errors.push(`ID dupliqué ${task.id}`);
      }
      seen.add(task.id);
    }
  }

  const validTasks = data.tasks.filter(
    (task) => task && typeof task === "object" && isAllowedTaskId(task.id) && isStringArray(task.dependencies),
  );

  errors.push(...collectDependencyGraphErrors(validTasks));

  const byId = new Map(validTasks.map((task) => [task.id, task]));
  for (const task of validTasks) {
    if (STATUSES_REQUIRING_COMPLETE_DEPS.includes(task.status)) {
      for (const depId of task.dependencies) {
        const dep = byId.get(depId);
        if (dep && dep.status !== "TERMINÉE") {
          errors.push(
            `${task.id}: dépendance ${depId} n'est pas TERMINÉE (état ${dep.status})`,
          );
        }
      }
    }
  }

  const active = validTasks.filter((task) => ACTIVE_STATUSES.includes(task.status));
  const activeP0 = active.filter((task) => task.priority === "P0");
  if (activeP0.length > 1) {
    errors.push(
      `plus d'une P0 active: ${activeP0.map((task) => task.id).join(", ")}`,
    );
  }
  if (active.length > 3) {
    errors.push(
      `plus de trois tâches actives: ${active.map((task) => task.id).join(", ")}`,
    );
  }

  const activeSensitive = active.filter(hasAuthOrMigrationScope);
  if (activeSensitive.length > 1) {
    errors.push(
      `migrations ou authentification parallélisées: ${activeSensitive.map((task) => task.id).join(", ")}`,
    );
  }

  if (data.nextTaskId !== null && data.nextTaskId !== undefined) {
    if (!isAllowedTaskId(data.nextTaskId)) {
      errors.push(`nextTaskId invalide (${String(data.nextTaskId)})`);
    } else {
      const next = byId.get(data.nextTaskId);
      if (!next) {
        errors.push(`nextTaskId ${data.nextTaskId} n'existe pas`);
      } else if (next.status !== SELECTABLE_STATUS) {
        errors.push(
          `nextTaskId ${data.nextTaskId} n'est pas PRÊTE (état ${next.status})`,
        );
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

export function countUnblockedDependents(tasks, taskId) {
  return tasks.filter((task) => task.dependencies.includes(taskId)).length;
}

export function compareReadyTasks(a, b, tasks) {
  const priorityDelta = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const unblockDelta =
    countUnblockedDependents(tasks, b.id) - countUnblockedDependents(tasks, a.id);
  if (unblockDelta !== 0) {
    return unblockDelta;
  }

  const riskDelta = RISK_RANK[a.risk] - RISK_RANK[b.risk];
  if (riskDelta !== 0) {
    return riskDelta;
  }

  const costDelta = a.estimatedCost - b.estimatedCost;
  if (costDelta !== 0) {
    return costDelta;
  }

  return parseTaskIdNumber(a.id) - parseTaskIdNumber(b.id);
}

export function listReadyTasks(data) {
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const byId = new Map(tasks.map((task) => [task.id, task]));

  return tasks.filter((task) => {
    if (task.status !== SELECTABLE_STATUS) {
      return false;
    }
    if (NON_SELECTABLE_STATUSES.includes(task.status)) {
      return false;
    }
    return task.dependencies.every((depId) => byId.get(depId)?.status === "TERMINÉE");
  });
}

export function selectNextTask(data) {
  const ready = listReadyTasks(data);
  if (ready.length === 0) {
    return null;
  }
  const sorted = [...ready].sort((a, b) => compareReadyTasks(a, b, data.tasks));
  return sorted[0];
}

export function utcDateStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
