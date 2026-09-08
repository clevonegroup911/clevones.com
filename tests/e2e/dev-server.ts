import { execFileSync } from "node:child_process";
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  E2E_PORT,
  e2eAppEnv,
  resolveProvidedE2eDatabaseUrl,
} from "./env";
import { startEphemeralE2ePostgres, stopEphemeralE2ePostgres } from "./postgres";
import { seedE2eAdmin } from "./seed";

const STATE_FILE = join(process.cwd(), "tests/e2e/.runtime-state.json");
const FALLBACK_DATABASE_URL =
  "postgresql://e2e:e2e@127.0.0.1:5432/clevones_e2e?schema=public";
const PRISMA_BIN = join(process.cwd(), "node_modules/.bin/prisma");
const NEXT_BIN = join(process.cwd(), "node_modules/.bin/next");

function migrateWithRetry(env: NodeJS.ProcessEnv) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      execFileSync(PRISMA_BIN, ["migrate", "deploy"], {
        env,
        stdio: "inherit",
        encoding: "utf8",
      });
      return;
    } catch (error) {
      lastError = error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("prisma migrate deploy failed for e2e database");
}

async function resolveDatabase(): Promise<{
  databaseUrl: string;
  startedDocker: boolean;
  dbReady: boolean;
}> {
  const provided = resolveProvidedE2eDatabaseUrl();
  if (provided) {
    return { databaseUrl: provided, startedDocker: false, dbReady: true };
  }

  try {
    const ephemeral = await startEphemeralE2ePostgres();
    return {
      databaseUrl: ephemeral.url,
      startedDocker: ephemeral.started,
      dbReady: true,
    };
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).replace(
      /postgresql:\/\/\S+/gi,
      "[redacted-db-url]",
    );
    process.stderr.write(
      `e2e PostgreSQL unavailable (${message}); login/MFA screens still run, fixture login skipped unless CI.\n`,
    );
    stopEphemeralE2ePostgres();
    return {
      databaseUrl: FALLBACK_DATABASE_URL,
      startedDocker: false,
      dbReady: false,
    };
  }
}

async function main() {
  const { databaseUrl, startedDocker, dbReady } = await resolveDatabase();
  const env = e2eAppEnv(databaseUrl);

  if (dbReady) {
    migrateWithRetry(env);
    await seedE2eAdmin(databaseUrl);
  }

  writeFileSync(
    STATE_FILE,
    `${JSON.stringify({ databaseUrl, startedDocker, dbReady }, null, 2)}\n`,
  );

  const child = spawn(
    NEXT_BIN,
    ["dev", "--hostname", "127.0.0.1", "--port", String(E2E_PORT)],
    {
      env,
      stdio: "inherit",
    },
  );

  child.on("exit", (code) => {
    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack : String(error)}\n`,
  );
  process.exit(1);
});
