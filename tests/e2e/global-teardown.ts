import { readFileSync } from "node:fs";
import { join } from "node:path";

import { stopEphemeralE2ePostgres } from "./postgres";

const STATE_FILE = join(process.cwd(), "tests/e2e/.runtime-state.json");

export default async function globalTeardown(): Promise<void> {
  try {
    const state = JSON.parse(readFileSync(STATE_FILE, "utf8")) as {
      startedDocker?: boolean;
    };
    if (state.startedDocker) {
      stopEphemeralE2ePostgres();
    }
  } catch {
    // No runtime state — nothing to stop.
  }
}
