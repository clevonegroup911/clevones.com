/**
 * In-memory MFA database used by unit tests only.
 * Do not import this helper from production modules.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

if (process.env.NODE_ENV === "production") {
  throw new Error(
    "mfa-memory-db is a test helper and must not be imported in production.",
  );
}

type Row = Record<string, unknown>;

const lockContext = new AsyncLocalStorage<boolean>();

class SerialLock {
  private chain: Promise<void> = Promise.resolve();

  async run<T>(fn: () => Promise<T> | T): Promise<T> {
    if (lockContext.getStore()) {
      return await fn();
    }

    let release!: () => void;
    const turn = this.chain;
    this.chain = new Promise<void>((resolve) => {
      release = resolve;
    });
    await turn;
    try {
      return await lockContext.run(true, async () => fn());
    } finally {
      release();
    }
  }
}

function cloneRow<T extends Row>(row: T): T {
  const cloned: Row = {};
  for (const [key, value] of Object.entries(row)) {
    if (Buffer.isBuffer(value)) {
      cloned[key] = Buffer.from(value);
    } else if (value instanceof Date) {
      cloned[key] = new Date(value.getTime());
    } else {
      cloned[key] = value;
    }
  }
  return cloned as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date) && !Buffer.isBuffer(value);
}

function matchValue(actual: unknown, expected: unknown): boolean {
  if (expected === null) {
    return actual === null || actual === undefined;
  }

  if (expected instanceof Date) {
    return actual instanceof Date && actual.getTime() === expected.getTime();
  }

  if (isPlainObject(expected)) {
    if ("gt" in expected) {
      const bound = expected.gt;
      if (actual instanceof Date && bound instanceof Date) {
        return actual.getTime() > bound.getTime();
      }
      if (typeof actual === "number" && typeof bound === "number") {
        return actual > bound;
      }
      return false;
    }
    if ("lt" in expected) {
      const bound = expected.lt;
      if (actual == null) {
        return false;
      }
      if (actual instanceof Date && bound instanceof Date) {
        return actual.getTime() < bound.getTime();
      }
      if (typeof actual === "number" && typeof bound === "number") {
        return actual < bound;
      }
      return false;
    }
    return matchWhere(actual as Row, expected);
  }

  return actual === expected;
}

function matchWhere(row: Row, where: Record<string, unknown>): boolean {
  for (const [key, expected] of Object.entries(where)) {
    if (key === "OR" && Array.isArray(expected)) {
      if (!expected.some((clause) => matchWhere(row, clause as Record<string, unknown>))) {
        return false;
      }
      continue;
    }

    if (key === "AND" && Array.isArray(expected)) {
      if (!expected.every((clause) => matchWhere(row, clause as Record<string, unknown>))) {
        return false;
      }
      continue;
    }

    if (!matchValue(row[key], expected)) {
      return false;
    }
  }

  return true;
}

function applyData(row: Row, data: Record<string, unknown>): Row {
  const next = cloneRow(row);
  for (const [key, value] of Object.entries(data)) {
    if (isPlainObject(value) && typeof value.increment === "number") {
      next[key] = Number(next[key] ?? 0) + value.increment;
    } else {
      next[key] = value instanceof Date ? new Date(value.getTime()) : value;
    }
  }
  return next;
}

type TableApi = {
  create(args: { data: Row }): Promise<Row>;
  findUnique(args: { where: Row; select?: Row }): Promise<Row | null>;
  findFirst(args: { where: Row }): Promise<Row | null>;
  update(args: { where: Row; data: Row }): Promise<Row>;
  updateMany(args: { where: Row; data: Row }): Promise<{ count: number }>;
  delete(args: { where: Row }): Promise<Row>;
  deleteMany(args: { where: Row }): Promise<{ count: number }>;
};

export type MfaMemoryDb = {
  readonly _memory: true;
  user: TableApi;
  userMfaSecret: TableApi & {
    upsert(args: { where: { userId: string }; create: Row; update: Row }): Promise<Row>;
  };
  mfaRecoveryCode: TableApi & {
    createMany(args: { data: Row[] }): Promise<{ count: number }>;
  };
  mfaChallenge: TableApi;
  mfaRateLimit: TableApi & {
    upsert(args: {
      where: { subjectType_subjectHash: { subjectType: string; subjectHash: string } };
      create: Row;
      update: Row;
    }): Promise<Row>;
  };
  $transaction<T>(fn: (tx: MfaMemoryDb) => Promise<T>): Promise<T>;
};

export function createMfaMemoryDb(): MfaMemoryDb {
  const lock = new SerialLock();
  const users = new Map<string, Row>();
  const secrets = new Map<string, Row>();
  const recoveryCodes = new Map<string, Row>();
  const challenges = new Map<string, Row>();
  const rateLimits = new Map<string, Row>();

  const rateLimitKey = (subjectType: string, subjectHash: string) =>
    `${subjectType}:${subjectHash}`;

  const tableApi = (table: Map<string, Row>): TableApi => ({
    async create({ data }: { data: Row }) {
      return lock.run(() => {
        const id = typeof data.id === "string" ? data.id : randomUUID();
        const row = cloneRow({
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
          id,
        });
        table.set(id, row);
        return cloneRow(row);
      });
    },
    async findUnique({ where }: { where: Row; select?: Row }) {
      return lock.run(() => {
        if (typeof where.id === "string") {
          const row = table.get(where.id);
          return row ? cloneRow(row) : null;
        }
        const found = [...table.values()].find((row) => matchWhere(row, where));
        return found ? cloneRow(found) : null;
      });
    },
    async findFirst({ where }: { where: Row }) {
      return lock.run(() => {
        const found = [...table.values()].find((row) => matchWhere(row, where));
        return found ? cloneRow(found) : null;
      });
    },
    async update({ where, data }: { where: Row; data: Row }) {
      return lock.run(() => {
        const current =
          typeof where.id === "string"
            ? table.get(where.id)
            : [...table.values()].find((row) => matchWhere(row, where));
        if (!current) {
          throw new Error("Record to update not found.");
        }
        const next = applyData(current, { ...data, updatedAt: new Date() });
        table.set(String(next.id), next);
        return cloneRow(next);
      });
    },
    async updateMany({ where, data }: { where: Row; data: Row }) {
      return lock.run(() => {
        let count = 0;
        for (const [id, row] of table) {
          if (matchWhere(row, where)) {
            table.set(id, applyData(row, { ...data, updatedAt: new Date() }));
            count += 1;
          }
        }
        return { count };
      });
    },
    async delete({ where }: { where: Row }) {
      return lock.run(() => {
        const current =
          typeof where.id === "string"
            ? table.get(where.id)
            : [...table.values()].find((row) => matchWhere(row, where));
        if (!current) {
          throw new Error("Record to delete not found.");
        }
        table.delete(String(current.id));
        return cloneRow(current);
      });
    },
    async deleteMany({ where }: { where: Row }) {
      return lock.run(() => {
        let count = 0;
        for (const [id, row] of [...table.entries()]) {
          if (matchWhere(row, where)) {
            table.delete(id);
            count += 1;
          }
        }
        return { count };
      });
    },
  });

  const client: MfaMemoryDb = {
    _memory: true,
    user: {
      ...tableApi(users),
    },
    userMfaSecret: {
      ...tableApi(secrets),
      async findUnique({ where }: { where: Row }) {
        return lock.run(() => {
          if (typeof where.id === "string") {
            const row = secrets.get(where.id);
            return row ? cloneRow(row) : null;
          }
          if (typeof where.userId === "string") {
            const row = [...secrets.values()].find((item) => item.userId === where.userId);
            return row ? cloneRow(row) : null;
          }
          return null;
        });
      },
      async upsert({
        where,
        create,
        update,
      }: {
        where: { userId: string };
        create: Row;
        update: Row;
      }) {
        return lock.run(async () => {
          const existing = [...secrets.values()].find((row) => row.userId === where.userId);
          if (!existing) {
            const id = typeof create.id === "string" ? create.id : randomUUID();
            const row = cloneRow({
              createdAt: new Date(),
              updatedAt: new Date(),
              lastUsedStep: null,
              pendingExpiresAt: null,
              ...create,
              id,
            });
            secrets.set(id, row);
            return cloneRow(row);
          }
          const next = applyData(existing, { ...update, updatedAt: new Date() });
          secrets.set(String(next.id), next);
          return cloneRow(next);
        });
      },
    },
    mfaRecoveryCode: {
      ...tableApi(recoveryCodes),
      async createMany({ data }: { data: Row[] }) {
        return lock.run(() => {
          for (const item of data) {
            const id = typeof item.id === "string" ? item.id : randomUUID();
            recoveryCodes.set(
              id,
              cloneRow({
                createdAt: new Date(),
                usedAt: null,
                ...item,
                id,
              }),
            );
          }
          return { count: data.length };
        });
      },
      async deleteMany({ where }: { where: Row }) {
        return lock.run(() => {
          let count = 0;
          const secretFilter = isPlainObject(where.secret)
            ? (where.secret as { userId?: string }).userId
            : undefined;
          const allowedSecretIds = secretFilter
            ? new Set(
                [...secrets.values()]
                  .filter((secret) => secret.userId === secretFilter)
                  .map((secret) => String(secret.id)),
              )
            : null;

          for (const [id, row] of [...recoveryCodes.entries()]) {
            const matchesSecret =
              allowedSecretIds === null || allowedSecretIds.has(String(row.secretId));
            const rest = { ...where };
            delete rest.secret;
            if (matchesSecret && matchWhere(row, rest)) {
              recoveryCodes.delete(id);
              count += 1;
            }
          }
          return { count };
        });
      },
    },
    mfaChallenge: tableApi(challenges),
    mfaRateLimit: {
      ...tableApi(rateLimits),
      async findUnique({
        where,
      }: {
        where: { id?: string; subjectType_subjectHash?: { subjectType: string; subjectHash: string } };
      }) {
        return lock.run(() => {
          if (where.id) {
            const row = [...rateLimits.values()].find((item) => item.id === where.id);
            return row ? cloneRow(row) : null;
          }
          if (where.subjectType_subjectHash) {
            const row = rateLimits.get(
              rateLimitKey(
                where.subjectType_subjectHash.subjectType,
                where.subjectType_subjectHash.subjectHash,
              ),
            );
            return row ? cloneRow(row) : null;
          }
          return null;
        });
      },
      async updateMany({ where, data }: { where: Row; data: Row }) {
        return lock.run(() => {
          let count = 0;
          for (const [id, row] of rateLimits) {
            if (matchWhere(row, where)) {
              rateLimits.set(id, applyData(row, { ...data, updatedAt: new Date() }));
              count += 1;
            }
          }
          return { count };
        });
      },
      async upsert({
        where,
        create,
        update,
      }: {
        where: { subjectType_subjectHash: { subjectType: string; subjectHash: string } };
        create: Row;
        update: Row;
      }) {
        return lock.run(() => {
          const key = rateLimitKey(
            where.subjectType_subjectHash.subjectType,
            where.subjectType_subjectHash.subjectHash,
          );
          const existing = rateLimits.get(key);
          if (!existing) {
            const id = typeof create.id === "string" ? create.id : randomUUID();
            const row = cloneRow({
              createdAt: new Date(),
              updatedAt: new Date(),
              ...create,
              id,
            });
            rateLimits.set(key, row);
            return cloneRow(row);
          }
          const next = applyData(existing, { ...update, updatedAt: new Date() });
          rateLimits.set(key, next);
          return cloneRow(next);
        });
      },
      async deleteMany({ where }: { where: Row }) {
        return lock.run(() => {
          let count = 0;
          for (const [id, row] of [...rateLimits.entries()]) {
            if (matchWhere(row, where)) {
              rateLimits.delete(id);
              if (typeof row.subjectType === "string" && typeof row.subjectHash === "string") {
                rateLimits.delete(rateLimitKey(row.subjectType, row.subjectHash));
              }
              count += 1;
            }
          }
          return { count };
        });
      },
    },
    async $transaction<T>(fn: (tx: MfaMemoryDb) => Promise<T>): Promise<T> {
      return lock.run(() => fn(client));
    },
  };

  return client;
}
