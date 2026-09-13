import type { ControlledLogEntry } from "@/lib/x200/mirror/types";
import { redactMonitoringText } from "@/lib/x200/activity";

/** Controlled logs only — never a free terminal. */
export function buildControlledLogs(input: {
  generatedAt: string;
  telemetryNote: string | null;
  telemetryEvent: string | null;
  warnings: string[];
  receiptSummaries: Array<{
    at: string;
    action: string;
    result: string;
    message: string;
  }>;
  incidentSummaries: Array<{ at: string; message: string; level?: string }>;
  ciSummary: string | null;
}): ControlledLogEntry[] {
  const entries: ControlledLogEntry[] = [];

  if (input.telemetryEvent) {
    entries.push({
      id: `autopilot-${input.generatedAt}`,
      at: input.generatedAt,
      level: "INFO",
      channel: "AUTOPILOT",
      message: redactMonitoringText(input.telemetryEvent, 400),
      source: ".x200/telemetry.json",
    });
  }
  if (input.telemetryNote) {
    entries.push({
      id: `autopilot-note-${input.generatedAt}`,
      at: input.generatedAt,
      level: "WARNING",
      channel: "AUTOPILOT",
      message: redactMonitoringText(input.telemetryNote, 400),
      source: ".x200/telemetry.json",
    });
  }

  if (input.ciSummary) {
    entries.push({
      id: `ci-${input.generatedAt}`,
      at: input.generatedAt,
      level: input.ciSummary.includes("success") ? "INFO" : "ERROR",
      channel: "CI",
      message: redactMonitoringText(input.ciSummary, 400),
      source: "GitHub Actions",
    });
  }

  for (const warning of input.warnings.slice(0, 30)) {
    entries.push({
      id: `app-warn-${warning.slice(0, 24)}`,
      at: input.generatedAt,
      level: "WARNING",
      channel: "application",
      message: redactMonitoringText(warning, 400),
      source: "control-center",
    });
  }

  for (const receipt of input.receiptSummaries.slice(0, 40)) {
    entries.push({
      id: `human-${receipt.at}-${receipt.action}`,
      at: receipt.at,
      level: receipt.result === "SUCCESS" ? "INFO" : "ERROR",
      channel: "human_actions",
      message: redactMonitoringText(
        `${receipt.action} → ${receipt.result}: ${receipt.message}`,
        400,
      ),
      source: ".x200/human-action-audit.jsonl",
    });
  }

  for (const incident of input.incidentSummaries.slice(0, 20)) {
    const level =
      incident.level === "CRITICAL"
        ? "CRITICAL"
        : incident.level === "ERROR"
          ? "ERROR"
          : "WARNING";
    entries.push({
      id: `incident-${incident.at}`,
      at: incident.at,
      level,
      channel: "incidents",
      message: redactMonitoringText(incident.message, 400),
      source: ".x200/incidents",
    });
  }

  return entries.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 100);
}
