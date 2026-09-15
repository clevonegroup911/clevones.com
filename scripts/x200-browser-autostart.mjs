#!/usr/bin/env node
/**
 * Graphical-session browser autostart.
 * Waits for Control Center, opens exactly once per desktop session via xdg-open.
 * Fixed argv / fixed URL only. Timeout instead of endless loop.
 */

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const URL = "http://127.0.0.1:3001/admin/x200";
const TIMEOUT_MS = 90_000;
const POLL_MS = 2_000;

function log(msg) {
  console.log(`[x200-browser-autostart] ${msg}`);
}

async function notify(summary, body) {
  try {
    await execFileAsync(
      "notify-send",
      ["--app-name=CLEVONE X200", summary, body],
      { timeout: 5_000 },
    );
  } catch {
    log(`notify skipped: ${summary} — ${body}`);
  }
}

async function reachable() {
  try {
    const res = await fetch(URL, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(3_000),
    });
    // Success or redirect to authenticated login are both OK.
    return (
      (res.status >= 200 && res.status < 400) ||
      res.status === 401 ||
      res.status === 303 ||
      res.status === 307 ||
      res.status === 308
    );
  } catch {
    return false;
  }
}

function sessionBootId() {
  return (
    process.env.XDG_SESSION_ID ||
    process.env.DESKTOP_SESSION ||
    process.env.XDG_CURRENT_DESKTOP ||
    "default"
  );
}

function markerPath() {
  const digest = createHash("sha256")
    .update(sessionBootId())
    .digest("hex")
    .slice(0, 16);
  const base = process.env.XDG_RUNTIME_DIR || path.join(tmpdir(), "x200");
  return path.join(base, `x200-browser-opened-${digest}`);
}

async function main() {
  const marker = markerPath();
  try {
    await fs.access(marker);
    log("ALREADY_OPENED_THIS_SESSION — skip");
    return;
  } catch {
    // first open
  }

  const deadline = Date.now() + TIMEOUT_MS;
  let ok = false;
  while (Date.now() < deadline) {
    ok = await reachable();
    if (ok) break;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }

  if (!ok) {
    log("TIMEOUT — Control Center unavailable");
    await notify(
      "CLEVONE X200 Control Center unavailable",
      "Timed out waiting for http://127.0.0.1:3001/admin/x200",
    );
    process.exit(0);
  }

  await execFileAsync("xdg-open", [URL], {
    timeout: 15_000,
    env: process.env,
  });
  await fs.mkdir(path.dirname(marker), { recursive: true });
  await fs.writeFile(marker, new Date().toISOString(), { mode: 0o600 });
  log(`opened once: ${URL}`);
}

main().catch(async (error) => {
  log(error instanceof Error ? error.message : String(error));
  await notify("CLEVONE X200 browser autostart failed", String(error).slice(0, 160));
  process.exit(0);
});
