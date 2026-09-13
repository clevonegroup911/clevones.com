import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, mkdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  buildTelemetryPayload,
  writeTelemetryFile,
  resolveTelemetryPath,
} from "../../scripts/lib/x200-telemetry.mjs";
import {
  deriveLiveStateFromTelemetry,
  parseTelemetryJson,
} from "@/lib/x200/telemetry";

test("telemetry writer creates JSON without secrets", () => {
  const root = mkdtempSync(join(tmpdir(), "x200-telem-"));
  try {
    const payload = buildTelemetryPayload({
      mode: "daemon",
      head: "abc123",
      branch: "feat/x200",
      lastEvent: "BOOT",
      cycle: 1,
      agentRunning: false,
      taskId: "T043",
      host: "fedora-host",
      pid: 4242,
      updatedAt: "2026-09-13T13:00:00.000Z",
    });
    const path = writeTelemetryFile(payload, { root });
    assert.equal(path, resolveTelemetryPath(root));
    const raw = readFileSync(path, "utf8");
    assert.match(raw, /"version": 1/);
    assert.doesNotMatch(raw, /token|secret|password|ghp_/i);
    const parsed = JSON.parse(raw);
    assert.equal(parsed.pid, 4242);
    assert.equal(parsed.taskId, "T043");
    // Re-write to ensure chmod 0600 applies on updates, not only create.
    writeTelemetryFile({ ...payload, cycle: 2 }, { root });
    const mode = statSync(path).mode & 0o777;
    assert.equal(mode, 0o600);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("parseTelemetryJson rejects invalid payloads", () => {
  assert.equal(parseTelemetryJson("{").status, "INVALID");
  assert.equal(parseTelemetryJson("{}").status, "INVALID");
  assert.equal(
    parseTelemetryJson(
      JSON.stringify({
        version: 1,
        updatedAt: "not-a-date",
        pid: 1,
        host: "h",
        mode: "daemon",
        lastEvent: "BOOT",
      }),
    ).status,
    "INVALID",
  );
});

test("deriveLiveStateFromTelemetry marks STALE and never invents RUNNING on old data", () => {
  const data = {
    version: 1 as const,
    updatedAt: "2026-09-13T10:00:00.000Z",
    pid: 1,
    host: "fedora",
    mode: "daemon",
    head: "abc",
    branch: "feat",
    lastEvent: "FAST_LANE",
    cycle: 3,
    agentRunning: true,
    taskId: "T043",
  };
  const stale = deriveLiveStateFromTelemetry(data, {
    nowMs: Date.parse("2026-09-13T10:10:00.000Z"),
    staleMs: 180_000,
  });
  assert.equal(stale.liveState, "STALE");
  assert.equal(stale.stale, true);

  const live = deriveLiveStateFromTelemetry(data, {
    nowMs: Date.parse("2026-09-13T10:01:00.000Z"),
    staleMs: 180_000,
  });
  assert.equal(live.liveState, "RUNNING");
  assert.equal(live.stale, false);

  const idle = deriveLiveStateFromTelemetry(
    { ...data, lastEvent: "WAIT", agentRunning: false },
    { nowMs: Date.parse("2026-09-13T10:01:00.000Z"), staleMs: 180_000 },
  );
  assert.equal(idle.liveState, "IDLE");
});

test("telemetry path stays under .x200", () => {
  const root = mkdtempSync(join(tmpdir(), "x200-telem-path-"));
  try {
    mkdirSync(join(root, ".x200"), { recursive: true });
    assert.ok(resolveTelemetryPath(root).endsWith(`${join(".x200", "telemetry.json")}`));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
