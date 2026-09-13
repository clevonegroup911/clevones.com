"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  ActivityItem,
  Blocker,
  ControlActionId,
  ControlCenterSnapshot,
  ControlCenterTask,
  PipelineStep,
  SystemHealth,
} from "@/lib/x200/types";
import {
  HumanActionPanels,
  X200TabBar,
  type TabId,
} from "@/app/admin/x200/human-action-panels";
import {
  AutopilotLivePanel,
  CommandPalette,
  GlobalCommandCenter,
  HumanDecisionCenter,
  NextSafeActionBanner,
  OperationalMirrorPanels,
} from "@/app/admin/x200/operational-mirror-panels";

type FilterId =
  | "all"
  | "en_cours"
  | "pretes"
  | "terminees"
  | "bloquees"
  | "echouees";

type RefreshInterval = 5 | 15 | 30 | 0;

type ConnectionStatus = "LIVE" | "IDLE" | "DEGRADED" | "HIDDEN";

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "all", label: "Toutes" },
  { id: "en_cours", label: "En cours" },
  { id: "pretes", label: "Prêtes" },
  { id: "terminees", label: "Terminées" },
  { id: "bloquees", label: "Bloquées" },
  { id: "echouees", label: "Échouées" },
];

const ACTION_LABELS: Record<ControlActionId, string> = {
  AUTOPILOT_START: "▶ Start AUTOPILOT",
  AUTOPILOT_STOP: "■ Stop AUTOPILOT",
  AUTOPILOT_RESTART: "↻ Restart AUTOPILOT",
  RUN_ONE_CYCLE: "⚡ Run one safe cycle",
};

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

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // ignore clipboard failures in locked-down contexts
  }
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded-sm border border-border-subtle px-2.5 py-1.5 text-xs text-gold hover:border-gold/50"
    >
      {children}
    </a>
  );
}

