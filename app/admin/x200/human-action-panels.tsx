"use client";

import { useMemo, useRef, useState } from "react";

import type { ControlCenterSnapshot } from "@/lib/x200/types";
import type {
  ActionReceipt,
  HumanActionType,
} from "@/lib/x200/actions/types";

export type TabId =
  | "OVERVIEW"
  | "TASKS"
  | "AUTOMATION"
  | "HUMAN_ACTIONS"
  | "RELEASE"
  | "DEPLOY"
  | "DATABASE"
  | "INCIDENTS"
  | "AUDIT"
  | "SOURCES"
  | "GITHUB"
  | "CI"
  | "CHANGES"
  | "OPERATOR"
  | "LOGS"
  | "NOTIFICATIONS"
  | "ERRORS";

export const X200_TABS: Array<{ id: TabId; label: string }> = [
  { id: "OVERVIEW", label: "OVERVIEW" },
  { id: "OPERATOR", label: "OPERATOR" },
  { id: "SOURCES", label: "SOURCES" },
  { id: "GITHUB", label: "GITHUB" },
  { id: "CI", label: "CI" },
  { id: "CHANGES", label: "CHANGES" },
  { id: "TASKS", label: "TASKS" },
  { id: "AUTOMATION", label: "AUTOMATION" },
  { id: "HUMAN_ACTIONS", label: "HUMAN ACTIONS" },
  { id: "RELEASE", label: "RELEASE" },
  { id: "DEPLOY", label: "DEPLOY" },
  { id: "DATABASE", label: "DATABASE" },
  { id: "INCIDENTS", label: "INCIDENTS" },
  { id: "LOGS", label: "LOGS" },
  { id: "NOTIFICATIONS", label: "NOTIFY" },
  { id: "ERRORS", label: "ERRORS" },
  { id: "AUDIT", label: "AUDIT" },
];

type HistoryFilter =
  | "All"
  | "Success"
  | "Failed"
  | "Human"
  | "Deploy"
  | "Git"
  | "AUTOPILOT"
  | "Incident";

function display(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // ignore
  }
}

