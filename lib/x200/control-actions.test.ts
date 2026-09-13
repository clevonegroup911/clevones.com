import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildControlPlaneSnapshot,
  controlActionRequestSchema,
  executeControlAction,
  fixedCommandForAction,
  preflightControlAction,
  sanitizeExecOutput,
  type ControlActionContext,
  type ControlExecutor,
} from "@/lib/x200/control-actions";
import { appendControlActionAudit } from "@/lib/x200/control-audit";

function baseCtx(
  overrides: Partial<ControlActionContext> = {},
): ControlActionContext {
  return {
    actorId: "admin-1",
    actorEmail: "owner@example.com",
    actorRole: "SUPER_ADMIN",
    git: { dirty: false, status: "OK" },
    humanGate: { present: false },
    fedora: {
      agentRunning: false,
      autopilotLiveState: "IDLE",
      taskId: "T045",
    },
    currentTask: null,
    env: {
      X200_CONTROL_ACTIONS_ENABLED: "true",
      NODE_ENV: "development",
    },
    ...overrides,
  };
}

function mockExecutor(
  result: {
    exitCode?: number;
    stdout?: string;
    stderr?: string;
    timedOut?: boolean;
  } = {},
): ControlExecutor {
  return {
    isLocalExecutorAvailable: () => true,
    execFixed: async () => ({
      exitCode: result.exitCode ?? 0,
      stdout: result.stdout ?? "ok",
      stderr: result.stderr ?? "",
      timedOut: result.timedOut ?? false,
    }),
  };
}

test("action enum is strict — arbitrary command fields rejected", () => {
  assert.equal(
    controlActionRequestSchema.safeParse({ action: "AUTOPILOT_START" }).success,
    true,
  );
  assert.equal(
    controlActionRequestSchema.safeParse({
      action: "AUTOPILOT_START",
      command: "rm -rf /",
    }).success,
    false,
  );
  assert.equal(
    controlActionRequestSchema.safeParse({
      action: "RUN_ONE_CYCLE",
      args: ["--force"],
    }).success,
    false,
  );
  assert.equal(
    controlActionRequestSchema.safeParse({ action: "SHELL" }).success,
    false,
  );
});

test("fixed commands never accept caller argv", () => {
  const start = fixedCommandForAction("AUTOPILOT_START", "/repo");
  assert.equal(start.file, "systemctl");
  assert.deepEqual(start.args, [
    "--user",
    "start",
    "clevones-x200-autopilot.service",
  ]);
  const cycle = fixedCommandForAction("RUN_ONE_CYCLE", "/repo");
  assert.equal(cycle.file, process.execPath);
  assert.deepEqual(cycle.args, ["scripts/x200-autopilot.mjs", "--once"]);
});

