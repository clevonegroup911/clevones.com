import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ClevoneEventConflictError,
  persistClevoneOfficialEvent,
} from "@/lib/payments/persist";
import type { ClevoneOfficialEvent } from "@/lib/payments/reconciliation";

type EventRow = {
  id: string;
  eventType: string;
  idempotencyKey: string;
  orderId: string | null;
  invoiceId: string | null;
  paymentId: string | null;
  payload: unknown;
  createdAt: Date;
};

function createMemoryEventClient(seed: EventRow[] = []) {
  const rows = new Map(seed.map((row) => [row.idempotencyKey, { ...row }]));
  return {
    rows,
    clevoneGatewayEvent: {
      async findUnique(args: { where: { idempotencyKey: string } }) {
        return rows.get(args.where.idempotencyKey) ?? null;
      },
      async create(args: { data: Omit<EventRow, "createdAt"> & { payload: unknown } }) {
        if (rows.has(args.data.idempotencyKey)) {
          const err = new Error("Unique constraint failed") as Error & {
            code: string;
          };
          err.code = "P2002";
          throw err;
        }
        const row: EventRow = {
          ...args.data,
          orderId: args.data.orderId ?? null,
          invoiceId: args.data.invoiceId ?? null,
          paymentId: args.data.paymentId ?? null,
          createdAt: new Date(),
        };
        rows.set(row.idempotencyKey, row);
        return row;
      },
    },
  };
}

const baseEvent: ClevoneOfficialEvent = {
  eventKey: "evt-immutable-1",
  paymentId: "pay-1",
  invoiceId: "inv-1",
  reference: "REF-1",
  amountCents: 1500,
  currency: "USD",
  authenticated: true,
  source: "CLEVONE_SANDBOX",
};

test("same eventKey + same payload is idempotent", async () => {
  const client = createMemoryEventClient();
  const first = await persistClevoneOfficialEvent(baseEvent, {
    client: client as never,
  });
  const second = await persistClevoneOfficialEvent(baseEvent, {
    client: client as never,
  });
  assert.equal(first.created, true);
  assert.equal(second.created, false);
  assert.equal(client.rows.size, 1);
});

test("same eventKey + other amount → conflict; history unchanged", async () => {
  const client = createMemoryEventClient();
  await persistClevoneOfficialEvent(baseEvent, { client: client as never });
  const before = structuredClone(client.rows.get(baseEvent.eventKey));
  await assert.rejects(
    () =>
      persistClevoneOfficialEvent(
        { ...baseEvent, amountCents: 9999 },
        { client: client as never },
      ),
    (error: unknown) => error instanceof ClevoneEventConflictError,
  );
  assert.deepEqual(client.rows.get(baseEvent.eventKey), before);
});

test("same eventKey + other paymentId → conflict", async () => {
  const client = createMemoryEventClient();
  await persistClevoneOfficialEvent(baseEvent, { client: client as never });
  await assert.rejects(
    () =>
      persistClevoneOfficialEvent(
        { ...baseEvent, paymentId: "pay-other" },
        { client: client as never },
      ),
    (error: unknown) => error instanceof ClevoneEventConflictError,
  );
});

test("same eventKey + other reference → conflict", async () => {
  const client = createMemoryEventClient();
  await persistClevoneOfficialEvent(baseEvent, { client: client as never });
  await assert.rejects(
    () =>
      persistClevoneOfficialEvent(
        { ...baseEvent, reference: "REF-OTHER" },
        { client: client as never },
      ),
    (error: unknown) => error instanceof ClevoneEventConflictError,
  );
});

test("race on UNIQUE create re-reads and conflicts on divergence", async () => {
  const client = createMemoryEventClient([
    {
      id: baseEvent.eventKey,
      eventType: "RECONCILE_CLEVONE_SANDBOX",
      idempotencyKey: baseEvent.eventKey,
      orderId: null,
      invoiceId: "inv-1",
      paymentId: "pay-1",
      payload: {
        reference: "REF-1",
        amountCents: 1500,
        currency: "USD",
        source: "CLEVONE_SANDBOX",
        authenticated: true,
      },
      createdAt: new Date(),
    },
  ]);
  // Simulate lost race: findUnique initially empty then create hits P2002.
  let finds = 0;
  const originalFind = client.clevoneGatewayEvent.findUnique.bind(
    client.clevoneGatewayEvent,
  );
  client.clevoneGatewayEvent.findUnique = async (args) => {
    finds += 1;
    if (finds === 1) {
      return null;
    }
    return originalFind(args);
  };
  await assert.rejects(
    () =>
      persistClevoneOfficialEvent(
        { ...baseEvent, amountCents: 42 },
        { client: client as never },
      ),
    (error: unknown) => error instanceof ClevoneEventConflictError,
  );
});
