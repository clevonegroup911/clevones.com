#!/usr/bin/env node
/**
 * Control Center serve wrapper for systemd.
 * - Binds Next.js to 127.0.0.1:3001 only
 * - Safe port ownership (no kill of unknown processes)
 * - Ensures existing clevones-x200-db is started (no recreate / no migrate)
 * - No git pull / branch switch / repo mutation
 */

import { execFile, spawn } from "node:child_process";
import { createServer } from "node:net";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const HOST = "127.0.0.1";
const PORT = 3001;
const DB_CONTAINER = "clevones-x200-db";

function log(msg) {
  console.log(`[x200-control-center] ${msg}`);
}

async function readProc(pid, name) {
  try {
    const buf = await fs.readFile(`/proc/${pid}/${name}`);
    return buf.toString("utf8").replace(/\0/g, " ").trim();
  } catch {
    return null;
  }
}

async function probePort() {
  try {
    const { stdout } = await execFileAsync("ss", ["-ltnp", `sport = :${PORT}`], {
      timeout: 5_000,
    });
    const pidMatch = stdout.match(/pid=(\d+)/);
    if (!pidMatch) {
      return { state: "FREE", pid: null };
    }
    const pid = Number(pidMatch[1]);
    const environ = await readProc(pid, "environ");
    const cmdline = await readProc(pid, "cmdline");
    const cwd = await fs.readlink(`/proc/${pid}/cwd`).catch(() => null);
    const owned =
      (environ && environ.includes("X200_CONTROL_CENTER=1")) ||
      (cwd === ROOT && /next/i.test(cmdline || "")) ||
      (cmdline && cmdline.includes(ROOT) && /next/i.test(cmdline));
    if (owned) {
      return { state: "ALREADY_RUNNING", pid, cmdline };
    }
    return {
      state: "PORT_3001_CONFLICT",
      pid,
      cmdline,
      detail: "Unknown process owns port 3001 — human action required; not killed",
    };
  } catch {
    // Fall back to bind probe
    return await new Promise((resolve) => {
      const server = createServer();
      server.once("error", (err) => {
        if (err && err.code === "EADDRINUSE") {
          resolve({
            state: "PORT_3001_CONFLICT",
            pid: null,
            detail: "Port in use; owner unknown",
          });
        } else {
          resolve({ state: "ERROR", detail: String(err) });
        }
      });
      server.once("listening", () => {
        server.close(() => resolve({ state: "FREE", pid: null }));
      });
      server.listen(PORT, HOST);
    });
  }
}

async function ensureDb() {
  try {
    await execFileAsync("docker", ["info"], { timeout: 5_000 });
  } catch {
    log("DB_AUTOSTART_READY=NO DOCKER=UNAVAILABLE — continuing DEGRADED");
    return {
      DB_CONTAINER,
      DB_RUNNING: "NO",
      DB_HEALTH: "DOCKER_UNAVAILABLE",
      DB_RESTART_POLICY: null,
      DB_AUTOSTART_READY: "NO",
    };
  }

  try {
    await execFileAsync("docker", ["inspect", DB_CONTAINER], { timeout: 5_000 });
  } catch {
    log(`container ${DB_CONTAINER} missing — not recreating`);
    return {
      DB_CONTAINER,
      DB_RUNNING: "NO",
      DB_HEALTH: "MISSING",
      DB_RESTART_POLICY: null,
      DB_AUTOSTART_READY: "NO",
    };
  }

  await execFileAsync(
    "docker",
    ["update", "--restart=unless-stopped", DB_CONTAINER],
    { timeout: 15_000 },
  ).catch(() => null);

  const { stdout: runningRaw } = await execFileAsync(
    "docker",
    ["inspect", "-f", "{{.State.Running}}", DB_CONTAINER],
    { timeout: 5_000 },
  );
  if (runningRaw.trim() !== "true") {
    log(`starting existing container ${DB_CONTAINER}`);
    await execFileAsync("docker", ["start", DB_CONTAINER], { timeout: 60_000 });
  }

  const deadline = Date.now() + 30_000;
  let healthy = false;
  while (Date.now() < deadline) {
    const { stdout } = await execFileAsync(
      "docker",
      [
        "inspect",
        "-f",
        "{{.State.Running}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}",
        DB_CONTAINER,
      ],
      { timeout: 5_000 },
    );
    const [running, health] = stdout.trim().split("|");
    if (running === "true" && (health === "healthy" || health === "none")) {
      healthy = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }

  const { stdout: policy } = await execFileAsync(
    "docker",
    ["inspect", "-f", "{{.HostConfig.RestartPolicy.Name}}", DB_CONTAINER],
    { timeout: 5_000 },
  );

  return {
    DB_CONTAINER,
    DB_RUNNING: "YES",
    DB_HEALTH: healthy ? "OK" : "TIMEOUT",
    DB_RESTART_POLICY: policy.trim(),
    DB_AUTOSTART_READY:
      policy.trim() === "unless-stopped" || policy.trim() === "always"
        ? "YES"
        : "NO",
  };
}

async function main() {
  process.env.X200_CONTROL_CENTER = "1";
  process.env.HOST = HOST;
  process.env.PORT = String(PORT);

  const port = await probePort();
  if (port.state === "ALREADY_RUNNING") {
    log(`ALREADY_RUNNING pid=${port.pid} — supervising existing X200 listener (no duplicate)`);
    // Stay alive so systemd --user reports active; do not bind a second server.
    let stopping = false;
    const stop = () => {
      if (stopping) return;
      stopping = true;
      process.exit(0);
    };
    process.on("SIGTERM", stop);
    process.on("SIGINT", stop);
    // Keep the event loop alive (do not unref) so systemd reports active.
    setInterval(() => {
      // Soft health: if the owned PID disappeared, exit non-zero so Restart=on-failure recovers.
      if (port.pid) {
        try {
          process.kill(port.pid, 0);
        } catch {
          log(`supervised pid ${port.pid} gone — exiting for systemd restart`);
          process.exit(1);
        }
      }
    }, 15_000);
    return;
  }
  if (port.state === "PORT_3001_CONFLICT") {
    log(`PORT_3001_CONFLICT pid=${port.pid ?? "unknown"}`);
    log(port.detail || "human action required");
    process.exit(75); // EX_TEMPFAIL — do not kill unknown process
  }

  const db = await ensureDb();
  for (const [k, v] of Object.entries(db)) {
    log(`${k}=${v}`);
  }

  const nextBin = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
  const hasBuild = await fs
    .access(path.join(ROOT, ".next", "BUILD_ID"))
    .then(() => true)
    .catch(() => false);

  const args = hasBuild
    ? [nextBin, "start", "-H", HOST, "-p", String(PORT)]
    : [nextBin, "dev", "-H", HOST, "-p", String(PORT)];

  if (!hasBuild) {
    log("BUILD_ID missing — using next dev (DEGRADED_DEV_MODE)");
  }

  log(`ExecStart=${process.execPath} ${args.join(" ")}`);
  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    env: { ...process.env, X200_CONTROL_CENTER: "1", HOST, PORT: String(PORT) },
    stdio: "inherit",
  });

  const forward = (sig) => {
    if (child.pid) child.kill(sig);
  };
  process.on("SIGTERM", () => forward("SIGTERM"));
  process.on("SIGINT", () => forward("SIGINT"));

  child.on("exit", (code, signal) => {
    if (signal) process.exit(1);
    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
