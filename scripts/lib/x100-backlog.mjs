export const SCHEMA_VERSION_V1 = "1.0.0";
export const SCHEMA_VERSION = "2.0.0";
export const MAX_TASK_ID = 200;
export const EXECUTION_MODE = "single-executor";
export const DEFAULT_LEASE_SECONDS = 7200;
export const SAME_CAUSE_FAILURE_LIMIT = 3;

export const ALLOWED_STATUSES = Object.freeze([
  "À_FAIRE",
  "PRÊTE",
  "EN_COURS",
  "EN_CONTRÔLE",
  "BLOQUÉE",
  "ÉCHOUÉE",
  "TERMINÉE",
  "ANNULÉE",
]);

export const ALLOWED_PRIORITIES = Object.freeze(["P0", "P1", "P2", "P3"]);

export const ALLOWED_RISKS = Object.freeze(["low", "medium", "high"]);

export const EVIDENCE_TYPES = Object.freeze([
  "command",
  "control",
  "review",
  "ci",
  "commit",
  "document",
]);

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
  "ANNULÉE",
]);

export const SATISFYING_DEPENDENCY_STATUS = "TERMINÉE";

const STATUSES_REQUIRING_COMPLETE_DEPS = Object.freeze([
  "PRÊTE",
  "EN_COURS",
  "EN_CONTRÔLE",
]);

const AUTH_OR_MIGRATION_PATTERN =
  /(prisma\/migrations|lib\/auth|app\/admin|middleware\.ts|instrumentation\.ts)/i;

const PRIORITY_RANK = { P0: 0, P1: 1, P2: 2, P3: 3 };
const RISK_RANK = { low: 0, medium: 1, high: 2 };

const DEFAULT_SELECTION_ORDER = Object.freeze([
  "priority",
  "riskDesc",
  "unblockCount",
  "costAsc",
  "idAsc",
]);

export function parseTaskIdNumber(id) {
  const match = TASK_ID_PATTERN.exec(id);
  if (!match) {
    return null;
  }
  return Number.parseInt(match[1], 10);
}