export function X200TabBar({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
}) {
  return (
    <nav
      data-testid="x200-tabs"
      className="flex flex-wrap gap-1 border-b border-border-subtle pb-2"
    >
      {X200_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          data-testid={`x200-tab-${tab.id}`}
          onClick={() => onChange(tab.id)}
          className={
            active === tab.id
              ? "rounded-sm border border-gold/50 bg-gold/10 px-2.5 py-1.5 text-[10px] tracking-wide text-gold uppercase"
              : "rounded-sm border border-transparent px-2.5 py-1.5 text-[10px] tracking-wide text-gray-muted uppercase hover:text-white"
          }
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export function HumanActionPanels({
  snapshot,
  actorRole,
  activeTab,
  onRefresh,
}: {
  snapshot: ControlCenterSnapshot;
  actorRole: "SUPER_ADMIN" | "ADMIN";
  activeTab: TabId;
  onRefresh: () => void;
}) {
  const plane = snapshot.humanActions;
  const [busy, setBusy] = useState(false);
  const [selectedAction, setSelectedAction] = useState<HumanActionType | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [typedPhrase, setTypedPhrase] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [approvalId, setApprovalId] = useState<string | null>(null);
  const [secondConfirm, setSecondConfirm] = useState(false);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [receipt, setReceipt] = useState<ActionReceipt | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("All");
  const [drawerReceipt, setDrawerReceipt] = useState<ActionReceipt | null>(null);
  const idempoSeq = useRef(0);

  const canMutate =
    actorRole === "SUPER_ADMIN" &&
    plane?.enabled === true &&
    plane?.githubActionAdapter === "REAL";

  const filteredReceipts = useMemo(() => {
    const list = plane?.recentReceipts ?? [];
    switch (historyFilter) {
      case "Success":
        return list.filter((r) => r.result === "SUCCESS");
      case "Failed":
        return list.filter((r) => r.result === "FAILED" || r.result === "BLOCKED");
      case "Human":
        return list.filter((r) =>
          ["APPROVE_HUMAN_GATE", "MERGE_PR", "MARK_READY_FOR_REVIEW"].includes(
            r.action,
          ),
        );
      case "Deploy":
        return list.filter((r) =>
          ["DEPLOY_PRODUCTION", "ROLLBACK"].includes(r.action),
        );
      case "Git":
        return list.filter((r) =>
          ["MERGE_PR", "MARK_READY_FOR_REVIEW"].includes(r.action),
        );
      case "AUTOPILOT":
        return list.filter((r) =>
          ["PAUSE_AUTOMATION", "RESUME_AUTOMATION", "EMERGENCY_STOP", "RESTART_AUTOPILOT"].includes(
            r.action,
          ),
        );
      case "Incident":
        return list.filter((r) =>
          [
            "ENTER_MAINTENANCE",
            "EMERGENCY_STOP",
            "COLLECT_DIAGNOSTICS",
            "RUN_HEALTH_CHECKS",
          ].includes(r.action),
        );
      default:
        return list;
    }
  }, [historyFilter, plane?.recentReceipts]);

  async function runHumanAction(
    action: HumanActionType,
    opts: { previewOnly?: boolean } = {},
  ) {
    if (busy || !canMutate) return;
    setBusy(true);
    setResultMsg(null);
    idempoSeq.current += 1;
    const idempotencyKey = `${action}-ui-${idempoSeq.current}`;
    try {
      const res = await fetch("/api/admin/x200/human-actions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          idempotencyKey,
          reason: reason || undefined,
          typedPhrase: typedPhrase || undefined,
          mfaCode: mfaCode || undefined,
          approvalId: approvalId || undefined,
          secondConfirmation: secondConfirm || undefined,
          previewOnly: opts.previewOnly === true,
          mergeMode: "squash",
          expectedSha: snapshot.github.prHeadSha ?? snapshot.git.head ?? undefined,
        }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        code?: string;
        message?: string;
        preview?: Record<string, unknown>;
        receipt?: ActionReceipt;
        approvalId?: string;
        expectedSha?: string;
        currentSha?: string;
        snapshot?: ControlCenterSnapshot;
      };
      if (body.preview) setPreview(body.preview);
      if (body.receipt) setReceipt(body.receipt);
      if (body.approvalId) setApprovalId(body.approvalId);
      setResultMsg(
        `${body.ok === false || !body.ok ? "FAILED" : "SUCCESS"} — ${body.code ?? res.status}: ${body.message ?? ""}${
          body.expectedSha && body.currentSha && body.expectedSha !== body.currentSha
            ? ` STALE EXPECTED=${body.expectedSha} CURRENT=${body.currentSha}`
            : ""
        }`,
      );
      // Prefer server-refreshed snapshot (fresh GitHub remote) over stale pre-action data.
      if (!opts.previewOnly) onRefresh();
    } catch (error) {
      setResultMsg(
        error instanceof Error ? error.message : "human action failed",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!plane) {
    return (
      <p className="text-sm text-gray-muted" data-testid="x200-human-plane-missing">
        Human Action plane unavailable
      </p>
    );
  }

  if (activeTab === "HUMAN_ACTIONS") {
    return (
      <div className="space-y-4" data-testid="x200-human-actions">
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-gold-muted uppercase">
            CSRF STATUS
          </p>
          <p
            data-testid="x200-csrf-status"
            className="mt-1 font-heading text-lg text-white"
          >
            {plane.csrf.status}
          </p>
          <p className="mt-1 text-xs text-gray-muted">
            APP_ORIGIN={plane.csrf.appOriginConfigured ? "configured" : "missing"} ·
            localAllowList=
            {plane.csrf.localAllowListActive ? "active" : "off"}
          </p>
          <p
            data-testid="x200-github-adapter-mode"
            className="mt-3 text-sm text-white"
          >
            GITHUB ACTION ADAPTER = {plane.githubActionAdapter}
          </p>
          {plane.githubActionAdapter !== "REAL" ? (
            <p className="mt-1 text-xs text-gold">
              Mutations disabled until adapter mode is REAL
            </p>
          ) : null}
        </div>

        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-gold-muted uppercase">
            HUMAN ACTIONS inbox
          </h3>
          <ul className="mt-3 space-y-2">
            {plane.inbox.map((item) => (
              <li
                key={item.id}
                data-testid={`x200-human-action-${item.type}`}
                className="rounded-sm border border-border-subtle p-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-white">{item.type}</span>
                  <span className="text-gold">{item.status}</span>
                </div>
                <p className="mt-1 text-gray-muted">{item.reason}</p>
                <p className="mt-1 text-gray-muted">
                  env={item.environment} · risk={item.risk} · task=
                  {display(item.blockingTaskId)}
                </p>
                {canMutate ? (
                  <button
                    type="button"
                    className="mt-2 rounded-sm border border-gold/40 px-2 py-1 text-gold"
                    onClick={() => {
                      setSelectedAction(item.type);
                      setPreview(null);
                      setReceipt(null);
                      void runHumanAction(item.type, { previewOnly: true });
                    }}
                  >
                    Preview
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        {selectedAction ? (
          <div
            data-testid="x200-action-preview"
            className="rounded-sm border border-gold/40 bg-surface-elevated p-4"
          >
            <h3 className="text-[11px] font-semibold tracking-[0.2em] text-gold uppercase">
              WHAT WILL HAPPEN
            </h3>
            <pre className="mt-2 overflow-auto text-[11px] text-gray-muted">
              {JSON.stringify(preview ?? { action: selectedAction }, null, 2)}
            </pre>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="text-xs text-gray-muted">
                Justification
                <input
                  data-testid="x200-human-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-border-subtle bg-surface px-2 py-1.5 text-white"
                />
              </label>
              <label className="text-xs text-gray-muted">
                MFA code
                <input
                  data-testid="x200-human-mfa"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-border-subtle bg-surface px-2 py-1.5 text-white"
                  autoComplete="one-time-code"
                />
              </label>
              <label className="text-xs text-gray-muted sm:col-span-2">
                Typed confirmation
                <input
                  data-testid="x200-human-typed"
                  value={typedPhrase}
                  onChange={(e) => setTypedPhrase(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-border-subtle bg-surface px-2 py-1.5 text-white"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-muted">
                <input
                  type="checkbox"
                  data-testid="x200-human-second-confirm"
                  checked={secondConfirm}
                  onChange={(e) => setSecondConfirm(e.target.checked)}
                />
                Second confirmation (restore)
              </label>
            </div>
            {approvalId ? (
              <p className="mt-2 text-xs text-gold">approvalId={approvalId}</p>
            ) : null}
            <button
              type="button"
              data-testid="x200-confirm-execute"
              disabled={busy || !canMutate}
              className="mt-3 rounded-sm border border-gold/50 bg-gold/10 px-3 py-2 text-sm text-gold disabled:opacity-50"
              onClick={() => void runHumanAction(selectedAction)}
            >
              {busy ? "Executing…" : "CONFIRM & EXECUTE"}
            </button>
            {resultMsg ? (
              <p className="mt-2 text-xs text-amber-100" data-testid="x200-human-result">
                {resultMsg}
              </p>
            ) : null}
          </div>
        ) : null}

        {receipt ? (
          <div
            data-testid="x200-action-receipt"
            className="rounded-sm border border-emerald-500/40 bg-surface-elevated p-4"
          >
            <h3 className="text-[11px] font-semibold tracking-[0.2em] text-emerald-300 uppercase">
              ACTION RECEIPT
            </h3>
            <pre className="mt-2 overflow-auto text-[11px] text-gray-muted">
              {JSON.stringify(receipt, null, 2)}
            </pre>
            <button
              type="button"
              data-testid="x200-copy-receipt"
              className="mt-2 rounded-sm border border-border-subtle px-2 py-1 text-xs text-white"
              onClick={() => void copyText(JSON.stringify(receipt, null, 2))}
            >
              Copy receipt
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (activeTab === "RELEASE") {
    return (
      <div data-testid="x200-release-center" className="space-y-4">
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-gold-muted uppercase">
            RELEASE CENTER
          </h3>
          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-gold-muted">current</dt>
              <dd className="text-white">{display(plane.release.currentRelease)}</dd>
            </div>
            <div>
              <dt className="text-gold-muted">candidate</dt>
              <dd className="text-white">{display(plane.release.candidateRelease)}</dd>
            </div>
            <div>
              <dt className="text-gold-muted">HEAD</dt>
              <dd className="text-white">{display(plane.release.head)}</dd>
            </div>
            <div>
              <dt className="text-gold-muted">CI</dt>
              <dd className="text-white">{display(plane.release.ci)}</dd>
            </div>
            <div>
              <dt className="text-gold-muted">deploy</dt>
              <dd className="text-white">{plane.release.deploymentStatus}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {plane.release.pipeline.map((step) => (
              <span
                key={step.id}
                data-testid={`x200-release-step-${step.id}`}
                className="rounded-sm border border-border-subtle px-2 py-1 text-[10px] text-gray-muted"
              >
                {step.id}:{step.state}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-gold-muted uppercase">
            DRIFT
          </h3>
          <p data-testid="x200-drift-state" className="mt-2 text-white">
            {plane.drift.state}
          </p>
          <p className="mt-1 text-xs text-gray-muted">{plane.drift.detail}</p>
        </div>
      </div>
    );
  }

  if (activeTab === "DEPLOY") {
    return (
      <div data-testid="x200-deploy-center" className="space-y-4">
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-gold-muted uppercase">
            ENVIRONMENTS
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {plane.environments.map((env) => (
              <div
                key={env.id}
                data-testid={`x200-env-${env.id}`}
                className="rounded-sm border border-border-subtle p-3 text-xs"
              >
                <p className="font-semibold text-white">{env.id}</p>
                <p className="mt-1 text-gray-muted">SHA={display(env.versionSha)}</p>
                <p className="text-gray-muted">health={env.health}</p>
                <p className="text-gray-muted">deploy={env.deployState}</p>
                <p className="text-gray-muted">
                  control={String(env.controlActionsEnabled)}
                </p>
              </div>
            ))}
          </div>
        </div>
        {canMutate ? (
          <button
            type="button"
            data-testid="x200-deploy-preview"
            className="rounded-sm border border-gold/40 px-3 py-2 text-xs text-gold"
            onClick={() => {
              setSelectedAction("DEPLOY_PRODUCTION");
              void runHumanAction("DEPLOY_PRODUCTION", { previewOnly: true });
            }}
          >
            DEPLOY PRODUCTION preview
          </button>
        ) : null}
        {preview ? (
          <pre
            data-testid="x200-deploy-preview-body"
            className="overflow-auto rounded-sm border border-border-subtle p-3 text-[11px] text-gray-muted"
          >
            {JSON.stringify(preview, null, 2)}
          </pre>
        ) : null}
      </div>
    );
  }

  if (activeTab === "DATABASE") {
    return (
      <div data-testid="x200-database-center" className="space-y-4">
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-gold-muted uppercase">
            MIGRATIONS
          </h3>
          <p className="mt-2 text-xs text-gray-muted">
            Pending/Applied lists are not invented. Use Preview migration.
          </p>
          {canMutate ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="x200-migration-preview"
                className="rounded-sm border border-gold/40 px-3 py-2 text-xs text-gold"
                onClick={() => void runHumanAction("PREVIEW_MIGRATION")}
              >
                Preview migration
              </button>
              <button
                type="button"
                data-testid="x200-backup-create"
                className="rounded-sm border border-border-subtle px-3 py-2 text-xs text-white"
                onClick={() => {
                  setSelectedAction("CREATE_BACKUP");
                  void runHumanAction("CREATE_BACKUP", { previewOnly: true });
                }}
              >
                Create backup (preview)
              </button>
            </div>
          ) : null}
        </div>
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-gold-muted uppercase">
            BACKUPS
          </h3>
          <p className="mt-2 text-xs text-gray-muted">
            Restore = CRITICAL — typed phrase + MFA + second confirmation. No
            one-click restore.
          </p>
        </div>
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-gold-muted uppercase">
            SECRETS STATUS
          </h3>
          <ul className="mt-2 space-y-1 text-xs">
            {plane.secrets.map((s) => (
              <li key={s.id} data-testid={`x200-secret-${s.id}`}>
                {s.id}: {s.status} ({s.configured ? "configured" : "missing"}) —
                provider={s.provider}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-gold-muted uppercase">
            PAYMENT LIVE MODE
          </h3>
          <p data-testid="x200-payments-live" className="mt-2 text-white">
            {plane.paymentsLive}
          </p>
        </div>
      </div>
    );
  }

  if (activeTab === "INCIDENTS") {
    return (
      <div data-testid="x200-incident-mode" className="space-y-4">
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-gold-muted uppercase">
            INCIDENT MODE
          </h3>
          {plane.activeIncident ? (
            <div className="mt-2 text-xs text-white">
              <p>ID={plane.activeIncident.incidentId}</p>
              <p>severity={plane.activeIncident.severity}</p>
              <p>owner={plane.activeIncident.owner}</p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-muted">No active incident</p>
          )}
          {canMutate ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  "ENTER_MAINTENANCE",
                  "PAUSE_AUTOMATION",
                  "COLLECT_DIAGNOSTICS",
                  "RUN_HEALTH_CHECKS",
                  "EMERGENCY_STOP",
                ] as HumanActionType[]
              ).map((action) => (
                <button
                  key={action}
                  type="button"
                  data-testid={`x200-incident-${action}`}
                  className="rounded-sm border border-border-subtle px-2 py-1 text-[10px] text-white"
                  disabled={busy}
                  onClick={() => {
                    setSelectedAction(action);
                    setReason(action);
                    void runHumanAction(action, { previewOnly: true });
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-gold-muted uppercase">
            AUTOPILOT STALL DETECTOR
          </h3>
          <p data-testid="x200-stall-state" className="mt-2 text-white">
            {plane.stall.stalled ? "STALLED" : "OK"}
          </p>
          {plane.stall.stalled ? (
            <p className="mt-1 text-xs text-gold">
              {plane.stall.reason} — {plane.stall.suggestedAction}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (activeTab === "AUDIT") {
    return (
      <div data-testid="x200-action-history-enhanced" className="space-y-4">
        <div className="flex flex-wrap gap-1">
          {(
            [
              "All",
              "Success",
              "Failed",
              "Human",
              "Deploy",
              "Git",
              "AUTOPILOT",
              "Incident",
            ] as HistoryFilter[]
          ).map((f) => (
            <button
              key={f}
              type="button"
              data-testid={`x200-history-filter-${f}`}
              onClick={() => setHistoryFilter(f)}
              className={
                historyFilter === f
                  ? "rounded-sm border border-gold/40 px-2 py-1 text-[10px] text-gold"
                  : "rounded-sm border border-border-subtle px-2 py-1 text-[10px] text-gray-muted"
              }
            >
              {f}
            </button>
          ))}
        </div>
        <ul className="space-y-2">
          {filteredReceipts.map((r) => (
            <li key={r.actionId}>
              <button
                type="button"
                className="w-full rounded-sm border border-border-subtle p-3 text-left text-xs"
                onClick={() => setDrawerReceipt(r)}
              >
                <span className="text-white">{r.action}</span> · {r.result} ·{" "}
                {r.durationMs}ms · {r.startedAt}
              </button>
            </li>
          ))}
        </ul>
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-gold-muted uppercase">
            OPERATIONS METRICS
          </h3>
          <p className="mt-2 text-xs text-gray-muted">
            cost={plane.metrics.cost} · cycles=
            {display(plane.metrics.agentCycles)} · deployments=
            {display(plane.metrics.deployments)}
          </p>
        </div>
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-gold-muted uppercase">
            NOTIFICATIONS
          </h3>
          <ul className="mt-2 text-xs text-gray-muted">
            {plane.notifications.map((n) => (
              <li key={n.adapter}>
                {n.adapter}: {n.status}
              </li>
            ))}
          </ul>
        </div>
        {drawerReceipt ? (
          <div
            data-testid="x200-receipt-drawer"
            className="rounded-sm border border-gold/40 p-4"
          >
            <pre className="overflow-auto text-[11px] text-gray-muted">
              {JSON.stringify(drawerReceipt, null, 2)}
            </pre>
            <button
              type="button"
              className="mt-2 text-xs text-gold"
              onClick={() => setDrawerReceipt(null)}
            >
              Close
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}
