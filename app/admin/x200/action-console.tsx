"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";

import type { ActionPreview, ActionReceipt } from "@/lib/x200/actions/types";

export type ActionPhase =
  | "IDLE"
  | "PREPARING"
  | "PREVIEW_READY"
  | "CONFIRMATION_REQUIRED"
  | "RUNNING"
  | "VERIFYING"
  | "SUCCESS"
  | "FAILED"
  | "BLOCKED";

export function useDialogA11y(
  open: boolean,
  onClose: () => void,
  ref: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const root = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    const focusables = () =>
      [
        ...(root?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? []),
      ].filter((el) => el.offsetParent !== null || el === document.activeElement);
    focusables()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !root) return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      previous?.focus?.();
    };
  }, [open, onClose, ref]);
}

export function formatPreviewCopy(preview: Record<string, unknown> | ActionPreview): string {
  return JSON.stringify(preview, null, 2);
}

export function ActionToast({
  phase,
  message,
}: {
  phase: ActionPhase;
  message: string | null;
}) {
  if (!message) return null;
  const tone =
    phase === "SUCCESS"
      ? "border-emerald-500/50 text-emerald-200"
      : phase === "FAILED" || phase === "BLOCKED"
        ? "border-red-500/50 text-red-200"
        : "border-gold/50 text-gold";
  return (
    <div
      data-testid="x200-action-toast"
      role="status"
      className={`pointer-events-none fixed top-4 left-4 right-4 z-[90] rounded-sm border bg-surface-elevated px-3 py-2 text-xs shadow-lg md:left-auto md:w-[28rem] ${tone}`}
    >
      <span data-testid="x200-action-phase" className="font-semibold tracking-wide uppercase">
        {phase}
      </span>
      {" — "}
      {message}
    </div>
  );
}

