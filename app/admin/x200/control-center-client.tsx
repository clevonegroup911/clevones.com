"use client";

import { useMemo, useState } from "react";

import type {
  ActivityItem,
  Blocker,
  ControlCenterSnapshot,
  ControlCenterTask,
  PipelineStep,
  SystemHealth,
} from "@/lib/x200/types";

type FilterId =
  | "all"
  | "en_cours"
  | "pretes"
  | "terminees"
  | "bloquees"
  | "echouees";

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "all", label: "Toutes" },
  { id: "en_cours", label: "En cours" },
  { id: "pretes", label: "Prêtes" },
  { id: "terminees", label: "Terminées" },
  { id: "bloquees", label: "Bloquées" },
  { id: "echouees", label: "Échouées" },
];

function pipelineTone(state: PipelineStep["state"]): string {
  switch (state) {
    case "DONE":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    case "ACTIVE":
      return "border-gold/50 bg-gold/10 text-gold";
    case "FAILED":
      return "border-red-500/40 bg-red-500/10 text-red-300";
    default:
      return "border-border-subtle bg-surface-muted text-gray-muted";
  }
}

function healthTone(status: SystemHealth["status"]): string {
  switch (status) {
    case "HEALTHY":
      return "text-emerald-300";
    case "DEGRADED":
      return "text-gold";
    case "BLOCKED":
      return "text-red-300";
    default:
      return "text-gray-muted";
  }
}