test("ADMIN mutation denied; SUPER_ADMIN accepted when enabled", async () => {
  const adminDenied = preflightControlAction(
    "AUTOPILOT_START",
    baseCtx({ actorRole: "ADMIN" }),
  );
  assert.equal(adminDenied.ok, false);
  if (!adminDenied.ok) assert.equal(adminDenied.code, "ACTION_NOT_ALLOWED");

  const tmp = await mkdtemp(path.join(tmpdir(), "x200-ctrl-"));
  try {
    const ok = await executeControlAction(
      "AUTOPILOT_START",
      baseCtx({ cwd: tmp, executor: mockExecutor() }),
    );
    assert.equal(ok.ok, true);
    assert.equal(ok.code, "OK");
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test("CONTROL_DISABLED when env flag false", () => {
  const gated = preflightControlAction(
    "AUTOPILOT_START",
    baseCtx({
      env: { X200_CONTROL_ACTIONS_ENABLED: "false", NODE_ENV: "development" },
    }),
  );
  assert.equal(gated.ok, false);
  if (!gated.ok) assert.equal(gated.code, "CONTROL_DISABLED");
});

test("dirty worktree blocks RUN_ONE_CYCLE", () => {
  const gated = preflightControlAction(
    "RUN_ONE_CYCLE",
    baseCtx({ git: { dirty: true, status: "OK" } }),
  );
  assert.equal(gated.ok, false);
  if (!gated.ok) assert.equal(gated.code, "WORKTREE_DIRTY");
});

test("Human Gate blocks RUN_ONE_CYCLE", () => {
  const gated = preflightControlAction(
    "RUN_ONE_CYCLE",
    baseCtx({ humanGate: { present: true } }),
  );
  assert.equal(gated.ok, false);
  if (!gated.ok) assert.equal(gated.code, "HUMAN_GATE_REQUIRED");
});

test("agentRunning blocks stop/restart", () => {
  const stop = preflightControlAction(
    "AUTOPILOT_STOP",
    baseCtx({
      fedora: {
        agentRunning: true,
        autopilotLiveState: "RUNNING",
        taskId: "T045",
      },
    }),
  );
  assert.equal(stop.ok, false);
  if (!stop.ok) assert.equal(stop.code, "AGENT_BUSY");

  const restart = preflightControlAction(
    "AUTOPILOT_RESTART",
    baseCtx({
      fedora: {
        agentRunning: true,
        autopilotLiveState: "RUNNING",
        taskId: "T045",
      },
    }),
  );
  assert.equal(restart.ok, false);
  if (!restart.ok) assert.equal(restart.code, "AGENT_BUSY");
});

test("sanitizeExecOutput redacts secrets", () => {
  const out = sanitizeExecOutput(
    "AUTH_SECRET=supersecretvalue DATABASE_URL=postgresql://x token=abc123password",
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaaaaaaaaaaaaaaaaaaa",
  );
  assert.doesNotMatch(out, /supersecretvalue/);
  assert.doesNotMatch(out, /postgresql:\/\//);
  assert.match(out, /REDACTED/i);
});

test("timeout returns TIMEOUT code without leaking raw secrets", async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), "x200-ctrl-"));
  try {
    const outcome = await executeControlAction(
      "AUTOPILOT_START",
      baseCtx({
        cwd: tmp,
        executor: mockExecutor({
          timedOut: true,
          stderr: "AUTH_SECRET=should-not-leak-plain",
        }),
      }),
    );
    assert.equal(outcome.ok, false);
    assert.equal(outcome.code, "TIMEOUT");
    assert.doesNotMatch(outcome.sanitizedOutput ?? "", /should-not-leak-plain/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test("audit redaction strips forbidden keys", async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), "x200-audit-"));
  try {
    await appendControlActionAudit(
      {
        action: "AUTOPILOT_START",
        actor: "SUPER_ADMIN:owner@example.com",
        result: "SUCCESS",
        durationMs: 12,
        beforeState: "LOCAL_CONTROL_READY",
        afterState: "ACTION_RUNNING",
        taskId: "T045",
        code: "OK",
        detail: "password=hunter2 token=abc AUTH_SECRET=nope",
      },
      { cwd: tmp },
    );
    const raw = await readFile(
      path.join(tmp, ".x200", "control-actions.jsonl"),
      "utf8",
    );
    assert.doesNotMatch(raw, /hunter2/);
    assert.doesNotMatch(raw, /AUTH_SECRET=nope/);
    assert.match(raw, /REDACTED/i);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test("control plane snapshot marks MERGE/DEPLOY human-only", () => {
  const plane = buildControlPlaneSnapshot({
    actorRole: "SUPER_ADMIN",
    humanGatePresent: false,
    agentRunning: false,
    autopilotLiveState: "IDLE",
    gitDirty: false,
    recentActions: [],
    env: { X200_CONTROL_ACTIONS_ENABLED: "true", NODE_ENV: "development" },
  });
  assert.equal(plane.mode, "LOCAL_CONTROL_READY");
  assert.equal(plane.disabledReasons.MERGE, "Human approval required");
  assert.equal(plane.disabledReasons.DEPLOY, "Human approval required");
});