function Field({
  label,
  testId,
  children,
}: {
  label: string;
  testId: string;
  children: ReactNode;
}) {
  return (
    <div data-testid={testId}>
      <dt className="text-[10px] tracking-[0.16em] text-gold-muted uppercase">{label}</dt>
      <dd className="mt-0.5 break-all text-xs text-white">{children}</dd>
    </div>
  );
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "N/A";
  if (Array.isArray(value)) return value.length ? value.map(String).join("; ") : "N/A";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export function PreviewDrawer({
  open,
  phase,
  preview,
  errorCode,
  errorMessage,
  actorRole,
  lastActionAt,
  receipt,
  durationMs,
  onClose,
  onCopy,
  onRefresh,
  onCopyError,
  children,
}: {
  open: boolean;
  phase: ActionPhase;
  preview: ActionPreview | Record<string, unknown> | null;
  errorCode: string | null;
  errorMessage: string | null;
  actorRole: string;
  lastActionAt: number | null;
  receipt: ActionReceipt | null;
  durationMs: number | null;
  onClose: () => void;
  onCopy: () => void;
  onRefresh: () => void;
  onCopyError: () => void;
  children?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(open, onClose, panelRef);
  if (!open) return null;
  const record = (preview ?? {}) as Record<string, unknown>;
  const loading = phase === "PREPARING";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-end bg-black/55 md:items-stretch"
      data-testid="x200-preview-drawer-root"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Action preview"
        data-testid="x200-action-preview"
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-md border border-gold/40 bg-surface-elevated shadow-2xl md:h-full md:max-h-none md:w-[32rem] md:rounded-none md:border-l"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-2 border-b border-border-subtle px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-gold uppercase">
              Action console
            </p>
            <p className="mt-1 text-sm text-white">
              {loading ? "Loading preview…" : display(record.action ?? "Preview")}
            </p>
          </div>
          <button
            type="button"
            data-testid="x200-preview-close"
            onClick={onClose}
            className="rounded-sm border border-border-subtle px-2 py-1 text-xs text-gray-muted"
          >
            Close
          </button>
        </header>
        <div className="flex-1 overflow-auto px-4 py-3">
          {loading ? (
            <p data-testid="x200-preview-loading" className="text-sm text-gold">
              Loading preview…
            </p>
          ) : phase === "FAILED" ? (
            <div data-testid="x200-preview-failed" className="space-y-2">
              <p className="text-sm font-semibold text-red-300">FAILED</p>
              <p className="font-mono text-xs text-red-200">
                {errorCode ?? "UNKNOWN"} — {errorMessage ?? "preview failed"}
              </p>
              <button
                type="button"
                data-testid="x200-copy-error"
                onClick={onCopyError}
                className="rounded-sm border border-border-subtle px-2 py-1 text-[10px] text-white"
              >
                Copy error details
              </button>
            </div>
          ) : (
            <dl className="grid gap-3">
              <Field label="ACTION" testId="x200-preview-field-action">
                {display(record.action)}
              </Field>
              <Field label="TARGET" testId="x200-preview-field-target">
                {display(record.target)}
              </Field>
              <Field label="ENVIRONMENT" testId="x200-preview-field-environment">
                {display(record.environment)}
              </Field>
              <Field label="PR NUMBER" testId="x200-preview-field-pr">
                {display(record.prNumber)}
              </Field>
              <Field label="EXACT SHA" testId="x200-preview-field-sha">
                {display(record.exactSha)}
              </Field>
              <Field label="CURRENT REMOTE SHA" testId="x200-preview-field-remote-sha">
                {display(record.currentRemoteSha)}
              </Field>
              <Field label="EXPECTED CHANGES" testId="x200-preview-field-changes">
                {display(record.expectedChanges)}
              </Field>
              <Field label="RISKS" testId="x200-preview-field-risks">
                {display(record.risks)}
              </Field>
              <Field label="PRECONDITIONS" testId="x200-preview-field-preconditions">
                {display(record.preconditions)}
              </Field>
              <Field label="HUMAN GATE" testId="x200-preview-field-human-gate">
                {display(record.humanGate)}
              </Field>
              <Field label="MFA REQUIREMENT" testId="x200-preview-field-mfa">
                {display(record.mfaRequired)}
              </Field>
              <Field label="TYPED CONFIRMATION" testId="x200-preview-field-typed">
                {display(record.typedPhrase ?? record.typedConfirmationRequired)}
              </Field>
              <Field label="ROLLBACK" testId="x200-preview-field-rollback">
                {display(record.rollback)}
              </Field>
              <Field label="SOURCE" testId="x200-preview-field-source">
                {display(record.source)}
              </Field>
              <Field label="VERIFICATION STATUS" testId="x200-preview-field-verification">
                {display(record.verificationStatus)}
              </Field>
              <Field label="ACTOR" testId="x200-preview-field-actor">
                {actorRole}
              </Field>
              <Field label="LAST ACTION" testId="x200-last-action">
                {lastActionAt ? new Date(lastActionAt).toLocaleString() : "N/A"}
              </Field>
              <Field label="RECEIPT ID" testId="x200-receipt-id">
                {display(receipt?.actionId)}
              </Field>
              <Field label="DURATION" testId="x200-action-duration">
                {durationMs != null ? `${durationMs}ms` : "N/A"}
              </Field>
            </dl>
          )}
          {children}
        </div>
        <footer className="flex flex-wrap gap-2 border-t border-border-subtle px-4 py-3">
          <button
            type="button"
            data-testid="x200-preview-copy"
            onClick={onCopy}
            disabled={!preview}
            title={!preview ? "No preview payload yet" : "Copy preview JSON"}
            className="rounded-sm border border-border-subtle px-2 py-1 text-xs text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Copy preview
          </button>
          <button
            type="button"
            data-testid="x200-preview-refresh"
            onClick={onRefresh}
            className="rounded-sm border border-gold/40 px-2 py-1 text-xs text-gold"
          >
            Refresh preview
          </button>
        </footer>
      </div>
    </div>
  );
}

export function DisabledReason({
  reason,
  testId,
}: {
  reason: string | null | undefined;
  testId?: string;
}) {
  if (!reason) return null;
  return (
    <p
      data-testid={testId ?? "x200-disabled-reason"}
      className="mt-1 text-[10px] text-gray-muted"
    >
      {reason}
    </p>
  );
}