function severityTone(severity: Blocker["severity"]): string {
  switch (severity) {
    case "CRITICAL":
      return "border-red-500/40 text-red-300";
    case "HIGH":
      return "border-orange-500/40 text-orange-300";
    case "WARNING":
      return "border-gold/40 text-gold";
    default:
      return "border-border-subtle text-gray-muted";
  }
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string | null;
}) {
  return (
    <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
      <p className="text-[10px] font-semibold tracking-[0.18em] text-gold-muted uppercase">
        {label}
      </p>
      <p
        className="mt-2 font-heading text-xl text-white"
        title={hint || undefined}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[11px] text-gray-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function Card({
  title,
  children,
  testId,
}: {
  title: string;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <section
      data-testid={testId}
      className="rounded-sm border border-border-subtle bg-surface-elevated p-4 sm:p-5"
    >
      <h2 className="text-[11px] font-semibold tracking-[0.2em] text-gold-muted uppercase">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function display(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export function ControlCenterClient({
  snapshot,
}: {
  snapshot: ControlCenterSnapshot;
}) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [healthOpen, setHealthOpen] = useState(false);

  const tasks = useMemo(() => {
    let list: ControlCenterTask[] = snapshot.backlog.tasks;
    switch (filter) {
      case "en_cours":
        list = list.filter(
          (task) =>
            task.status === "EN_COURS" || task.status === "EN_CONTRÔLE",
        );
        break;
      case "pretes":
        list = list.filter((task) => task.status === "PRÊTE");
        break;
      case "terminees":
        list = list.filter((task) => task.status === "TERMINÉE");
        break;
      case "bloquees":
        list = list.filter((task) => task.status === "BLOQUÉE");
        break;
      case "echouees":
        list = list.filter((task) => task.status === "ÉCHOUÉE");
        break;
      default:
        break;
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (task) =>
          task.id.toLowerCase().includes(q) ||
          task.title.toLowerCase().includes(q),
      );
    }
    return list;
  }, [filter, query, snapshot.backlog.tasks]);

  const current = snapshot.backlog.currentTask;
  const counts = snapshot.backlog.counts;
  const eff = snapshot.efficiency;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-border-subtle pb-6">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-gold uppercase">
          CLEVONE
        </p>
        <h1 className="mt-2 font-heading text-2xl font-semibold text-white sm:text-3xl">
          CLEVONE X200 CONTROL CENTER
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-muted">
          Supervision temps réel du système Multi-AI X200 — lecture seule,
          sources réelles uniquement. Aucune donnée inventée.
        </p>
        <p className="mt-3 text-xs text-navy-muted">
          Last update: {snapshot.lastUpdate} · generatedAt:{" "}
          {snapshot.generatedAt}
        </p>
      </header>

      <div
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        data-testid="x200-overview-cards"
      >
        <Card title="SYSTEM HEALTH" testId="card-system-health">
          <button
            type="button"
            className="text-left"
            onClick={() => setHealthOpen((open) => !open)}
          >
            <p
              className={`font-heading text-2xl font-semibold ${healthTone(snapshot.systemHealth.status)}`}
            >
              {snapshot.systemHealth.status}
            </p>
            <p className="mt-1 text-xs text-gray-muted">
              Score{" "}
              {snapshot.systemHealth.scorePercent === null
                ? "N/A"
                : `${snapshot.systemHealth.scorePercent}%`}{" "}
              · clic pour critères
            </p>
          </button>
          {healthOpen ? (
            <ul className="mt-3 space-y-2 border-t border-border-subtle pt-3 text-xs text-gray-muted">
              {snapshot.systemHealth.criteria.map((criterion) => (
                <li key={criterion.id}>
                  <span className="text-white">
                    {criterion.passed === true
                      ? "✓"
                      : criterion.passed === false
                        ? "✗"
                        : "?"}
                  </span>{" "}
                  {criterion.label} — {criterion.detail}
                </li>
              ))}
              <li className="text-navy-muted">{snapshot.systemHealth.rationale}</li>
            </ul>
          ) : null}
        </Card>

        <Card title="AUTOPLAN" testId="card-autoplan">
          <p className="text-sm text-white">
            Prêtes: {display(counts?.["PRÊTE"])} · À faire:{" "}
            {display(counts?.["À_FAIRE"])}
          </p>
          <p className="mt-2 text-xs text-gray-muted">
            PRODUCT_GOAL hash:{" "}
            {snapshot.productGoal.hash
              ? `${snapshot.productGoal.hash.slice(0, 12)}…`
              : "N/A"}
          </p>
          <p className="mt-1 text-xs text-gray-muted">
            Critères détectés:{" "}
            {display(snapshot.productGoal.detectableCriteriaCount)}
          </p>
        </Card>

        <Card title="CURRENT TASK" testId="card-current-task">
          {current ? (
            <>
              <p className="font-heading text-lg text-white">{current.id}</p>
              <p className="mt-1 text-sm text-gray-muted">{current.title}</p>
              <p className="mt-2 text-xs text-gold-muted">
                {current.status} · {current.priority}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-muted">Aucune tâche EN_COURS / EN_CONTRÔLE</p>
          )}
        </Card>

        <Card title="ACTIVE AGENT" testId="card-active-agent">
          <p className="text-sm text-white">
            {current?.claimWorkerId ?? "WAITING_FOR_TELEMETRY"}
          </p>
          <p className="mt-2 text-xs text-gray-muted">
            FEDORA TELEMETRY = {snapshot.fedora.fedoraTelemetry}
          </p>
          <p className="mt-1 text-xs text-gray-muted">
            AUTOPILOT LIVE STATE = {snapshot.fedora.autopilotLiveState}
          </p>
        </Card>

        <Card title="CI STATUS" testId="card-ci-status">
          <p className="text-sm text-white">
            {snapshot.github.ciLatestConclusion ??
              snapshot.github.ciLatestStatus ??
              "UNKNOWN"}
          </p>
          <p className="mt-2 text-xs text-gray-muted">
            Run #{display(snapshot.github.ciLatestRunNumber)} ·{" "}
            {display(snapshot.github.ciLatestName)}
          </p>
          <p className="mt-1 text-xs text-gray-muted">
            source={snapshot.sources.github}
          </p>
        </Card>

        <Card title="HUMAN GATE" testId="card-human-gate">
          {snapshot.humanGate.present ? (
            <>
              <p className="text-sm text-red-300">ACTIVE</p>
              <p className="mt-2 text-xs text-gray-muted">
                {snapshot.humanGate.reason ?? "N/A"}
              </p>
              <p className="mt-1 text-xs text-gray-muted">
                task={display(snapshot.humanGate.taskId)}
              </p>
            </>
          ) : (
            <p className="text-sm text-emerald-300">ABSENT</p>
          )}
        </Card>

        <Card title="WORKTREE" testId="card-worktree">
          <p className="text-sm text-white">
            {display(snapshot.git.branch)} @{" "}
            {snapshot.git.head ? snapshot.git.head.slice(0, 7) : "UNKNOWN"}
          </p>
          <p className="mt-2 text-xs text-gray-muted">
            dirty=
            {snapshot.git.dirty === null
              ? "UNKNOWN"
              : snapshot.git.dirty
                ? `true (${snapshot.git.dirtyFileCount})`
                : "false"}
          </p>
        </Card>

        <Card title="LAST UPDATE" testId="card-last-update">
          <p className="text-sm text-white">{snapshot.lastUpdate}</p>
          <p className="mt-2 text-xs text-gray-muted">
            sources: backlog={snapshot.sources.backlog}, git=
            {snapshot.sources.git}, github={snapshot.sources.github}, fedora=
            {snapshot.sources.fedoraTelemetry}
          </p>
        </Card>
      </div>

      <Card title="PIPELINE" testId="x200-pipeline">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {snapshot.pipeline.map((step) => (
            <div
              key={step.id}
              className={`rounded-sm border px-2 py-3 text-center ${pipelineTone(step.state)}`}
              title={step.detail}
            >
              <p className="text-[10px] font-semibold tracking-wide">{step.id}</p>
              <p className="mt-1 text-xs">{step.state}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Tâche actuelle" testId="x200-current-task-panel">
          {current ? (
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="text-xs text-gold-muted">ID</dt>
                <dd className="text-white">{current.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">Titre</dt>
                <dd className="text-white">{current.title}</dd>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">Objectif</dt>
                <dd className="text-gray-muted">{current.objective || "N/A"}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-gold-muted">Statut</dt>
                  <dd className="text-white">{current.status}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gold-muted">Priorité</dt>
                  <dd className="text-white">{current.priority}</dd>
                </div>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">Dépendances</dt>
                <dd className="text-white">
                  {current.dependencies.length
                    ? current.dependencies.join(", ")
                    : "aucune"}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-gold-muted">Attempts</dt>
                  <dd className="text-white">{current.attempts}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gold-muted">requiresHuman</dt>
                  <dd className="text-white">{String(current.requiresHuman)}</dd>
                </div>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">nextAction</dt>
                <dd className="text-gray-muted">{display(current.nextAction)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">Evidence</dt>
                <dd className="text-gray-muted">
                  {current.evidenceCount > 0
                    ? current.evidence.slice(0, 4).join(" · ")
                    : "N/A"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">Début / durée / ETA</dt>
                <dd className="text-gray-muted">
                  updatedAt={display(current.updatedAt)} · durée=N/A · ETA=N/A
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-muted">N/A</p>
          )}
        </Card>

        <Card title="Blockers & risques" testId="x200-blockers">
          {snapshot.blockers.length === 0 ? (
            <p className="text-sm text-gray-muted">Aucun blocker dérivé</p>
          ) : (
            <ul className="space-y-2">
              {snapshot.blockers.map((blocker) => (
                <li
                  key={blocker.id}
                  className={`rounded-sm border px-3 py-2 text-sm ${severityTone(blocker.severity)}`}
                >
                  <p className="font-medium">
                    [{blocker.severity}] {blocker.title}
                  </p>
                  <p className="mt-1 text-xs opacity-80">{blocker.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Registre des tâches" testId="x200-task-registry">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-sm border px-2.5 py-1 text-xs ${
                  filter === item.id
                    ? "border-gold/50 bg-gold/10 text-gold"
                    : "border-border-subtle text-gold-muted hover:text-gold"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Recherche ID / titre"
            className="w-full rounded-sm border border-border-subtle bg-surface px-3 py-2 text-sm text-white placeholder:text-navy-muted sm:max-w-xs"
            aria-label="Recherche tâches"
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead className="text-[10px] tracking-wide text-gold-muted uppercase">
              <tr className="border-b border-border-subtle">
                <th className="px-2 py-2">ID</th>
                <th className="px-2 py-2">Statut</th>
                <th className="px-2 py-2">Priorité</th>
                <th className="px-2 py-2">Dépendances</th>
                <th className="px-2 py-2">Titre</th>
                <th className="px-2 py-2">Attempts</th>
                <th className="px-2 py-2">Human Gate</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-border-subtle/70 text-gray-muted"
                >
                  <td className="px-2 py-2 text-white">{task.id}</td>
                  <td className="px-2 py-2">{task.status}</td>
                  <td className="px-2 py-2">{task.priority}</td>
                  <td className="px-2 py-2">
                    {task.dependencies.join(", ") || "—"}
                  </td>
                  <td className="px-2 py-2 text-white">{task.title}</td>
                  <td className="px-2 py-2">{task.attempts}</td>
                  <td className="px-2 py-2">
                    {task.requiresHuman ? "required" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 ? (
            <p className="mt-3 text-sm text-gray-muted">Aucun résultat</p>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Efficacité & temps" testId="x200-efficiency">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Terminées" value={String(eff.completedTasks)} />
            <Metric
              label="Taux de réussite"
              value={
                eff.successRatePercent === null
                  ? "N/A"
                  : `${eff.successRatePercent}%`
              }
              hint={
                eff.successRatePercent === null
                  ? "Donnée insuffisante"
                  : "completed / (completed + failed)"
              }
            />
            <Metric label="Attempts total" value={String(eff.totalAttempts)} />
            <Metric label="Bloquées" value={String(eff.blockedTasks)} />
            <Metric label="Échouées" value={String(eff.failedTasks)} />
            <Metric
              label="Attempts moyens (TERMINÉE)"
              value={
                eff.averageAttemptsOnCompleted === null
                  ? "N/A"
                  : String(eff.averageAttemptsOnCompleted)
              }
              hint={
                eff.averageAttemptsOnCompleted === null
                  ? "Donnée insuffisante"
                  : null
              }
            />
            <Metric
              label="Cycle moyen (jours)"
              value={
                eff.averageCycleDays === null
                  ? "N/A"
                  : String(eff.averageCycleDays)
              }
              hint={
                eff.averageCycleDays === null
                  ? "Donnée insuffisante"
                  : "EN_COURS→TERMINÉE datés"
              }
            />
            <Metric
              label="Attente humaine"
              value={eff.humanWaitHint ?? "N/A"}
            />
          </div>
        </Card>

        <Card title="Activité récente" testId="x200-activity">
          <ul className="max-h-96 space-y-2 overflow-y-auto">
            {snapshot.activity.map((item: ActivityItem) => (
              <li
                key={item.id}
                className="border-b border-border-subtle/60 pb-2 text-xs"
              >
                <p className="text-gold-muted">
                  [{item.kind}] {item.at}
                </p>
                <p className="text-white">{item.title}</p>
                <p className="text-gray-muted">{item.detail}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Qui fait quoi / comment / quand" testId="x200-roles">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {snapshot.roles.map((role) => (
            <div
              key={role.id}
              className="rounded-sm border border-border-subtle bg-surface p-3"
            >
              <p className="text-sm font-medium text-white">{role.name}</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-gray-muted">
                {role.responsibilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card title="PRODUCT_COMPLETE / GitHub / warnings" testId="x200-meta">
        <div className="grid gap-3 text-xs text-gray-muted sm:grid-cols-3">
          <div>
            <p className="text-gold-muted">PRODUCT_COMPLETE</p>
            <p className="mt-1 text-white">
              {snapshot.productComplete.present ? "present" : "absent"}
            </p>
            <p>
              matchesHead=
              {display(snapshot.productComplete.matchesCurrentHead)}
            </p>
            <p>
              matchesGoal=
              {display(snapshot.productComplete.matchesCurrentGoalHash)}
            </p>
          </div>
          <div>
            <p className="text-gold-muted">GitHub PR</p>
            <p className="mt-1 text-white">
              #{display(snapshot.github.prNumber)} ·{" "}
              {display(snapshot.github.prState)}
            </p>
            <p>draft={display(snapshot.github.prDraft)}</p>
            <p>mergeable={display(snapshot.github.prMergeable)}</p>
          </div>
          <div>
            <p className="text-gold-muted">Warnings</p>
            {snapshot.warnings.length === 0 ? (
              <p className="mt-1">aucune</p>
            ) : (
              <ul className="mt-1 list-disc pl-4">
                {snapshot.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
