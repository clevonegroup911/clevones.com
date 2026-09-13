"use client";

import { useState } from "react";

import type { ControlCenterSnapshot } from "@/lib/x200/types";
import type { BootActionId } from "@/lib/x200/boot/types";
import { CONTROL_CENTER_URL } from "@/lib/x200/boot/constants";

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

const BOOT_ACTIONS: Array<{ id: BootActionId; label: string; confirm?: boolean }> = [
  { id: "START_CONTROL_CENTER", label: "START CONTROL CENTER" },
  { id: "RESTART_CONTROL_CENTER", label: "RESTART CONTROL CENTER" },
  { id: "START_AUTOPILOT", label: "START AUTOPILOT" },
  { id: "RESTART_AUTOPILOT", label: "RESTART AUTOPILOT" },
  { id: "START_DATABASE", label: "START DATABASE" },
  { id: "ENABLE_AUTOSTART", label: "ENABLE AUTO-START" },
  { id: "DISABLE_AUTOSTART", label: "DISABLE AUTO-START", confirm: true },
  { id: "REFRESH_STARTUP_STATUS", label: "REFRESH STARTUP STATUS" },
  { id: "OPEN_CONTROL_CENTER", label: "OPEN CONTROL CENTER" },
  { id: "COPY_DIAGNOSTICS", label: "COPY DIAGNOSTICS" },
];

export function BootBadge({
  snapshot,
  onOpenStartup,
}: {
  snapshot: ControlCenterSnapshot;
  onOpenStartup: () => void;
}) {
  const overall = snapshot.boot?.overall ?? "NOT_INSTALLED";
  const tone =
    overall === "READY"
      ? "border-emerald-500/50 text-emerald-300"
      : overall === "NOT_INSTALLED"
        ? "border-border-subtle text-gray-muted"
        : "border-amber-500/50 text-amber-200";
  return (
    <button
      type="button"
      data-testid="x200-boot-badge"
      onClick={onOpenStartup}
      className={`rounded-sm border px-2 py-1 text-[11px] font-semibold tracking-wide uppercase ${tone}`}
      title={snapshot.boot?.missing.join(", ") || "Open STARTUP tab"}
    >
      BOOT: {overall}
    </button>
  );
}

export function StartupPanels({
  snapshot,
  actorRole,
  onRefresh,
}: {
  snapshot: ControlCenterSnapshot;
  actorRole: "SUPER_ADMIN" | "ADMIN" | "UNKNOWN";
  onRefresh: () => void;
}) {
  const boot = snapshot.boot;
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [confirmDisable, setConfirmDisable] = useState(false);

  async function runAction(action: BootActionId, needsConfirm?: boolean) {
    if (action === "REFRESH_STARTUP_STATUS") {
      onRefresh();
      return;
    }
    if (action === "OPEN_CONTROL_CENTER") {
      window.open(CONTROL_CENTER_URL, "_blank", "noopener,noreferrer");
      return;
    }
    if (action === "COPY_DIAGNOSTICS") {
      await copyText(boot?.diagnosticsText ?? "boot status unavailable");
      setResult("Diagnostics copied");
      return;
    }
    if (needsConfirm && !confirmDisable) {
      setConfirmDisable(true);
      setResult("Confirm DISABLE AUTO-START by clicking again");
      return;
    }

    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/x200/boot-actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          confirmDisable: action === "DISABLE_AUTOSTART" ? true : undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        code?: string;
      };
      setResult(
        `${body.ok ? "SUCCESS" : "FAILED"} — ${body.message ?? body.code ?? res.status}`,
      );
      if (body.ok) onRefresh();
    } catch (error) {
      setResult(error instanceof Error ? error.message : "request failed");
    } finally {
      setBusy(false);
      if (action === "DISABLE_AUTOSTART") setConfirmDisable(false);
    }
  }

  if (!boot) {
    return (
      <Card title="STARTUP" testId="x200-startup-panel">
        <p className="text-sm text-gray-muted">Boot orchestrator status unavailable.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4" data-testid="x200-startup-panel">
      <Card title="BOOT / STARTUP" testId="x200-startup-overview">
        <p className="text-lg font-semibold text-white" data-testid="x200-boot-overall">
          BOOT: {boot.overall}
        </p>
        {boot.overall === "READY" ? (
          <ul className="mt-2 space-y-1 text-xs text-emerald-300">
            <li>BOOT READY</li>
            <li>DB READY</li>
            <li>CONTROL CENTER ACTIVE</li>
            <li>AUTOPILOT ACTIVE</li>
            <li>BROWSER AUTO-OPEN READY</li>
          </ul>
        ) : (
          <div className="mt-2 text-xs text-amber-200">
            <p>Missing / required:</p>
            <ul className="mt-1 list-disc pl-5">
              {boot.missing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {boot.linger.lingerRequired ? (
              <p className="mt-2 font-mono text-amber-100" data-testid="x200-linger-command">
                {boot.linger.enableCommand}
              </p>
            ) : null}
          </div>
        )}
      </Card>

      <Card title="VERIFIED FACTS" testId="x200-startup-facts">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {boot.facts.map((cell) => (
            <div
              key={cell.id}
              className="rounded-sm border border-border-subtle/60 p-2 text-xs"
              data-testid={`x200-boot-fact-${cell.id}`}
            >
              <p className="text-gold-muted uppercase tracking-wide">{cell.label}</p>
              <p className="mt-1 text-white break-all">{display(cell.value)}</p>
              <p className="mt-1 text-[10px] text-gray-muted">
                SOURCE={cell.source} · {cell.verification} · {cell.freshness}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="SAFE STARTUP ACTIONS" testId="x200-startup-actions">
        <p className="mb-2 text-xs text-gray-muted">
          role={actorRole} · allowlisted units only · no arbitrary shell
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BOOT_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              data-testid={`x200-boot-action-${action.id}`}
              disabled={busy || actorRole !== "SUPER_ADMIN"}
              onClick={() => void runAction(action.id, action.confirm)}
              className="min-h-11 rounded-sm border border-gold/40 bg-gold/10 px-3 py-2 text-left text-xs text-gold disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
        {result ? (
          <p className="mt-3 text-sm text-white" data-testid="x200-boot-action-result">
            {result}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