export function isAllowedTaskId(id) {
  const n = parseTaskIdNumber(id);
  return n !== null && n >= 1 && n <= MAX_TASK_ID;
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

export function utcDateStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function utcNow(date = new Date()) {
  return date.toISOString();
}

export function applyTaskDefaults(task, project) {
  if (!task || typeof task !== "object" || Array.isArray(task)) {
    return task;
  }
  return {
    project: isNonEmptyString(task.project) ? task.project : project,
    sourceRef: task.sourceRef ?? null,
    lastFailureCause: task.lastFailureCause ?? null,
    consecutiveSameCauseFailures: Number.isInteger(task.consecutiveSameCauseFailures)
      ? task.consecutiveSameCauseFailures
      : 0,
    blockedReason: task.blockedReason ?? null,
    claim: task.claim ?? null,
    evidenceRecords: Array.isArray(task.evidenceRecords) ? task.evidenceRecords : [],
    regressionOf: task.regressionOf ?? null,
    nextAction: task.nextAction ?? null,
    lastTransitionReason: task.lastTransitionReason ?? null,
    ...task,
    project: isNonEmptyString(task.project) ? task.project : project,
    evidenceRecords: Array.isArray(task.evidenceRecords) ? task.evidenceRecords : [],
    claim: task.claim ?? null,
  };
}

export function defaultRootExtras(data = {}) {
  return {
    registryVersion: Number.isInteger(data.registryVersion) ? data.registryVersion : 1,
    executionMode: data.executionMode === EXECUTION_MODE ? EXECUTION_MODE : EXECUTION_MODE,
    claimPolicy: {
      leaseSeconds: Number.isInteger(data.claimPolicy?.leaseSeconds)
        ? data.claimPolicy.leaseSeconds
        : DEFAULT_LEASE_SECONDS,
      singleExecutor: data.claimPolicy?.singleExecutor !== false,
    },
  };
}

export function needsMigration(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  if (data.schemaVersion === SCHEMA_VERSION_V1) {
    return true;
  }
  if (data.schemaVersion === SCHEMA_VERSION) {
    return !Number.isInteger(data.registryVersion) || data.executionMode !== EXECUTION_MODE;
  }
  return false;
}

export function migrateBacklogData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, error: "le backlog doit être un objet JSON", data: null, changed: false };
  }

  const fromVersion = data.schemaVersion;
  if (fromVersion !== SCHEMA_VERSION_V1 && fromVersion !== SCHEMA_VERSION) {
    return {
      ok: false,
      error: `schemaVersion non migrable (${String(fromVersion)})`,
      data: null,
      changed: false,
    };
  }

  const extras = defaultRootExtras(data);
  const selectionPolicy = {
    readyStatus: "PRÊTE",
    excludeStatuses: ["BLOQUÉE", "ÉCHOUÉE", "EN_CONTRÔLE"],
    excludeRequiresHuman: true,
    blockWhenInControl: false,
    order: [...DEFAULT_SELECTION_ORDER],
    ...(data.selectionPolicy && typeof data.selectionPolicy === "object" ? data.selectionPolicy : {}),
    order: Array.isArray(data.selectionPolicy?.order) && data.selectionPolicy.order.length
      ? data.selectionPolicy.order
      : [...DEFAULT_SELECTION_ORDER],
  };
  if (!selectionPolicy.excludeStatuses.includes("ANNULÉE")) {
    selectionPolicy.excludeStatuses = [...selectionPolicy.excludeStatuses, "ANNULÉE"];
  }

  const allowedStatuses = sameStringSet(data.allowedStatuses, ALLOWED_STATUSES)
    ? [...data.allowedStatuses]
    : [...ALLOWED_STATUSES];

  const tasks = Array.isArray(data.tasks)
    ? data.tasks.map((task) => applyTaskDefaults(task, data.project))
    : [];

  const migrated = {
    ...data,
    schemaVersion: SCHEMA_VERSION,
    registryVersion: extras.registryVersion,
    executionMode: extras.executionMode,
    claimPolicy: extras.claimPolicy,
    allowedStatuses,
    selectionPolicy,
    tasks,
    history: Array.isArray(data.history) ? data.history : [],
  };

  const changed = JSON.stringify({
    schemaVersion: data.schemaVersion,
    registryVersion: data.registryVersion,
    executionMode: data.executionMode,
    allowedStatuses: data.allowedStatuses,
    selectionPolicy: data.selectionPolicy,
    claimPolicy: data.claimPolicy,
    tasks: data.tasks,
  }) !== JSON.stringify({
    schemaVersion: migrated.schemaVersion,
    registryVersion: migrated.registryVersion,
    executionMode: migrated.executionMode,
    allowedStatuses: migrated.allowedStatuses,
    selectionPolicy: migrated.selectionPolicy,
    claimPolicy: migrated.claimPolicy,
    tasks: migrated.tasks,
  });

  return { ok: true, data: migrated, changed, fromVersion };
}

export function incrementRegistryVersion(data) {
  const current = Number.isInteger(data.registryVersion) ? data.registryVersion : 0;
  return { ...data, registryVersion: current + 1, updatedAt: utcDateStamp() };
}

function validateEvidenceRecord(record, label, index) {
  const errors = [];
  const prefix = `${label}.evidenceRecords[${index}]`;
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return [`${prefix}: doit être un objet`];
  }
  if (!EVIDENCE_TYPES.includes(record.type)) {
    errors.push(`${prefix}: type inconnu`);
  }
  if (!isNonEmptyString(record.result)) {
    errors.push(`${prefix}: result obligatoire`);
  }
  if (!isNonEmptyString(record.at)) {
    errors.push(`${prefix}: at obligatoire`);
  }
  if (record.command != null && typeof record.command !== "string") {
    errors.push(`${prefix}: command doit être une chaîne`);
  }
  if (record.location != null && typeof record.location !== "string") {
    errors.push(`${prefix}: location doit être une chaîne`);
  }
  if (record.reference != null && typeof record.reference !== "string") {
    errors.push(`${prefix}: reference doit être une chaîne`);
  }
  if (record.exitCode != null && !Number.isInteger(record.exitCode)) {
    errors.push(`${prefix}: exitCode doit être un entier`);
  }
  return errors;
}

