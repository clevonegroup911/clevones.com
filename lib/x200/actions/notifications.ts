import type { NotificationAdapterStatus } from "@/lib/x200/actions/types";

export const X200_NOTIFICATION_EVENTS = [
  "CI_FAILED",
  "HUMAN_GATE_WAITING",
  "DEPLOY_COMPLETED",
  "DEPLOY_FAILED",
  "MIGRATION_WAITING",
  "TELEMETRY_STALE",
  "AGENT_STALLED",
  "PR_READY",
  "INCIDENT_SEV1",
] as const;

export type X200NotificationEvent = (typeof X200_NOTIFICATION_EVENTS)[number];

/**
 * Notification Center abstraction — adapters only report configuration.
 * Never invents delivery.
 */
export function buildNotificationAdapterStatus(
  env: NodeJS.ProcessEnv = process.env,
): NotificationAdapterStatus[] {
  const emailProvider = env.EMAIL_PROVIDER?.trim();
  const emailReady =
    emailProvider === "smtp" ||
    emailProvider === "resend" ||
    emailProvider === "sendgrid";

  return [
    {
      adapter: "email",
      status: emailReady ? "READY" : "NOT_CONFIGURED",
    },
    {
      adapter: "sms",
      status: "NOT_CONFIGURED",
    },
    {
      adapter: "slack",
      status: "NOT_CONFIGURED",
    },
  ];
}

export function notifyEvent(event: X200NotificationEvent): {
  delivered: false;
  status: "NOT_CONFIGURED";
  event: X200NotificationEvent;
} {
  return { delivered: false, status: "NOT_CONFIGURED", event };
}
