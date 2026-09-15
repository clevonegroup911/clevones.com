"use client";

import {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";

import {
  ActionToast,
  DisabledReason,
  PreviewDrawer,
  formatPreviewCopy,
  type ActionPhase,
} from "@/app/admin/x200/action-console";
import type { ControlCenterSnapshot } from "@/lib/x200/types";
import {
  describeConfirmBlockers,
  policyForAction,
} from "@/lib/x200/actions/policy";
import type {
  ActionPreview,
  ActionReceipt,
  HumanActionType,
} from "@/lib/x200/actions/types";

export type TabId =
  | "OVERVIEW"
  | "STARTUP"
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
  { id: "STARTUP", label: "STARTUP" },
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
    return true;
  } catch {
    return false;
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

function ActionButton({
  testId,
  label,
  disabled,
  disabledReason,
  onClick,
}: {
  testId: string;
  label: string;
  disabled: boolean;
  disabledReason: string | null;
  onClick: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        data-testid={testId}
        disabled={disabled}
        title={disabled ? (disabledReason ?? "Disabled") : label}
        onClick={onClick}
        className="rounded-sm border border-gold/40 px-3 py-2 text-xs text-gold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {label}
      </button>
      {disabled ? <DisabledReason reason={disabledReason} /> : null}
    </div>
  );
}

export function HumanActionPanels({
  snapshot,
  actorRole,
  activeTab,
  onRefresh,
  openPreviewRef,
  onActionMeta,
}: {
  snapshot: ControlCenterSnapshot;
  actorRole: "SUPER_ADMIN" | "ADMIN";
  activeTab: TabId;
  onRefresh: () => void;
  openPreviewRef?: Ref<(action: HumanActionType) => void>;
  onActionMeta?: (meta: {
    at: number;
    phase: ActionPhase;
    message: string;
    receiptId: string | null;
    durationMs: number | null;
  }) => void;
}) {
  const plane = snapshot.humanActions;
  const [busy, setBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<HumanActionType | null>(
    null,
  );
  const [phase, setPhase] = useState<ActionPhase>("IDLE");
  const [reason, setReason] = useState("");
  const [typedPhrase, setTypedPhrase] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [approvalId, setApprovalId] = useState<string | null>(null);
  const [secondConfirm, setSecondConfirm] = useState(false);
  const [preview, setPreview] = useState<ActionPreview | Record<string, unknown> | null>(
    null,
  );
  const [receipt, setReceipt] = useState<ActionReceipt | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastActionAt, setLastActionAt] = useState<number | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("All");
  const [drawerReceipt, setDrawerReceipt] = useState<ActionReceipt | null>(null);
  const inFlightRef = useRef(false);
  const executeKeyRef = useRef<string | null>(null);
  const idempoSeq = useRef(0);

  const canPreview = actorRole === "SUPER_ADMIN";
  const canExecute =
    canPreview &&
    plane?.enabled === true &&
    plane?.githubActionAdapter === "REAL";
  const previewBlockReason = !canPreview ? "SUPER_ADMIN required" : null;
  const executeBlockReason = !canPreview
    ? "SUPER_ADMIN required"
    : plane?.enabled !== true
      ? "X200_HUMAN_ACTIONS_ENABLED=false"
      : plane?.githubActionAdapter !== "REAL"
        ? `GITHUB ACTION ADAPTER = ${plane?.githubActionAdapter ?? "UNAVAILABLE"} — mutations disabled`
        : null;

  const shortSha = snapshot.github.prHeadSha ?? snapshot.git.head;
  const policy = selectedAction
    ? policyForAction(selectedAction, { shortSha })
    : null;
  const confirmBlockers = policy
    ? describeConfirmBlockers({
        policy,
        canExecute,
        executeBlockReason,
        reason,
        mfaCode,
        typedPhrase,
        secondConfirm,
      })
    : [];
  const confirmDisabled =
    busy ||
    !selectedAction ||
    confirmBlockers.length > 0 ||
    phase === "RUNNING" ||
    phase === "VERIFYING" ||
    phase === "SUCCESS";
  const confirmDisabledReason = !selectedAction
    ? "Select an action and run Preview first"
    : confirmBlockers[0] ?? null;

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
          [
            "PAUSE_AUTOMATION",
            "RESUME_AUTOMATION",
            "EMERGENCY_STOP",
            "RESTART_AUTOPILOT",
          ].includes(r.action),
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

  const emitMeta = useCallback(
    (nextPhase: ActionPhase, message: string, rec: ActionReceipt | null) => {
      const at = Date.now();
      setLastActionAt(at);
      onActionMeta?.({
        at,
        phase: nextPhase,
        message,
        receiptId: rec?.actionId ?? null,
        durationMs: rec?.durationMs ?? durationMs,
      });
    },
    [durationMs, onActionMeta],
  );

  const runHumanAction = useCallback(
    async (action: HumanActionType, opts: { previewOnly?: boolean } = {}) => {
      if (opts.previewOnly) {
        if (!canPreview || inFlightRef.current) return;
      } else if (!canExecute || inFlightRef.current || confirmBlockers.length > 0) {
        return;
      }
      inFlightRef.current = true;
      setBusy(true);
      setDrawerOpen(true);
      setSelectedAction(action);
      setErrorCode(null);
      setErrorMessage(null);
      const started = Date.now();
      if (opts.previewOnly) {
        setPhase("PREPARING");
        setToast("Loading preview…");
        emitMeta("PREPARING", "Loading preview…", null);
      } else {
        setPhase("RUNNING");
        setToast(`Executing ${action}…`);
        emitMeta("RUNNING", `Executing ${action}…`, null);
      }
      idempoSeq.current += 1;
      const idempotencyKey = opts.previewOnly
        ? `${action}-preview-${idempoSeq.current}`
        : (executeKeyRef.current ?? `${action}-ui-${idempoSeq.current}`);
      if (!opts.previewOnly) executeKeyRef.current = idempotencyKey;
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
            expectedSha:
              snapshot.github.prHeadSha ?? snapshot.git.head ?? undefined,
          }),
        });
        const body = (await res.json()) as {
          ok?: boolean;
          code?: string;
          message?: string;
          preview?: ActionPreview | Record<string, unknown>;
          receipt?: ActionReceipt;
          approvalId?: string;
          expectedSha?: string;
          currentSha?: string;
        };
        setDurationMs(Date.now() - started);
        if (body.preview) setPreview(body.preview);
        if (body.receipt) setReceipt(body.receipt);
        if (body.approvalId) setApprovalId(body.approvalId);

        if (opts.previewOnly) {
          if (body.ok === false) {
            setPhase("FAILED");
            setErrorCode(body.code ?? String(res.status));
            setErrorMessage(body.message ?? "preview failed");
            const msg = `FAILED — ${body.code ?? res.status}: ${body.message ?? ""}`;
            setToast(msg);
            emitMeta("FAILED", msg, body.receipt ?? null);
          } else {
            setPhase("PREVIEW_READY");
            setToast("Preview ready — no action executed.");
            emitMeta("PREVIEW_READY", "Preview ready — no action executed.", null);
          }
          return;
        }

        setPhase("VERIFYING");
        setToast("Remote verification…");
        const remoteVerified = body.receipt?.after?.remoteVerified;
        const blocked =
          body.code === "MFA_REQUIRED" ||
          body.code === "ADAPTER_MOCK" ||
          body.code === "ACTION_NOT_ALLOWED" ||
          body.receipt?.result === "BLOCKED";
        const verifiedSuccess =
          body.ok === true &&
          body.receipt?.result === "SUCCESS" &&
          remoteVerified !== false;

        if (blocked) {
          setPhase("BLOCKED");
          const msg = `BLOCKED — ${body.code ?? "blocked"}: ${body.message ?? ""}`;
          setToast(msg);
          emitMeta("BLOCKED", msg, body.receipt ?? null);
        } else if (verifiedSuccess) {
          setPhase("SUCCESS");
          const msg = `SUCCESS — ${body.message ?? body.code ?? action}`;
          setToast(msg);
          emitMeta("SUCCESS", msg, body.receipt ?? null);
          executeKeyRef.current = null;
          onRefresh();
        } else {
          setPhase("FAILED");
          setErrorCode(body.code ?? String(res.status));
          setErrorMessage(body.message ?? "action failed");
          const msg = `FAILED — ${body.code ?? res.status}: ${body.message ?? ""}`;
          setToast(msg);
          emitMeta("FAILED", msg, body.receipt ?? null);
          executeKeyRef.current = null;
        }
      } catch (error) {
        setPhase("FAILED");
        const message =
          error instanceof Error ? error.message : "human action failed";
        setErrorCode("REQUEST_FAILED");
        setErrorMessage(message);
        setToast(`FAILED — REQUEST_FAILED: ${message}`);
        emitMeta("FAILED", message, null);
        executeKeyRef.current = null;
      } finally {
        inFlightRef.current = false;
        setBusy(false);
      }
    },
    [
      approvalId,
      canExecute,
      canPreview,
      confirmBlockers.length,
      emitMeta,
      mfaCode,
      onRefresh,
      reason,
      secondConfirm,
      snapshot.git.head,
      snapshot.github.prHeadSha,
      typedPhrase,
    ],
  );

  const openPreview = useCallback(
    (action: HumanActionType) => {
      setSelectedAction(action);
      setPreview(null);
      setReceipt(null);
      setSecondConfirm(false);
      setDrawerOpen(true);
      setPhase("PREPARING");
      void runHumanAction(action, { previewOnly: true });
    },
    [runHumanAction],
  );
  useImperativeHandle(openPreviewRef, () => openPreview, [openPreview]);

  const consoleUi = (
    <>
      <ActionToast phase={phase} message={toast} />
      <PreviewDrawer
        open={drawerOpen}
        phase={phase}
        preview={preview}
        errorCode={errorCode}
        errorMessage={errorMessage}
        actorRole={actorRole}
        lastActionAt={lastActionAt}
        receipt={receipt}
        durationMs={durationMs}
        onClose={() => setDrawerOpen(false)}
        onCopy={() => {
          if (preview) void copyText(formatPreviewCopy(preview));
        }}
        onRefresh={() => {
          if (selectedAction) void runHumanAction(selectedAction, { previewOnly: true });
        }}
        onCopyError={() => {
          void copyText(
            JSON.stringify(
              { code: errorCode, message: errorMessage, action: selectedAction },
              null,
              2,
            ),
          );
        }}
      >
        {selectedAction && policy ? (
          <div className="mt-4 space-y-3 border-t border-border-subtle pt-3">
            {policy.requireReason ? (
              <label className="text-xs text-gray-muted">
                Justification
                <input
                  data-testid="x200-human-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-border-subtle bg-surface px-2 py-1.5 text-white"
                />
              </label>
            ) : null}
            {policy.requireMfa ? (
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
            ) : null}
            {policy.requireTypedPhrase ? (
              <label className="text-xs text-gray-muted">
                Typed confirmation
                <input
                  data-testid="x200-human-typed"
                  value={typedPhrase}
                  onChange={(e) => setTypedPhrase(e.target.value)}
                  placeholder={policy.typedPhrase ?? ""}
                  className="mt-1 w-full rounded-sm border border-border-subtle bg-surface px-2 py-1.5 text-white"
                />
              </label>
            ) : null}
            {policy.requireSecondConfirmation ? (
              <label className="flex items-center gap-2 text-xs text-gray-muted">
                <input
                  type="checkbox"
                  data-testid="x200-human-second-confirm"
                  checked={secondConfirm}
                  onChange={(e) => setSecondConfirm(e.target.checked)}
                />
                Second confirmation (critical)
              </label>
            ) : null}
            {approvalId ? (
              <p className="text-xs text-gold">approvalId={approvalId}</p>
            ) : null}
            <button
              type="button"
              data-testid="x200-confirm-execute"
              disabled={confirmDisabled}
              title={confirmDisabledReason ?? "CONFIRM & EXECUTE"}
              className="rounded-sm border border-gold/50 bg-gold/10 px-3 py-2 text-sm text-gold disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                if (selectedAction) void runHumanAction(selectedAction);
              }}
            >
              {busy && (phase === "RUNNING" || phase === "VERIFYING")
                ? "Executing…"
                : "CONFIRM & EXECUTE"}
            </button>
            {confirmDisabled ? (
              <p
                data-testid="x200-confirm-disabled-reason"
                className="text-[11px] text-gold"
              >
                {confirmDisabledReason}
              </p>
            ) : (
              <p className="text-[11px] text-gray-muted">
                SUCCESS appears only after remote verification.
              </p>
            )}
            {receipt ? (
              <div
                data-testid="x200-action-receipt"
                className="rounded-sm border border-emerald-500/40 p-3"
              >
                <p className="text-[10px] font-semibold tracking-[0.2em] text-emerald-300 uppercase">
                  ACTION RECEIPT
                </p>
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
            {selectedAction === "DEPLOY_PRODUCTION" && preview ? (
              <pre
                data-testid="x200-deploy-preview-body"
                className="overflow-auto text-[11px] text-gray-muted"
              >
                {JSON.stringify(preview, null, 2)}
              </pre>
            ) : null}
          </div>
        ) : null}
      </PreviewDrawer>
    </>
  );

  if (!plane) {
    return (
      <div className="space-y-4" data-testid="x200-human-actions">
        <p className="text-sm text-gray-muted" data-testid="x200-human-plane-missing">
          Human Action plane unavailable
        </p>
        {consoleUi}
      </div>
    );
  }

  if (activeTab === "HUMAN_ACTIONS") {
    return (
      <div className="space-y-4" data-testid="x200-human-actions">
        {consoleUi}
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
              Preview allowed — mutations disabled until adapter mode is REAL
            </p>
          ) : null}
          <p className="mt-2 text-xs text-gray-muted">
            actor={actorRole} · last action=
            {lastActionAt ? new Date(lastActionAt).toLocaleTimeString() : "none"}
          </p>
        </div>

        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-gold-muted uppercase">
            HUMAN ACTIONS inbox
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton
              testId="x200-mark-ready"
              label="Mark ready for review"
              disabled={!canPreview}
              disabledReason={previewBlockReason}
              onClick={() => openPreview("MARK_READY_FOR_REVIEW")}
            />
            <ActionButton
              testId="x200-copy-required-action"
              label="Copy required action"
              disabled={!snapshot.humanGate.present && !snapshot.humanGate.requiredAction}
              disabledReason={
                snapshot.humanGate.present
                  ? null
                  : "No Human Gate required action"
              }
              onClick={() => {
                void copyText(
                  snapshot.humanGate.requiredAction ??
                    snapshot.humanGate.reason ??
                    "HUMAN_GATE",
                );
                setToast("Copied required action");
                setPhase("IDLE");
              }}
            />
          </div>
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
                <ActionButton
                  testId={`x200-preview-${item.type}`}
                  label="Preview"
                  disabled={!canPreview}
                  disabledReason={previewBlockReason}
                  onClick={() => openPreview(item.type)}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (activeTab === "RELEASE") {
    return (
      <div data-testid="x200-release-center" className="space-y-4">
        {consoleUi}
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
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton
              testId="x200-review-release"
              label="Review release"
              disabled={!canPreview}
              disabledReason={previewBlockReason}
              onClick={() => openPreview("MARK_RELEASE_READY")}
            />
            <ActionButton
              testId="x200-merge-preview"
              label="Merge preview"
              disabled={!canPreview}
              disabledReason={previewBlockReason}
              onClick={() => openPreview("MERGE_PR")}
            />
          </div>
          <p className="mt-2 text-[11px] text-gold">
            Merge execution is Human Gate only — Confirm & Execute stays disabled until preview preconditions are met.
          </p>
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
        {consoleUi}
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
        <div className="flex flex-wrap gap-2">
          <ActionButton
            testId="x200-deploy-preview"
            label="DEPLOY PRODUCTION preview"
            disabled={!canPreview}
            disabledReason={previewBlockReason}
            onClick={() => openPreview("DEPLOY_PRODUCTION")}
          />
          <ActionButton
            testId="x200-rollback-preview"
            label="ROLLBACK preview"
            disabled={!canPreview}
            disabledReason={previewBlockReason}
            onClick={() => openPreview("ROLLBACK")}
          />
        </div>
      </div>
    );
  }

  if (activeTab === "DATABASE") {
    return (
      <div data-testid="x200-database-center" className="space-y-4">
        {consoleUi}
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <h3 className="text-[11px] font-semibold tracking-[0.2em] text-gold-muted uppercase">
            MIGRATIONS
          </h3>
          <p className="mt-2 text-xs text-gray-muted">
            Pending/Applied lists are not invented. Use Preview then Confirm.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton
              testId="x200-migration-preview"
              label="Preview migration"
              disabled={!canPreview}
              disabledReason={previewBlockReason}
              onClick={() => openPreview("PREVIEW_MIGRATION")}
            />
            <ActionButton
              testId="x200-backup-create"
              label="Create backup (preview)"
              disabled={!canPreview}
              disabledReason={previewBlockReason}
              onClick={() => openPreview("CREATE_BACKUP")}
            />
            <ActionButton
              testId="x200-restore-preview"
              label="Restore (preview)"
              disabled={!canPreview}
              disabledReason={previewBlockReason}
              onClick={() => openPreview("RESTORE_BACKUP")}
            />
          </div>
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
        {consoleUi}
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
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ["COLLECT_DIAGNOSTICS", "Diagnostics"],
                ["RUN_HEALTH_CHECKS", "Health checks"],
                ["ENTER_MAINTENANCE", "Maintenance"],
                ["EMERGENCY_STOP", "Emergency stop"],
                ["RESUME_AUTOMATION", "Recovery (resume)"],
              ] as Array<[HumanActionType, string]>
            ).map(([action, label]) => (
              <ActionButton
                key={action}
                testId={`x200-incident-${action}`}
                label={label}
                disabled={!canPreview}
                disabledReason={previewBlockReason}
                onClick={() => {
                  setReason(action);
                  openPreview(action);
                }}
              />
            ))}
          </div>
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
        {consoleUi}
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

  return consoleUi;
}
