import { ALLOWED_STATUSES, isAllowedTaskId } from "./x100-backlog.mjs";

export const REPORT_MARKER = "[X100-CURSOR]";
export const REPORT_MARKER_X200 = "[X200-CURSOR]";
export const REPORT_MARKERS = Object.freeze([REPORT_MARKER, REPORT_MARKER_X200]);

export const REQUIRED_REPORT_SECTIONS = Object.freeze([
  "ID",
  "Statut",
  "Objectif",
  "Résultat",
  "Fichiers créés",
  "Fichiers modifiés",
  "Commandes",
  "Tests réussis",
  "Tests échoués",
  "Lint",
  "Type-check",
  "Build",
  "Sécurité",
  "Commit",
  "Pull Request",
  "Preuves",
  "Risques",
  "Blocage",
  "Prochaine tâche prête",
]);

const EMPTY_EVIDENCE = /^(aucun|none|n\/a|na|-|—)?$/i;

export function parseMarkdownSections(markdown) {
  const sections = new Map();
  const lines = markdown.split(/\r?\n/);
  let current = null;
  let buffer = [];

  const flush = () => {
    if (current) {
      sections.set(current, buffer.join("\n").trim());
    }
  };

  for (const line of lines) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      flush();
      current = heading[1].trim();
      buffer = [];
      continue;
    }
    buffer.push(line);
  }
  flush();
  return sections;
}

export function parseTaskReport(markdown) {
  const sections = parseMarkdownSections(markdown);
  const id = (sections.get("ID") || "").trim();
  const status = (sections.get("Statut") || "").trim();
  return { sections, id, status };
}

export function validateTaskReport(markdown, backlog) {
  const errors = [];

  if (typeof markdown !== "string" || markdown.trim().length === 0) {
    return { ok: false, errors: ["rapport vide"] };
  }

  const hasMarker = REPORT_MARKERS.some((marker) => markdown.includes(marker));
  if (!hasMarker) {
    errors.push(`marqueur ${REPORT_MARKER} ou ${REPORT_MARKER_X200} absent`);
  }

  const { sections, id, status } = parseTaskReport(markdown);

  for (const name of REQUIRED_REPORT_SECTIONS) {
    if (!sections.has(name)) {
      errors.push(`section obligatoire absente (${name})`);
    }
  }

  if (!isAllowedTaskId(id)) {
    errors.push(`ID de rapport invalide (${id || "vide"})`);
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    errors.push(`statut de rapport non autorisé (${status || "vide"})`);
  }

  if (backlog && Array.isArray(backlog.tasks)) {
    const task = backlog.tasks.find((item) => item.id === id);
    if (!task) {
      errors.push(`le rapport ${id} n'existe pas dans le backlog`);
    } else if (task.status !== status) {
      errors.push(
        `incohérence rapport/backlog: ${id} rapport=${status} backlog=${task.status}`,
      );
    }
  }

  if (status === "TERMINÉE") {
    const evidence = (sections.get("Preuves") || "").trim();
    if (!evidence || EMPTY_EVIDENCE.test(evidence)) {
      errors.push("preuve requise pour une tâche TERMINÉE");
    }
  }

  return { ok: errors.length === 0, errors };
}