export function ControlCenterClient({
  snapshot: initialSnapshot,
  actorRole,
}: {
  snapshot: ControlCenterSnapshot;
  actorRole: "SUPER_ADMIN" | "ADMIN";
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [healthOpen, setHealthOpen] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(15);
  const [connection, setConnection] = useState<ConnectionStatus>("LIVE");
  const [lastRefreshAt, setLastRefreshAt] = useState(() => Date.now());
  const [nextRefreshAt, setNextRefreshAt] = useState<number | null>(
    () => Date.now() + 15_000,
  );
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<ControlCenterTask | null>(
    null,
  );
  const [selectedPipeline, setSelectedPipeline] =
    useState<PipelineStep | null>(null);
  const [confirmAction, setConfirmAction] = useState<ControlActionId | null>(
    null,
  );
  const [actionBusy, setActionBusy] = useState(false);
  const [actionResult, setActionResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState<TabId>("OVERVIEW");
  const [paletteOpen, setPaletteOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

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

  const refresh = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      setConnection("HIDDEN");
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const started = performance.now();
    try {
      const response = await fetch("/api/admin/x200/status", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      const elapsed = Math.round(performance.now() - started);
      setLatencyMs(elapsed);
      if (!response.ok) {
        setConnection("DEGRADED");
        return;
      }
      const body = (await response.json()) as ControlCenterSnapshot;
      if (!body || typeof body.generatedAt !== "string" || !body.sources) {
        setConnection("DEGRADED");
        return;
      }
      setSnapshot(body);
      setLastRefreshAt(Date.now());
      setConnection("LIVE");
    } catch (error) {
      if ((error as { name?: string })?.name === "AbortError") return;
      // Keep last valid snapshot — never destroy it on failure.
      setConnection("DEGRADED");
    }
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (event.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      } else {
        abortRef.current?.abort();
        setConnection("HIDDEN");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [refresh]);

  useEffect(() => {
    const tick = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (refreshInterval === 0) {
      return;
    }
    const id = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      setNextRefreshAt(Date.now() + refreshInterval * 1000);
      void refresh();
    }, refreshInterval * 1000);
    return () => window.clearInterval(id);
  }, [refreshInterval, refresh]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const runAction = useCallback(
    async (action: ControlActionId) => {
      setActionBusy(true);
      setActionResult(null);
      try {
        const response = await fetch("/api/admin/x200/actions", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ action }),
        });
        const body = (await response.json()) as {
          ok?: boolean;
          message?: string;
          code?: string;
        };
        setActionResult({
          ok: response.ok && body.ok === true,
          message: body.message ?? body.code ?? `HTTP ${response.status}`,
        });
        await refresh();
      } catch (error) {
        setActionResult({
          ok: false,
          message: error instanceof Error ? error.message : "Request failed",
        });
      } finally {
        setActionBusy(false);
        setConfirmAction(null);
      }
    },
    [refresh],
  );

  const current = snapshot.backlog.currentTask;
  const eff = snapshot.efficiency;
  const control = snapshot.control;
  const progress = snapshot.progress;
  const repo = snapshot.github.repository || "clevonegroup911/clevones.com";
  const actionsUrl = `https://github.com/${repo}/actions`;
  const commitUrl = snapshot.git.head
    ? `https://github.com/${repo}/commit/${snapshot.git.head}`
    : null;

  const effectiveNextRefreshAt =
    refreshInterval === 0 ? null : nextRefreshAt;
  const nextRefreshLabel =
    effectiveNextRefreshAt == null
      ? "Off"
      : `${Math.max(0, Math.ceil((effectiveNextRefreshAt - nowTick) / 1000))}s`;
  const connectionDisplay =
    refreshInterval === 0 && connection !== "HIDDEN" && connection !== "DEGRADED"
      ? "IDLE"
      : connection;
  const isActionEnabled = (action: ControlActionId) =>
    actorRole === "SUPER_ADMIN" &&
    control.canMutate &&
    !control.disabledReasons[action] &&
    !actionBusy;

  const actionTitle = (action: ControlActionId) =>
    control.disabledReasons[action] ??
    (actorRole !== "SUPER_ADMIN"
      ? "ADMIN read-only"
      : ACTION_LABELS[action]);

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
          Operational mirror + universal action console — Human Gates protégés,
          aucune commande shell libre. Ctrl+K pour la palette.
        </p>

        <div
          className="mt-4 flex flex-col gap-3 rounded-sm border border-border-subtle bg-surface-elevated p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
          data-testid="x200-live-bar"
        >
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span
              data-testid="x200-live-indicator"
              className={
                connectionDisplay === "DEGRADED"
                  ? "font-semibold text-gold"
                  : connectionDisplay === "LIVE"
                    ? "font-semibold text-emerald-300"
                    : "font-semibold text-gray-muted"
              }
            >
              {connectionDisplay === "DEGRADED"
                ? "CONNECTION DEGRADED"
                : `LIVE ●`}
            </span>
            <span className="text-gray-muted">
              Last refresh: {new Date(lastRefreshAt).toLocaleTimeString()}
            </span>
            <span className="text-gray-muted">Next: {nextRefreshLabel}</span>
            <span className="text-gray-muted">
              Latency: {latencyMs == null ? "N/A" : `${latencyMs} ms`}
            </span>
            <span className="text-gray-muted">Status: {connectionDisplay}</span>
            <span className="text-gray-muted">
              env=LOCAL · branch={display(snapshot.git.branch)} · HEAD=
              {display(snapshot.git.head?.slice(0, 7))} · health=
              {snapshot.systemHealth.status}
              {snapshot.humanGate.present ? " · GATE" : ""}
            </span>
            <span data-testid="x200-csrf-chip" className="text-gray-muted">
              CSRF: {snapshot.humanActions?.csrf.status ?? "N/A"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="x200-refresh-now"
              onClick={() => {
                setNextRefreshAt(
                  refreshInterval === 0
                    ? null
                    : Date.now() + refreshInterval * 1000,
                );
                void refresh();
              }}
              className="rounded-sm border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-gold"
            >
              ⟳ Refresh now
            </button>
            <label className="flex items-center gap-2 text-xs text-gray-muted">
              Auto refresh
              <select
                data-testid="x200-auto-refresh"
                value={refreshInterval}
                onChange={(event) => {
                  const value = Number(event.target.value) as RefreshInterval;
                  setRefreshInterval(value);
                  setNextRefreshAt(
                    value === 0 ? null : Date.now() + value * 1000,
                  );
                }}
                className="rounded-sm border border-border-subtle bg-surface px-2 py-1.5 text-white"
              >
                <option value={5}>5 sec</option>
                <option value={15}>15 sec</option>
                <option value={30}>30 sec</option>
                <option value={0}>Off</option>
              </select>
            </label>
          </div>
        </div>
      </header>

      <X200TabBar active={activeTab} onChange={setActiveTab} />

      <NextSafeActionBanner snapshot={snapshot} />

      {activeTab === "OVERVIEW" ? (
        <GlobalCommandCenter snapshot={snapshot} />
      ) : null}

      {snapshot.humanGate.present ? (
        <div
          data-testid="x200-human-gate-banner"
          className="rounded-sm border border-red-500/50 bg-gradient-to-r from-red-950/80 to-amber-950/60 p-4"
        >
          <p className="text-sm font-semibold tracking-wide text-red-200 uppercase">
            HUMAN APPROVAL REQUIRED
          </p>
          <p className="mt-2 text-sm text-amber-100">
            {snapshot.humanGate.reason ?? "N/A"}
          </p>
          <p className="mt-1 text-xs text-amber-100/80">
            task={display(snapshot.humanGate.taskId)} · requiredAction=
            {display(snapshot.humanGate.requiredAction)}
          </p>
          {snapshot.humanGate.blocking.length > 0 ? (
            <ul className="mt-2 list-disc pl-5 text-xs text-amber-100/80">
              {snapshot.humanGate.blocking.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            className="mt-3 rounded-sm border border-amber-400/40 px-3 py-2 text-xs text-amber-100"
            onClick={() =>
              void copyText(
                snapshot.humanGate.requiredAction ??
                  snapshot.humanGate.reason ??
                  "HUMAN_GATE",
              )
            }
          >
            Copy required action
          </button>
        </div>
      ) : null}

      {(
        [
          "HUMAN_ACTIONS",
          "RELEASE",
          "DEPLOY",
          "DATABASE",
          "INCIDENTS",
          "AUDIT",
        ] as TabId[]
      ).includes(activeTab) ? (
        <HumanActionPanels
          snapshot={snapshot}
          actorRole={actorRole}
          activeTab={activeTab}
          onRefresh={() => void refresh()}
        />
      ) : null}

      {(
        [
          "SOURCES",
          "GITHUB",
          "CI",
          "CHANGES",
          "OPERATOR",
          "LOGS",
          "NOTIFICATIONS",
          "ERRORS",
        ] as TabId[]
      ).includes(activeTab) ? (
        <OperationalMirrorPanels
          snapshot={snapshot}
          activeTab={activeTab}
          onRefresh={() => void refresh()}
          onOpenTab={(tab) => setActiveTab(tab as TabId)}
        />
      ) : null}

      {activeTab === "OVERVIEW" || activeTab === "HUMAN_ACTIONS" ? (
        <HumanDecisionCenter snapshot={snapshot} />
      ) : null}

      {activeTab === "AUTOMATION" || activeTab === "OVERVIEW" ? (
        <AutopilotLivePanel snapshot={snapshot} />
      ) : null}

      {activeTab === "AUTOMATION" || activeTab === "OVERVIEW" ? (
      <Card title="COMMAND CENTER" testId="x200-command-center">
        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
          <span data-testid="x200-control-mode" className="text-white">
            CONTROL MODE = {control.mode}
          </span>
          <span className="text-gray-muted">role={actorRole}</span>
          <span className="text-gray-muted">
            actionsEnabled={String(control.actionsEnabled)}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(ACTION_LABELS) as ControlActionId[]).map((action) => {
            const enabled = isActionEnabled(action);
            return (
              <button
                key={action}
                type="button"
                data-testid={`x200-action-${action}`}
                disabled={!enabled}
                title={actionTitle(action)}
                onClick={() => setConfirmAction(action)}
                className={`min-h-12 rounded-sm border px-3 py-3 text-left text-sm ${
                  enabled
                    ? "border-gold/50 bg-gold/10 text-gold hover:bg-gold/20"
                    : "cursor-not-allowed border-border-subtle text-gray-muted opacity-60"
                }`}
              >
                {ACTION_LABELS[action]}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => void refresh()}
            className="min-h-12 rounded-sm border border-border-subtle px-3 py-3 text-left text-sm text-white"
          >
            ⟳ Refresh now
          </button>
          <div className="min-h-12 rounded-sm border border-border-subtle px-3 py-3 text-sm text-gray-muted">
            MERGE
            <p className="mt-1 text-xs">Human approval required</p>
          </div>
          <div className="min-h-12 rounded-sm border border-border-subtle px-3 py-3 text-sm text-gray-muted">
            DEPLOY
            <p className="mt-1 text-xs">Human approval required</p>
          </div>
        </div>
        {actionResult ? (
          <p
            data-testid="x200-action-result"
            className={`mt-3 text-sm ${actionResult.ok ? "text-emerald-300" : "text-red-300"}`}
          >
            {actionResult.ok ? "SUCCESS" : "FAILED"} — {actionResult.message}
          </p>
        ) : null}
        {actionBusy ? (
          <p className="mt-2 text-xs text-gold" data-testid="x200-action-spinner">
            Action en cours…
          </p>
        ) : null}
      </Card>
      ) : null}

      {activeTab === "OVERVIEW" ? (
      <>
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

        <Card title="PROJECT PROGRESS" testId="card-project-progress">
          <p className="font-heading text-xl text-white">
            {progress.completed != null && progress.total != null
              ? `${progress.completed} / ${progress.total} completed`
              : "N/A"}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-sm bg-surface">
            <div
              className="h-full bg-gold/70"
              style={{
                width: `${Math.min(100, Math.max(0, progress.percent ?? 0))}%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-muted">
            Heartbeat: {display(progress.heartbeatAge)}
          </p>
          <p className="mt-1 text-xs text-gray-muted">
            Success {display(progress.successRatePercent)}
            {progress.successRatePercent != null ? "%" : ""} · Blocked{" "}
            {display(progress.blocked)} · Failed {display(progress.failed)}
          </p>
          <p className="mt-1 text-xs text-gray-muted">
            Avg attempts {display(progress.averageAttempts)} · Cycle{" "}
            {display(progress.currentCycleDuration)} · CI{" "}
            {display(progress.ciDuration)}
          </p>
        </Card>

        <Card title="CURRENT TASK" testId="card-current-task">
          {current ? (
            <button
              type="button"
              className="text-left"
              onClick={() => setSelectedTask(current)}
            >
              <p className="font-heading text-lg text-white">{current.id}</p>
              <p className="mt-1 text-sm text-gray-muted">{current.title}</p>
              <p className="mt-2 text-xs text-gold-muted">
                {current.status} · {current.priority}
              </p>
            </button>
          ) : (
            <p className="text-sm text-gray-muted">Aucune tâche EN_COURS / EN_CONTRÔLE</p>
          )}
        </Card>

        <Card title="ACTIVE AGENT" testId="card-active-agent">
          <p className="text-sm text-white">
            host={display(snapshot.fedora.host)} · pid=
            {display(snapshot.fedora.pid)}
          </p>
          <p className="mt-1 text-xs text-gray-muted">
            mode={display(snapshot.fedora.mode)} · agentRunning=
            {display(snapshot.fedora.agentRunning)}
          </p>
          <p className="mt-1 text-xs text-gray-muted">
            Heartbeat: {display(progress.heartbeatAge)}
          </p>
          <p className="mt-1 text-xs text-gray-muted">
            lastEvent={display(snapshot.fedora.lastEvent)}
            {snapshot.fedora.taskId ? ` · task=${snapshot.fedora.taskId}` : ""}
          </p>
          <p className="mt-1 text-xs text-gray-muted">
            branch={display(snapshot.fedora.branch)} · HEAD=
            {snapshot.fedora.head
              ? snapshot.fedora.head.slice(0, 7)
              : snapshot.git.head
                ? snapshot.git.head.slice(0, 7)
                : "N/A"}
          </p>
          <p className="mt-1 text-xs text-gray-muted">
            FEDORA={snapshot.fedora.fedoraTelemetry} · LIVE=
            {snapshot.fedora.autopilotLiveState}
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
          <div className="mt-3 flex flex-wrap gap-2">
            <ExternalLink href={actionsUrl}>Open GitHub Actions</ExternalLink>
            {snapshot.github.ciLatestUrl ? (
              <ExternalLink href={snapshot.github.ciLatestUrl}>
                Open latest run
              </ExternalLink>
            ) : null}
          </div>
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
          <div className="mt-3 flex flex-wrap gap-2">
            {snapshot.github.prUrl ? (
              <ExternalLink href={snapshot.github.prUrl}>
                Open PR #{display(snapshot.github.prNumber)}
              </ExternalLink>
            ) : null}
            {commitUrl ? (
              <ExternalLink href={commitUrl}>Open commit</ExternalLink>
            ) : null}
          </div>
        </Card>

        <Card title="CONTROL MODE" testId="card-control-mode">
          <p className="font-heading text-xl text-white">{control.mode}</p>
          <p className="mt-2 text-xs text-gray-muted">
            localExecutor={String(control.localExecutorAvailable)} · canMutate=
            {String(control.canMutate)}
          </p>
        </Card>
      </div>

      <Card title="PIPELINE" testId="x200-pipeline">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {snapshot.pipeline.map((step) => (
            <button
              key={step.id}
              type="button"
              data-testid={`x200-pipeline-${step.id}`}
              onClick={() => setSelectedPipeline(step)}
              className={`rounded-sm border px-2 py-3 text-center ${pipelineTone(step.state)}`}
              title={step.detail}
            >
              <p className="text-[10px] font-semibold tracking-wide">{step.id}</p>
              <p className="mt-1 text-xs">{step.state}</p>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Tâche actuelle" testId="x200-current-task-panel">
          {current ? (
            <button
              type="button"
              className="w-full text-left"
              onClick={() => setSelectedTask(current)}
            >
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
              </dl>
            </button>
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
      </>
      ) : null}

      {activeTab === "TASKS" || activeTab === "OVERVIEW" ? (
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
                  data-testid={`x200-task-row-${task.id}`}
                  className="cursor-pointer border-b border-border-subtle/70 text-gray-muted hover:bg-surface"
                  onClick={() => setSelectedTask(task)}
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
      ) : null}

      {activeTab === "OVERVIEW" || activeTab === "AUTOMATION" ? (
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
            />
          </div>
        </Card>

        <Card title="ACTION HISTORY" testId="x200-action-history">
          {control.recentActions.length === 0 ? (
            <p className="text-sm text-gray-muted">Aucune action enregistrée</p>
          ) : (
            <ul className="max-h-96 space-y-2 overflow-y-auto text-xs">
              {control.recentActions.map((item, index) => (
                <li
                  key={`${item.timestamp}-${item.action}-${index}`}
                  className="border-b border-border-subtle/60 pb-2"
                >
                  <p className="text-gold-muted">{item.timestamp}</p>
                  <p className="text-white">
                    {item.action} · {item.result} · {item.durationMs}ms
                  </p>
                  <p className="text-gray-muted">
                    {item.actor} · {item.code ?? "N/A"} · {item.detail ?? ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      ) : null}

      {activeTab === "OVERVIEW" ? (
      <>
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
          </div>
          <div>
            <p className="text-gold-muted">GitHub PR</p>
            <p className="mt-1 text-white">
              #{display(snapshot.github.prNumber)} ·{" "}
              {display(snapshot.github.prState)}
            </p>
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
      </>
      ) : null}

      {selectedTask ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
          data-testid="x200-task-drawer"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-sm border border-border-subtle bg-surface-elevated p-4 sm:rounded-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gold-muted">{selectedTask.id}</p>
                <h3 className="mt-1 font-heading text-xl text-white">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                type="button"
                className="rounded-sm border border-border-subtle px-2 py-1 text-xs text-gray-muted"
                onClick={() => setSelectedTask(null)}
              >
                Close
              </button>
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-xs text-gold-muted">Objectif</dt>
                <dd className="text-gray-muted">{display(selectedTask.objective)}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-gold-muted">Statut</dt>
                  <dd className="text-white">{selectedTask.status}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gold-muted">Priorité</dt>
                  <dd className="text-white">{selectedTask.priority}</dd>
                </div>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">Dependencies</dt>
                <dd className="text-white">
                  {selectedTask.dependencies.join(", ") || "aucune"}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-gold-muted">Attempts</dt>
                  <dd className="text-white">{selectedTask.attempts}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gold-muted">Owner</dt>
                  <dd className="text-white">{display(selectedTask.owner)}</dd>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-gold-muted">requiresHuman</dt>
                  <dd className="text-white">
                    {String(selectedTask.requiresHuman)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gold-muted">updatedAt</dt>
                  <dd className="text-white">{display(selectedTask.updatedAt)}</dd>
                </div>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">Claim worker / expiry</dt>
                <dd className="text-white">
                  {display(selectedTask.claimWorkerId)} ·{" "}
                  {display(selectedTask.claimExpiresAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">nextAction</dt>
                <dd className="text-gray-muted">{display(selectedTask.nextAction)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">blockedReason</dt>
                <dd className="text-gray-muted">
                  {display(selectedTask.blockedReason)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">transition reason</dt>
                <dd className="text-gray-muted">
                  {display(selectedTask.lastTransitionReason)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">Evidence</dt>
                <dd className="whitespace-pre-wrap text-gray-muted">
                  {selectedTask.evidence.length
                    ? selectedTask.evidence.join("\n")
                    : "N/A"}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-sm border border-border-subtle px-3 py-2 text-xs text-gold"
                onClick={() => void copyText(selectedTask.id)}
              >
                Copy task ID
              </button>
              <button
                type="button"
                className="rounded-sm border border-border-subtle px-3 py-2 text-xs text-gold"
                onClick={() =>
                  void copyText(selectedTask.evidence.join("\n") || "N/A")
                }
              >
                Copy evidence
              </button>
              {snapshot.github.ciLatestUrl ? (
                <ExternalLink href={snapshot.github.ciLatestUrl}>
                  Open related CI
                </ExternalLink>
              ) : null}
              {snapshot.github.prUrl ? (
                <ExternalLink href={snapshot.github.prUrl}>
                  Open related PR
                </ExternalLink>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {selectedPipeline ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
          data-testid="x200-pipeline-drawer"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg overflow-y-auto rounded-t-sm border border-border-subtle bg-surface-elevated p-4 sm:rounded-sm sm:p-6">
            <div className="flex items-start justify-between">
              <h3 className="font-heading text-xl text-white">
                {selectedPipeline.id}
              </h3>
              <button
                type="button"
                className="rounded-sm border border-border-subtle px-2 py-1 text-xs text-gray-muted"
                onClick={() => setSelectedPipeline(null)}
              >
                Close
              </button>
            </div>
            <dl className="mt-4 grid gap-2 text-sm">
              <div>
                <dt className="text-xs text-gold-muted">state</dt>
                <dd className="text-white">{selectedPipeline.state}</dd>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">source</dt>
                <dd className="text-white">{selectedPipeline.source}</dd>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">evidence</dt>
                <dd className="text-gray-muted">
                  {display(selectedPipeline.evidence)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">timestamp</dt>
                <dd className="text-gray-muted">
                  {display(selectedPipeline.timestamp)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">reason</dt>
                <dd className="text-gray-muted">
                  {display(selectedPipeline.reason)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">related commit</dt>
                <dd className="text-gray-muted">
                  {display(selectedPipeline.relatedCommit)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">related CI</dt>
                <dd className="text-gray-muted">
                  {display(selectedPipeline.relatedCiUrl)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gold-muted">detail</dt>
                <dd className="text-gray-muted">{selectedPipeline.detail}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}

      {confirmAction ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          data-testid="x200-confirm-modal"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-sm border border-border-subtle bg-surface-elevated p-5">
            <h3 className="font-heading text-lg text-white">Confirm action</h3>
            <p className="mt-2 text-sm text-gray-muted">
              Exécuter {ACTION_LABELS[confirmAction]} ? Aucun merge, deploy ou
              shell libre ne sera lancé.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                data-testid="x200-confirm-action"
                className="rounded-sm border border-gold/50 bg-gold/10 px-3 py-2 text-sm text-gold disabled:opacity-60"
                onClick={() => {
                  if (actionBusy) return;
                  void runAction(confirmAction);
                }}
              >
                {actionBusy ? "Running…" : "Confirm"}
              </button>
              <button
                type="button"
                className="rounded-sm border border-border-subtle px-3 py-2 text-sm text-gray-muted"
                disabled={actionBusy}
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <CommandPalette
        snapshot={snapshot}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onAction={(id) => {
          if (id === "refresh_all") void refresh();
          else if (id === "inspect_pr") setActiveTab("GITHUB");
          else if (id === "inspect_ci") setActiveTab("CI");
          else if (id === "start_autopilot") setConfirmAction("AUTOPILOT_START");
          else if (id === "stop_autopilot") setConfirmAction("AUTOPILOT_STOP");
          else if (id === "run_cycle") setConfirmAction("RUN_ONE_CYCLE");
          else if (id === "mark_pr_ready" || id === "review_merge")
            setActiveTab("HUMAN_ACTIONS");
          else if (id === "create_backup") setActiveTab("DATABASE");
          else if (id === "run_health_check") setHealthOpen(true);
          else if (id === "open_incident") setActiveTab("INCIDENTS");
        }}
      />
    </div>
  );
}