function validateClaim(claim, label) {
  if (claim == null) {
    return [];
  }
  const errors = [];
  if (typeof claim !== "object" || Array.isArray(claim)) {
    return [`${label}: claim doit être un objet ou null`];
  }
  for (const field of ["workerId", "token", "claimedAt", "expiresAt"]) {
    if (!isNonEmptyString(claim[field])) {
      errors.push(`${label}: claim.${field} obligatoire`);
    }
  }
  return errors;
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

export function dependencyIsSatisfied(dep) {
  return Boolean(dep && dep.status === SATISFYING_DEPENDENCY_STATUS);
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
    errors.push(`${label}: ID hors T001–T${String(MAX_TASK_ID).padStart(3, "0")}`);
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

  if (Array.isArray(task.evidenceRecords)) {
    task.evidenceRecords.forEach((record, recordIndex) => {
      errors.push(...validateEvidenceRecord(record, label, recordIndex));
    });
  }

  errors.push(...validateClaim(task.claim, label));

  if (task.regressionOf != null && !isAllowedTaskId(task.regressionOf)) {
    errors.push(`${label}: regressionOf invalide`);
  }

  if (
    Number.isInteger(task.consecutiveSameCauseFailures)
    && task.consecutiveSameCauseFailures >= SAME_CAUSE_FAILURE_LIMIT
    && !["BLOQUÉE", "ÉCHOUÉE", "ANNULÉE"].includes(task.status)
  ) {
    errors.push(
      `${label}: ${SAME_CAUSE_FAILURE_LIMIT} échecs identiques sans blocage`,
    );
  }

  const stringEvidence = Array.isArray(task.evidence)
    ? task.evidence.filter((item) => typeof item === "string" && item.trim())
    : [];
  const recordEvidence = Array.isArray(task.evidenceRecords)
    ? task.evidenceRecords.filter((item) => item && item.result)
    : [];

  if (task.status === "TERMINÉE" && stringEvidence.length === 0 && recordEvidence.length === 0) {
    errors.push(`${label}: preuve absente pour une tâche terminée`);
  }

  if (task.status === "PRÊTE" && task.claim) {
    errors.push(`${label}: une tâche PRÊTE ne peut pas porter de réservation`);
  }

  return errors;
}

export function validateBacklog(data) {
  const errors = [];

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, errors: ["le backlog doit être un objet JSON"] };
  }

  if (data.schemaVersion === SCHEMA_VERSION_V1) {
    return {
      ok: false,
      errors: [
        `schemaVersion attendu ${SCHEMA_VERSION} (fichier encore en ${SCHEMA_VERSION_V1} ; npm run x200:migrate)`,
      ],
    };
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
  if (data.executionMode !== EXECUTION_MODE) {
    errors.push(`executionMode doit valoir ${EXECUTION_MODE}`);
  }
  if (!Number.isInteger(data.registryVersion) || data.registryVersion < 1) {
    errors.push("registryVersion doit être un entier >= 1");
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
    const task = applyTaskDefaults(data.tasks[index], data.project);
    errors.push(...validateTask(task, index));
    if (task && typeof task === "object" && isNonEmptyString(task.id)) {
      if (seen.has(task.id)) {
        errors.push(`ID dupliqué ${task.id}`);
      }
      seen.add(task.id);
    }
  }

  const validTasks = data.tasks
    .map((task) => applyTaskDefaults(task, data.project))
    .filter(
      (task) => task && typeof task === "object" && isAllowedTaskId(task.id) && isStringArray(task.dependencies),
    );

  errors.push(...collectDependencyGraphErrors(validTasks));

  const byId = new Map(validTasks.map((task) => [task.id, task]));
  for (const task of validTasks) {
    if (STATUSES_REQUIRING_COMPLETE_DEPS.includes(task.status)) {
      for (const depId of task.dependencies) {
        const dep = byId.get(depId);
        if (dep && !dependencyIsSatisfied(dep)) {
          errors.push(
            `${task.id}: dépendance ${depId} n'est pas TERMINÉE (état ${dep.status})`,
          );
        }
      }
    }
    if (task.regressionOf && !byId.has(task.regressionOf)) {
      errors.push(`${task.id}: regressionOf ${task.regressionOf} introuvable`);
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

  const riskDelta = RISK_RANK[b.risk] - RISK_RANK[a.risk];
  if (riskDelta !== 0) {
    return riskDelta;
  }

  const unblockDelta =
    countUnblockedDependents(tasks, b.id) - countUnblockedDependents(tasks, a.id);
  if (unblockDelta !== 0) {
    return unblockDelta;
  }

  const costDelta = a.estimatedCost - b.estimatedCost;
  if (costDelta !== 0) {
    return costDelta;
  }

  return parseTaskIdNumber(a.id) - parseTaskIdNumber(b.id);
}

export function listInControlTasks(data) {
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  return tasks.filter((task) => task.status === "EN_CONTRÔLE");
}

export function listReadyTasks(data, options = {}) {
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const includeHuman = Boolean(options.includeHuman);
  const excludeHuman = data.selectionPolicy?.excludeRequiresHuman !== false && !includeHuman;

  return tasks.filter((task) => {
    if (task.status !== SELECTABLE_STATUS) {
      return false;
    }
    if (NON_SELECTABLE_STATUSES.includes(task.status)) {
      return false;
    }
    if (excludeHuman && task.requiresHuman) {
      return false;
    }
    return task.dependencies.every((depId) => dependencyIsSatisfied(byId.get(depId)));
  });
}

export function selectNextTaskResult(data, options = {}) {
  const blockWhenInControl = data.selectionPolicy?.blockWhenInControl !== false
    && !options.ignoreInControl;
  const inControl = listInControlTasks(data);
  if (blockWhenInControl && inControl.length > 0) {
    return {
      task: null,
      reason: "IN_CONTROL_WAIT",
      blocking: inControl.map((task) => task.id),
    };
  }

  const ready = listReadyTasks(data, options);
  if (ready.length === 0) {
    return { task: null, reason: "NO_READY_TASK", blocking: [] };
  }
  const sorted = [...ready].sort((a, b) => compareReadyTasks(a, b, data.tasks));
  return { task: sorted[0], reason: null, blocking: [] };
}

export function selectNextTask(data, options = {}) {
  return selectNextTaskResult(data, options).task;
}

export function isClaimExpired(claim, now = new Date()) {
  if (!claim || !isNonEmptyString(claim.expiresAt)) {
    return true;
  }
  const expires = Date.parse(claim.expiresAt);
  if (Number.isNaN(expires)) {
    return true;
  }
  return expires <= now.getTime();
}

export function claimMatches(claim, { workerId, token } = {}) {
  if (!claim) {
    return false;
  }
  if (token) {
    return claim.token === token;
  }
  if (workerId) {
    return claim.workerId === workerId;
  }
  return false;
}

export function canCompleteWithClaim(task, { workerId, token, now } = {}) {
  if (!task || task.status !== "EN_COURS") {
    return { ok: false, error: "la tâche n'est pas EN_COURS" };
  }
  if (!task.claim) {
    return { ok: false, error: "aucune réservation" };
  }
  if (isClaimExpired(task.claim, now)) {
    return { ok: false, error: "jeton de réservation expiré" };
  }
  if (!claimMatches(task.claim, { workerId, token })) {
    return { ok: false, error: "jeton ou travailleur non reconnus" };
  }
  return { ok: true, error: null };
}

export function canMarkTerminee(task, gate) {
  if (!task) {
    return { ok: false, error: "tâche absente" };
  }
  if (task.status === "BLOQUÉE" || task.status === "ÉCHOUÉE") {
    return { ok: false, error: `tâche ${task.status}` };
  }
  if (task.consecutiveSameCauseFailures >= SAME_CAUSE_FAILURE_LIMIT) {
    return { ok: false, error: "trois échecs identiques" };
  }
  if (!gate || gate.ok !== true) {
    return { ok: false, error: "quality-gate non satisfait" };
  }
  if (gate.taskId && gate.taskId !== task.id) {
    return { ok: false, error: "quality-gate d'une autre tâche" };
  }
  const evidence = Array.isArray(task.evidence) ? task.evidence.filter((item) => item.trim()) : [];
  const records = Array.isArray(task.evidenceRecords) ? task.evidenceRecords : [];
  if (evidence.length === 0 && records.length === 0) {
    return { ok: false, error: "preuves absentes" };
  }
  return { ok: true, error: null };
}

export function applySameCauseFailure(task, cause, now = new Date()) {
  const same = task.lastFailureCause === cause;
  const consecutive = same ? task.consecutiveSameCauseFailures + 1 : 1;
  const blocked = consecutive >= SAME_CAUSE_FAILURE_LIMIT;
  return {
    ...task,
    attempts: task.attempts + 1,
    lastFailureCause: cause,
    consecutiveSameCauseFailures: consecutive,
    status: blocked ? "BLOQUÉE" : task.status,
    blockedReason: blocked ? `trois échecs identiques: ${cause}` : task.blockedReason,
    nextAction: blocked ? "changer de stratégie ; ne pas relancer à l'identique" : task.nextAction,
    lastTransitionReason: blocked
      ? `blocage après ${SAME_CAUSE_FAILURE_LIMIT} échecs identiques`
      : task.lastTransitionReason,
    updatedAt: utcDateStamp(now),
    claim: blocked ? null : task.claim,
  };
}

export function createEvidenceRecord({
  type = "command",
  command = null,
  result,
  exitCode = null,
  reference = null,
  version = null,
  at = utcNow(),
  location = null,
} = {}) {
  return {
    type,
    command,
    result,
    exitCode,
    reference,
    version,
    at,
    location,
  };
}

export function createBacklogDocument(tasks = [], extra = {}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    registryVersion: 1,
    project: "clevones.com",
    repository: "clevonegroup911/clevones.com",
    updatedAt: utcDateStamp(),
    executionMode: EXECUTION_MODE,
    allowedStatuses: [...ALLOWED_STATUSES],
    allowedPriorities: [...ALLOWED_PRIORITIES],
    wipLimits: {
      maxActiveP0: 1,
      maxActiveTasks: 3,
      activeStatuses: ["EN_COURS"],
      neverParallelize: ["migration", "authentication"],
    },
    selectionPolicy: {
      readyStatus: "PRÊTE",
      excludeStatuses: ["BLOQUÉE", "ÉCHOUÉE", "EN_CONTRÔLE", "ANNULÉE"],
      excludeRequiresHuman: true,
      blockWhenInControl: false,
      order: [...DEFAULT_SELECTION_ORDER],
    },
    claimPolicy: {
      leaseSeconds: DEFAULT_LEASE_SECONDS,
      singleExecutor: true,
    },
    nextTaskId: null,
    tasks,
    history: [],
    ...extra,
  };
}

export function createTaskDocument(overrides = {}) {
  return applyTaskDefaults({
    id: "T001",
    title: "Task",
    objective: "Do the work",
    priority: "P1",
    owner: "cursor",
    dependencies: [],
    scope: ["scripts/"],
    acceptanceCriteria: ["done"],
    tests: ["npm run x200:test"],
    status: "À_FAIRE",
    evidence: [],
    estimatedCost: 1,
    risk: "low",
    attempts: 0,
    requiresHuman: false,
    updatedAt: utcDateStamp(),
    ...overrides,
  }, overrides.project || "clevones.com");
}
