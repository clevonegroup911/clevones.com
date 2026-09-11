import { execFileSync, spawnSync } from "node:child_process";
import { createConnection } from "node:net";

export const DOCKER_E2E_CONTAINER = "clevones-e2e-pg";
export const DOCKER_E2E_HOST_PORT = 55432;

function dockerAvailable(): boolean {
  const result = spawnSync("docker", ["info"], {
    encoding: "utf8",
    timeout: 8000,
  });
  return result.status === 0;
}

function containerRunning(): boolean {
  const result = spawnSync(
    "docker",
    ["inspect", "-f", "{{.State.Running}}", DOCKER_E2E_CONTAINER],
    { encoding: "utf8", timeout: 5000 },
  );
  return result.status === 0 && result.stdout.trim() === "true";
}

function waitForTcp(host: string, port: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = createConnection({ host, port });
      const fail = () => {
        socket.destroy();
        if (Date.now() >= deadline) {
          reject(new Error(`e2e PostgreSQL was not reachable on ${host}:${port}`));
          return;
        }
        setTimeout(attempt, 250);
      };
      socket.setTimeout(1000);
      socket.once("connect", () => {
        socket.end();
        resolve();
      });
      socket.once("timeout", fail);
      socket.once("error", fail);
    };
    attempt();
  });
}

function containerIp(): string | null {
  const result = spawnSync(
    "docker",
    ["inspect", "-f", "{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}", DOCKER_E2E_CONTAINER],
    { encoding: "utf8", timeout: 5000 },
  );
  const ip = result.stdout.trim();
  return ip.length > 0 ? ip : null;
}

export async function startEphemeralE2ePostgres(): Promise<{
  url: string;
  started: boolean;
}> {
  let started = false;
  if (!containerRunning()) {
    if (!dockerAvailable()) {
      throw new Error(
        "Playwright e2e needs a loopback test database (PLAYWRIGHT_DATABASE_URL or Docker).",
      );
    }

    execFileSync(
      "docker",
      [
        "run",
        "-d",
        "--rm",
        "--name",
        DOCKER_E2E_CONTAINER,
        "-e",
        "POSTGRES_USER=e2e",
        "-e",
        "POSTGRES_PASSWORD=e2e",
        "-e",
        "POSTGRES_DB=clevones_e2e",
        "-p",
        `${DOCKER_E2E_HOST_PORT}:5432`,
        "postgres:16-alpine",
      ],
      { encoding: "utf8", stdio: "pipe" },
    );
    started = true;
  }

  const deadline = Date.now() + 25000;
  let lastError: Error | null = null;
  while (Date.now() < deadline) {
    const hosts: Array<{ host: string; port: number }> = [
      { host: "127.0.0.1", port: DOCKER_E2E_HOST_PORT },
    ];
    const ip = containerIp();
    if (ip) {
      hosts.push({ host: ip, port: 5432 });
    }
    for (const candidate of hosts) {
      try {
        await waitForTcp(candidate.host, candidate.port, 1500);
        return {
          url: `postgresql://e2e:e2e@${candidate.host}:${candidate.port}/clevones_e2e?schema=public`,
          started,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
  }

  throw lastError ?? new Error(
    "Playwright e2e PostgreSQL started in Docker but is not reachable from the host.",
  );
}

export function stopEphemeralE2ePostgres(): void {
  spawnSync("docker", ["rm", "-f", DOCKER_E2E_CONTAINER], {
    encoding: "utf8",
    timeout: 10000,
  });
}
