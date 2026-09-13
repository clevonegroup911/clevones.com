"use client";

import { useMemo, useState } from "react";

import type { ControlCenterSnapshot } from "@/lib/x200/types";
import { displayFactValue } from "@/lib/x200/mirror/freshness";

export type MirrorTabId =
  | "SOURCES"
  | "GITHUB"
  | "CI"
  | "CHANGES"
  | "OPERATOR"
  | "LOGS"
  | "NOTIFICATIONS"
  | "ERRORS";

export const MIRROR_TABS: Array<{ id: MirrorTabId; label: string }> = [
  { id: "SOURCES", label: "SOURCES" },
  { id: "GITHUB", label: "GITHUB" },
  { id: "CI", label: "CI" },
  { id: "CHANGES", label: "CHANGES" },
  { id: "OPERATOR", label: "OPERATOR" },
  { id: "LOGS", label: "LOGS" },
  { id: "NOTIFICATIONS", label: "NOTIFY" },
  { id: "ERRORS", label: "ERRORS" },
];

function display(value: string | number | boolean | null | undefined): string {
  return displayFactValue(value);
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // ignore
  }
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

export function GlobalCommandCenter({
  snapshot,
}: {
  snapshot: ControlCenterSnapshot;
}) {
  const facts = snapshot.mirror?.globalFacts ?? [];
  const degraded = snapshot.mirror?.degraded;
  return (
    <Card title="GLOBAL COMMAND CENTER" testId="x200-global-command-center">
      {degraded ? (
        <p className="mb-3 text-xs text-gold" data-testid="x200-mirror-degraded">
          DEGRADED — some sources timed out or failed; dashboard continues.
        </p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {facts.map((cell) => (
          <div
            key={cell.id}
            data-testid={`x200-fact-${cell.id}`}
            className="rounded-sm border border-border-subtle bg-surface-muted/40 p-3"
          >
            <p className="text-[10px] tracking-[0.16em] text-gold-muted uppercase">
              {cell.label}
            </p>
            <p className="mt-1 break-all font-mono text-sm text-white">
              {display(cell.value)}
            </p>
            <dl className="mt-2 space-y-0.5 text-[10px] text-gray-muted">
              <div>
                <dt className="inline text-gray-muted">SOURCE=</dt>
                <dd className="inline text-gray-soft">{cell.source}</dd>
              </div>
              <div>
                <dt className="inline">TIMESTAMP=</dt>
                <dd className="inline">{display(cell.timestamp)}</dd>
              </div>
              <div>
                <dt className="inline">FRESHNESS=</dt>
                <dd className="inline">{cell.freshness}</dd>
                {cell.ageLabel ? (
                  <span className="ml-1 text-gray-soft">({cell.ageLabel})</span>
                ) : null}
              </div>
              <div>
                <dt className="inline">VERIFICATION=</dt>
                <dd
                  className={
                    cell.verification === "CONFLICT" ||
                    cell.verification === "STALE"
                      ? "inline text-gold"
                      : "inline"
                  }
                >
                  {cell.verification}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function NextSafeActionBanner({
  snapshot,
}: {
  snapshot: ControlCenterSnapshot;
}) {
  const action = snapshot.mirror?.nextSafeAction;
  if (!action) return null;
  return (
    <div
      data-testid="x200-next-safe-action"
      className="rounded-sm border border-gold/40 bg-gold/10 px-4 py-3"
    >
      <p className="text-[10px] font-semibold tracking-[0.2em] text-gold uppercase">
        NEXT SAFE ACTION
      </p>
      <p className="mt-1 text-sm text-white">
        {action.code} — {action.title}
      </p>
      <p className="mt-1 text-xs text-gray-muted">{action.detail}</p>
      {action.requiresHuman ? (
        <p className="mt-1 text-[11px] text-gold">HUMAN DECISION REQUIRED</p>
      ) : null}
    </div>
  );
}

export function OperationalMirrorPanels({
  snapshot,
  activeTab,
  onRefresh,
  onOpenTab,
}: {
  snapshot: ControlCenterSnapshot;
  activeTab: string;
  onRefresh: () => void;
  onOpenTab?: (tab: string) => void;
}) {
  const mirror = snapshot.mirror;
  const [logLevel, setLogLevel] = useState<"ALL" | "INFO" | "WARNING" | "ERROR" | "CRITICAL">(
    "ALL",
  );
  const [acked, setAcked] = useState<Record<string, boolean>>({});

  if (!mirror) {
    return (
      <Card title="OPERATIONAL MIRROR">
        <p className="text-sm text-gray-muted">Mirror unavailable</p>
      </Card>
    );
  }

  if (activeTab === "SOURCES") {
    return (
      <Card title="SOURCE OF TRUTH MATRIX" testId="x200-sources-matrix">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="text-[10px] tracking-wide text-gold-muted uppercase">
              <tr>
                <th className="py-2 pr-3">Domain</th>
                <th className="py-2 pr-3">Local</th>
                <th className="py-2 pr-3">Remote</th>
                <th className="py-2 pr-3">Production</th>
                <th className="py-2 pr-3">Truth source</th>
                <th className="py-2 pr-3">Freshness</th>
                <th className="py-2 pr-3">State</th>
              </tr>
            </thead>
            <tbody>
              {mirror.sourcesMatrix.map((row) => (
                <tr
                  key={row.domain}
                  className="border-t border-border-subtle align-top"
                >
                  <td className="py-2 pr-3 text-white">{row.domain}</td>
                  <td className="py-2 pr-3">{row.local}</td>
                  <td className="py-2 pr-3">{row.remote}</td>
                  <td className="py-2 pr-3">{row.production}</td>
                  <td className="py-2 pr-3">{row.truthSource}</td>
                  <td className="py-2 pr-3">
                    {row.freshness}
                    {row.ageLabel ? ` · ${row.ageLabel}` : ""}
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={
                        row.state === "CONFLICT" ? "text-gold" : "text-gray-soft"
                      }
                    >
                      {row.state}
                    </span>
                    {row.conflict ? (
                      <p className="mt-1 text-[10px] text-gold">
                        {row.conflictLabel ?? "SOURCE_CONFLICT"}
                      </p>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  if (activeTab === "GITHUB") {
    const g = snapshot.github;
    return (
      <div className="space-y-4">
        <Card title="GITHUB CENTER" testId="x200-github-center">
          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-gray-muted">repository</dt>
              <dd className="text-white">{display(g.repository)}</dd>
            </div>
            <div>
              <dt className="text-gray-muted">open PRs</dt>
              <dd className="text-white">{display(mirror.openPrCount)}</dd>
            </div>
            <div>
              <dt className="text-gray-muted">current PR</dt>
              <dd className="text-white">#{display(g.prNumber)}</dd>
            </div>
            <div>
              <dt className="text-gray-muted">exact SHA</dt>
              <dd className="break-all font-mono text-white">
                {display(g.prHeadSha)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-muted">draft</dt>
              <dd>{display(g.prDraft)}</dd>
            </div>
            <div>
              <dt className="text-gray-muted">mergeable</dt>
              <dd>{display(g.prMergeable)}</dd>
            </div>
            <div>
              <dt className="text-gray-muted">CI conclusion</dt>
              <dd>{display(g.ciLatestConclusion)}</dd>
            </div>
            <div>
              <dt className="text-gray-muted">main HEAD</dt>
              <dd className="break-all font-mono">
                {display(mirror.mainHead)}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-sm border border-border-subtle px-2.5 py-1.5 text-xs text-gold"
            >
              Refresh GitHub
            </button>
            {g.prUrl ? (
              <a
                href={g.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm border border-border-subtle px-2.5 py-1.5 text-xs text-gold"
              >
                Open PR
              </a>
            ) : null}
            {g.prHeadSha ? (
              <a
                href={`https://github.com/${g.repository}/commit/${g.prHeadSha}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm border border-border-subtle px-2.5 py-1.5 text-xs text-gold"
              >
                Open commit
              </a>
            ) : null}
            {g.ciLatestUrl ? (
              <a
                href={g.ciLatestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm border border-border-subtle px-2.5 py-1.5 text-xs text-gold"
              >
                Open workflow
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => onOpenTab?.("HUMAN_ACTIONS")}
              className="rounded-sm border border-border-subtle px-2.5 py-1.5 text-xs text-gray-muted"
            >
              Mark Ready / Merge (Human Actions)
            </button>
          </div>
          <p className="mt-3 text-[11px] text-gray-muted">
            Mutations require Human Actions adapters + remote verification. No silent SUCCESS.
          </p>
        </Card>
        <Card title="RELEASE STACK" testId="x200-release-stack">
          <p className="text-xs text-gray-muted">
            NEXT SAFE MERGE:{" "}
            <span className="text-white">
              {mirror.releaseStack.nextSafeMerge != null
                ? `#${mirror.releaseStack.nextSafeMerge}`
                : "N/A"}
            </span>
          </p>
          <p className="mt-1 text-xs text-gray-muted">
            {mirror.releaseStack.nextSafeMergeReason}
          </p>
          <p className="mt-1 text-[11px] text-gold">
            requiresApproval={String(mirror.releaseStack.requiresApproval)} — not auto-executed
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs">
            {mirror.releaseStack.mergeOrder.map((num) => {
              const node = mirror.releaseStack.nodes.find(
                (n) => n.prNumber === num,
              );
              return (
                <li key={num}>
                  PR #{num} base={node?.base ?? "?"} head={node?.head ?? "?"}{" "}
                  {node?.readyState}
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
    );
  }

  if (activeTab === "CI") {
    const ci = mirror.ciInspector;
    return (
      <Card title="CI INSPECTOR" testId="x200-ci-inspector">
        <dl className="grid gap-2 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-gray-muted">run</dt>
            <dd>#{display(ci.runNumber)} / {display(ci.runId)}</dd>
          </div>
          <div>
            <dt className="text-gray-muted">status / conclusion</dt>
            <dd>
              {display(ci.runStatus)} / {display(ci.runConclusion)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-muted">duration</dt>
            <dd>
              {ci.durationMs != null
                ? `${Math.round(ci.durationMs / 1000)}s`
                : "N/A"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-muted">FAILED STEP</dt>
            <dd className="text-red-300">{display(ci.failedStep)}</dd>
          </div>
          <div>
            <dt className="text-gray-muted">ERROR CATEGORY</dt>
            <dd>{display(ci.errorCategory)}</dd>
          </div>
          <div>
            <dt className="text-gray-muted">SUGGESTED NEXT ACTION</dt>
            <dd>{display(ci.suggestedNextAction)}</dd>
          </div>
        </dl>
        <div className="mt-4 space-y-3">
          {ci.jobs.map((job) => (
            <div
              key={job.name}
              className="rounded-sm border border-border-subtle p-3"
            >
              <p className="text-sm text-white">
                {job.name} — {display(job.status)} / {display(job.conclusion)}
              </p>
              <p className="text-[11px] text-gray-muted">
                duration=
                {job.durationMs != null
                  ? `${Math.round(job.durationMs / 1000)}s`
                  : "N/A"}{" "}
                started={display(job.startedAt)} completed=
                {display(job.completedAt)}
              </p>
              <ul className="mt-2 space-y-1 text-[11px] text-gray-soft">
                {job.steps.map((step) => (
                  <li key={`${job.name}-${step.name}`}>
                    {step.name}: {display(step.status)} /{" "}
                    {display(step.conclusion)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {!ci.jobs.length ? (
            <p className="text-xs text-gray-muted">
              {ci.warning ?? "No job details (NOT_CONNECTED or unavailable)"}
            </p>
          ) : null}
        </div>
      </Card>
    );
  }

  if (activeTab === "CHANGES") {
    const d = mirror.diffInspector;
    return (
      <Card title="DIFF & CHANGE INSPECTOR" testId="x200-diff-inspector">
        <dl className="grid gap-2 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-gray-muted">files changed</dt>
            <dd>{display(d.filesChanged)}</dd>
          </div>
          <div>
            <dt className="text-gray-muted">added / modified / deleted</dt>
            <dd>
              {display(d.added)} / {display(d.modified)} / {display(d.deleted)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-muted">lines +/-</dt>
            <dd>
              +{display(d.linesAdded)} / -{display(d.linesDeleted)}
            </dd>
          </div>
        </dl>
        {d.warning ? (
          <p className="mt-2 text-[11px] text-gray-muted">{d.warning}</p>
        ) : null}
        <div className="mt-3 max-h-64 overflow-auto rounded-sm border border-border-subtle p-2">
          <pre className="whitespace-pre-wrap text-[11px] text-gray-soft">
            {d.summaryRedacted || "No diff summary"}
          </pre>
        </div>
        <ul className="mt-3 space-y-1 text-xs text-gray-muted">
          {d.commits.map((c) => (
            <li key={c.sha} className="font-mono">
              {c.sha.slice(0, 10)} {c.subject}
            </li>
          ))}
        </ul>
      </Card>
    );
  }

  if (activeTab === "OPERATOR") {
    const op = mirror.operatorView;
    return (
      <Card title="OPERATOR VIEW" testId="x200-operator-view">
        <p className="mb-3 text-[11px] text-gray-muted">
          Observable facts only — no private reasoning.
        </p>
        {(
          [
            ["CURRENT FACTS", op.currentFacts],
            ["EVIDENCE", op.evidence],
            ["CONFLICTS", op.conflicts],
            ["RISKS", op.risks],
            ["BLOCKERS", op.blockers],
          ] as const
        ).map(([label, items]) => (
          <div key={label} className="mb-3">
            <p className="text-[10px] tracking-[0.18em] text-gold-muted uppercase">
              {label}
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-gray-soft">
              {items.length ? (
                items.map((item) => <li key={item}>{item}</li>)
              ) : (
                <li>none</li>
              )}
            </ul>
          </div>
        ))}
        <div className="mt-2 rounded-sm border border-gold/30 bg-gold/5 p-3">
          <p className="text-[10px] tracking-[0.18em] text-gold uppercase">
            NEXT SAFE ACTION
          </p>
          <p className="mt-1 text-sm text-white">{op.nextSafeAction}</p>
          <p className="mt-2 text-[10px] tracking-[0.18em] text-gold uppercase">
            HUMAN DECISION REQUIRED
          </p>
          <p className="mt-1 text-sm text-gray-soft">
            {op.humanDecisionRequired ?? "none"}
          </p>
        </div>
      </Card>
    );
  }

  if (activeTab === "LOGS") {
    const logs = mirror.logs.filter(
      (entry) => logLevel === "ALL" || entry.level === logLevel,
    );
    return (
      <Card title="LOG VIEWER" testId="x200-log-viewer">
        <p className="mb-2 text-[11px] text-gray-muted">
          Controlled channels only — no free terminal / arbitrary shell.
        </p>
        <div className="mb-3 flex flex-wrap gap-1">
          {(["ALL", "INFO", "WARNING", "ERROR", "CRITICAL"] as const).map(
            (level) => (
              <button
                key={level}
                type="button"
                onClick={() => setLogLevel(level)}
                className={
                  logLevel === level
                    ? "rounded-sm border border-gold/40 px-2 py-1 text-[10px] text-gold"
                    : "rounded-sm border border-border-subtle px-2 py-1 text-[10px] text-gray-muted"
                }
              >
                {level}
              </button>
            ),
          )}
        </div>
        <ul className="max-h-96 space-y-2 overflow-auto text-xs">
          {logs.map((entry) => (
            <li
              key={entry.id}
              className="rounded-sm border border-border-subtle p-2"
            >
              <span className="text-gold-muted">{entry.level}</span>{" "}
              <span className="text-gray-muted">[{entry.channel}]</span>{" "}
              <span className="text-white">{entry.message}</span>
              <p className="mt-1 text-[10px] text-gray-muted">
                {entry.at} · {entry.source}
              </p>
            </li>
          ))}
          {!logs.length ? (
            <li className="text-gray-muted">No log entries</li>
          ) : null}
        </ul>
      </Card>
    );
  }

  if (activeTab === "NOTIFICATIONS") {
    const unread = mirror.notifications.filter((n) => !acked[n.id]).length;
    return (
      <Card title="NOTIFICATION CENTER" testId="x200-notification-center">
        <p className="mb-3 text-xs text-gray-muted" data-testid="x200-notify-badge">
          Badge: {unread} unacknowledged
        </p>
        <ul className="space-y-2">
          {mirror.notifications.map((n) => (
            <li
              key={n.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-sm border border-border-subtle p-3 text-xs"
            >
              <div>
                <p className="text-white">
                  [{n.severity}] {n.title}
                </p>
                <p className="text-gray-muted">{n.detail}</p>
                <p className="text-[10px] text-gray-muted">
                  {n.source} · {n.createdAt}
                </p>
              </div>
              <button
                type="button"
                disabled={Boolean(acked[n.id])}
                onClick={() => setAcked((prev) => ({ ...prev, [n.id]: true }))}
                className="rounded-sm border border-border-subtle px-2 py-1 text-[10px] text-gold disabled:opacity-40"
              >
                {acked[n.id] ? "ACKED" : "Acknowledge"}
              </button>
            </li>
          ))}
          {!mirror.notifications.length ? (
            <li className="text-gray-muted">No notifications</li>
          ) : null}
        </ul>
      </Card>
    );
  }

  if (activeTab === "ERRORS") {
    return (
      <Card title="ERROR INTELLIGENCE" testId="x200-error-intelligence">
        <ul className="space-y-2 text-xs">
          {mirror.errorIntelligence.map((err) => (
            <li
              key={err.errorCode}
              className="rounded-sm border border-border-subtle p-3"
            >
              <p className="font-mono text-white">
                {err.errorCode} ×{err.count}
              </p>
              <p className="text-gray-muted">
                {err.component} · {err.source}
              </p>
              <p className="text-gray-soft">{err.suggestedSafeAction}</p>
              <p className="text-[10px] text-gray-muted">
                first={err.firstSeen} last={err.lastSeen} task=
                {display(err.relatedTask)} commit={display(err.relatedCommit)}
              </p>
            </li>
          ))}
          {!mirror.errorIntelligence.length ? (
            <li className="text-gray-muted">No deduplicated errors</li>
          ) : null}
        </ul>
      </Card>
    );
  }

  return null;
}

export function AutopilotLivePanel({
  snapshot,
}: {
  snapshot: ControlCenterSnapshot;
}) {
  const live = snapshot.mirror?.autopilotLive;
  const cursor = snapshot.mirror?.cursorAgent;
  if (!live) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="AUTOPILOT LIVE" testId="x200-autopilot-live">
        <dl className="grid grid-cols-2 gap-2 text-xs">
          {(
            [
              ["service state", live.serviceState],
              ["PID", live.pid],
              ["mode", live.mode],
              ["agentRunning", live.agentRunning],
              ["lastEvent", live.lastEvent],
              ["heartbeat", live.heartbeat],
              ["heartbeat age", live.heartbeatAge],
              ["cycle", live.cycle],
              ["task claimed", live.taskClaimed],
              ["task runtime", live.taskRuntime],
              ["last exit", live.lastExit],
              ["restart count", live.restartCount],
              ["lock state", live.lockState],
              ["dirty worktree", live.dirtyWorktree],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="text-gray-muted">{label}</dt>
              <dd className="break-all text-white">{display(value)}</dd>
            </div>
          ))}
        </dl>
        {live.agentRunning ? (
          <p className="mt-3 text-[11px] text-gold">
            agentRunning=true — no arbitrary kill from Control Center
          </p>
        ) : null}
      </Card>
      <Card title="CURSOR AGENT STATUS" testId="x200-cursor-agent">
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-gray-muted">status</dt>
            <dd className="text-white">{cursor?.status ?? "NOT_CONNECTED"}</dd>
          </div>
          <div>
            <dt className="text-gray-muted">task</dt>
            <dd>{display(cursor?.task)}</dd>
          </div>
          <div>
            <dt className="text-gray-muted">branch</dt>
            <dd>{display(cursor?.branch)}</dd>
          </div>
          <div>
            <dt className="text-gray-muted">tests</dt>
            <dd>{display(cursor?.testsStatus)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[11px] text-gray-muted">{cursor?.note}</p>
      </Card>
    </div>
  );
}

export function CommandPalette({
  snapshot,
  open,
  onClose,
  onAction,
}: {
  snapshot: ControlCenterSnapshot;
  open: boolean;
  onClose: () => void;
  onAction: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const actions = snapshot.mirror?.commandPalette ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => a.label.toLowerCase().includes(q));
  }, [snapshot.mirror?.commandPalette, query]);

  if (!open) return null;

  return (
    <div
      data-testid="x200-command-palette"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh]"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-sm border border-border-subtle bg-surface-elevated p-3 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <p className="mb-2 text-[10px] tracking-[0.2em] text-gold-muted uppercase">
          Command palette (Ctrl+K) — no free shell
        </p>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter actions…"
          className="w-full rounded-sm border border-border-subtle bg-surface-muted px-3 py-2 text-sm text-white outline-none"
        />
        <ul className="mt-2 max-h-72 overflow-auto">
          {filtered.map((action) => (
            <li key={action.id}>
              <button
                type="button"
                disabled={!action.available}
                onClick={() => {
                  onAction(action.id);
                  onClose();
                }}
                className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-2 text-left text-sm text-white hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span>
                  {action.label}
                  {action.requiresHuman ? " · human" : ""}
                </span>
                {!action.available && action.reason ? (
                  <span className="text-[10px] text-gray-muted">
                    {action.reason}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function HumanDecisionCenter({
  snapshot,
}: {
  snapshot: ControlCenterSnapshot;
}) {
  const decisions = snapshot.mirror?.humanDecisions ?? [];
  return (
    <Card title="HUMAN DECISION CENTER" testId="x200-human-decision-center">
      {!decisions.length ? (
        <p className="text-xs text-gray-muted">No pending human decisions</p>
      ) : (
        <ul className="space-y-3">
          {decisions.map((d) => (
            <li
              key={d.id}
              className="rounded-sm border border-border-subtle p-3 text-xs"
            >
              <p className="text-sm text-white">{d.type}</p>
              <dl className="mt-2 grid gap-1 sm:grid-cols-2">
                <div>
                  <dt className="text-gray-muted">WHY</dt>
                  <dd>{d.why}</dd>
                </div>
                <div>
                  <dt className="text-gray-muted">WHAT</dt>
                  <dd>{d.what}</dd>
                </div>
                <div>
                  <dt className="text-gray-muted">RISK</dt>
                  <dd>{d.risk}</dd>
                </div>
                <div>
                  <dt className="text-gray-muted">ENVIRONMENT</dt>
                  <dd>{d.environment}</dd>
                </div>
                <div>
                  <dt className="text-gray-muted">EXACT SHA</dt>
                  <dd className="break-all font-mono">{display(d.exactSha)}</dd>
                </div>
                <div>
                  <dt className="text-gray-muted">EXPECTED EFFECT</dt>
                  <dd>{d.expectedEffect}</dd>
                </div>
                <div>
                  <dt className="text-gray-muted">ROLLBACK</dt>
                  <dd>{d.rollback}</dd>
                </div>
              </dl>
              <p className="mt-2 text-[10px] text-gray-muted">
                PRECONDITIONS: {d.preconditions.join("; ") || "none"}
              </p>
              <p className="text-[10px] text-gray-muted">
                SOURCE EVIDENCE: {d.sourceEvidence.join(" · ")}
              </p>
              <button
                type="button"
                className="mt-2 rounded-sm border border-gold/40 px-2.5 py-1.5 text-[10px] text-gold"
                onClick={() =>
                  copyText(
                    JSON.stringify(
                      {
                        type: d.type,
                        why: d.why,
                        risk: d.risk,
                        sha: d.exactSha,
                      },
                      null,
                      2,
                    ),
                  )
                }
              >
                REVIEW DECISION
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
