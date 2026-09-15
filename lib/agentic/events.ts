import { createHash } from "node:crypto";

import type { AgentRiskLevel, PolicyLayer } from "@/lib/agentic/types";

export const DOMAIN_EVENT_TYPES = [
  "payment.received",
  "payment.proof_uploaded",
  "payment.reconciliation_failed",
  "lead.created",
  "lead.qualified",
  "proposal.requested",
  "document.uploaded",
  "document.approval_requested",
  "document.expiring",
  "invoice.created",
  "invoice.overdue",
  "customer.created",
  "task.completed",
  "task.failed",
  "github.pr_created",
  "github.ci_passed",
  "github.ci_failed",
] as const;

export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[number];

export type DomainEventActor = {
  type: "user" | "agent" | "system";
  id: string;
};

export type DomainEventSource =
  | "clevone.internal"
  | "clevone.sandbox"
  | "clevone.official"
  | "client.upload"
  | "github"
  | "unknown";

export type DomainEventEnvelope = {
  eventId: string;
  eventType: DomainEventType | string;
  idempotencyKey: string;
  correlationId: string;
  source: DomainEventSource;
  actor: DomainEventActor;
  risk: AgentRiskLevel;
  timestamp: string;
  /** Opaque business payload. Treated as DATA, never as policy. */
  payload: Record<string, unknown>;
  contentLayer: PolicyLayer;
  payloadDigest: string;
};

export type RecordEventInput = Omit<DomainEventEnvelope, "payloadDigest" | "eventId"> & {
  eventId?: string;
};

export type RecordEventResult =
  | { status: "recorded"; event: DomainEventEnvelope }
  | { status: "duplicate"; event: DomainEventEnvelope }
  | { status: "conflict"; event: DomainEventEnvelope; existing: DomainEventEnvelope };

export class DomainEventConflictError extends Error {
  readonly existing: DomainEventEnvelope;
  readonly incoming: DomainEventEnvelope;

  constructor(existing: DomainEventEnvelope, incoming: DomainEventEnvelope) {
    super("domain_event_conflict");
    this.name = "DomainEventConflictError";
    this.existing = existing;
    this.incoming = incoming;
  }
}

export function isDomainEventType(value: string): value is DomainEventType {
  return (DOMAIN_EVENT_TYPES as readonly string[]).includes(value);
}

export function digestPayload(payload: Record<string, unknown>): string {
  const canonical = JSON.stringify(sortValue(payload));
  return createHash("sha256").update(canonical).digest("hex");
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const out: Record<string, unknown> = {};
    for (const [key, child] of entries) {
      out[key] = sortValue(child);
    }
    return out;
  }
  return value;
}

export function buildDomainEvent(input: RecordEventInput): DomainEventEnvelope {
  const idempotencyKey = input.idempotencyKey.trim();
  if (!idempotencyKey) {
    throw new Error("idempotencyKey required");
  }
  if (!input.correlationId.trim()) {
    throw new Error("correlationId required");
  }
  return {
    eventId: input.eventId ?? idempotencyKey,
    eventType: input.eventType,
    idempotencyKey,
    correlationId: input.correlationId.trim(),
    source: input.source,
    actor: { ...input.actor },
    risk: input.risk,
    timestamp: input.timestamp,
    payload: { ...input.payload },
    contentLayer: input.contentLayer,
    payloadDigest: digestPayload(input.payload),
  };
}

/**
 * In-process idempotent log. Same key + same digest = duplicate (no second effect).
 * Same key + different digest = conflict (caller must not execute a second action).
 * Payment persistence remains in lib/payments/persist.ts — this log does not replace it.
 */
export class DomainEventLog {
  private readonly byKey = new Map<string, DomainEventEnvelope>();

  get size(): number {
    return this.byKey.size;
  }

  get(idempotencyKey: string): DomainEventEnvelope | null {
    return this.byKey.get(idempotencyKey) ?? null;
  }

  record(input: RecordEventInput): RecordEventResult {
    const incoming = buildDomainEvent(input);
    const existing = this.byKey.get(incoming.idempotencyKey);
    if (!existing) {
      this.byKey.set(incoming.idempotencyKey, incoming);
      return { status: "recorded", event: incoming };
    }
    if (existing.payloadDigest === incoming.payloadDigest) {
      return { status: "duplicate", event: existing };
    }
    return { status: "conflict", event: incoming, existing };
  }

  recordOrThrow(input: RecordEventInput): DomainEventEnvelope {
    const result = this.record(input);
    if (result.status === "conflict") {
      throw new DomainEventConflictError(result.existing, result.event);
    }
    return result.event;
  }
}
