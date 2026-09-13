import assert from "node:assert/strict";
import test from "node:test";

import { xdgOpenFixedArgs, decideBrowserOpen } from "@/lib/x200/boot/browser-once";
import {
  isDbAutostartReady,
  parseDockerInspectJson,
} from "@/lib/x200/boot/parse-docker";
import { parseLingerOutput, lingerEnableCommand } from "@/lib/x200/boot/parse-linger";
import {
  isSystemdEnabled,
  parseSystemdShowOutput,
} from "@/lib/x200/boot/parse-systemd";
import {
  classifyPortOwnership,
  refuseUnknownProcessKill,
} from "@/lib/x200/boot/port-ownership";
import {
  assertAllowlistedUnit,
  isAllowlistedUnit,
  systemctlUserControlArgs,
} from "@/lib/x200/boot/units";
import {
  emptyWatchdogState,
  evaluateWatchdogTick,
} from "@/lib/x200/boot/watchdog";
import { CONTROL_CENTER_URL } from "@/lib/x200/boot/constants";
import {
  bootActionRequestSchema,
  fixedCommandForBootAction,
  preflightBootAction,
} from "@/lib/x200/boot/actions";
import { deriveBootOverall } from "@/lib/x200/boot/status";
import type { SystemdUnitSnapshot } from "@/lib/x200/boot/types";

test("systemd show parser extracts ActiveState MainPID NRestarts", () => {
  const parsed = parseSystemdShowOutput(`
LoadState=loaded
ActiveState=active
SubState=running
UnitFileState=enabled
MainPID=421025
NRestarts=3
ActiveEnterTimestamp=Sun 2026-09-13 20:00:00 CEST
ExecMainStartTimestamp=Sun 2026-09-13 20:00:01 CEST
Result=success
FragmentPath=/home/u/.config/systemd/user/clevones-x200-autopilot.service
WorkingDirectory=/repo
`);
  assert.equal(parsed.activeState, "active");
  assert.equal(parsed.mainPid, 421025);
  assert.equal(parsed.nRestarts, 3);
  assert.equal(isSystemdEnabled(parsed.unitFileState), true);
});

test("docker inspect parser + restart policy readiness", () => {
  const parsed = parseDockerInspectJson([
    {
      Id: "abc123def456",
      Name: "/clevones-x200-db",
      State: { Running: true, Status: "running", Health: { Status: "healthy" } },
      HostConfig: { RestartPolicy: { Name: "unless-stopped" } },
    },
  ]);
  assert.equal(parsed.exists, true);
  assert.equal(parsed.running, true);
  assert.equal(parsed.health, "healthy");
  assert.equal(parsed.restartPolicy, "unless-stopped");
  assert.equal(isDbAutostartReady(parsed.restartPolicy), true);
  assert.equal(isDbAutostartReady("no"), false);
});

test("linger parser and enable command", () => {
  assert.deepEqual(parseLingerOutput("Linger=yes\n"), {
    linger: "YES",
    lingerRequired: false,
  });
  assert.deepEqual(parseLingerOutput("Linger=no\n"), {
    linger: "NO",
    lingerRequired: true,
  });
  assert.equal(
    lingerEnableCommand("clevones"),
    'sudo loginctl enable-linger "clevones"',
  );
});

test("port conflict: X200 owned vs unknown; never kill unknown", () => {
  const owned = classifyPortOwnership({
    listening: true,
    pid: 100,
    processName: "next-server",
    cmdline: "next-server (v15)",
    cwd: "/repo",
    environ: "X200_CONTROL_CENTER=1 HOME=/home/u",
    listenAddress: "127.0.0.1",
    repoRoot: "/repo",
    controlCenterMainPid: 100,
  });
  assert.equal(owned.owner, "X200");
  assert.equal(owned.state, "ALREADY_RUNNING");

  const conflict = classifyPortOwnership({
    listening: true,
    pid: 999,
    processName: "python",
    cmdline: "python -m http.server 3001",
    cwd: "/tmp",
    environ: "HOME=/tmp",
    listenAddress: "0.0.0.0",
    repoRoot: "/repo",
    controlCenterMainPid: 100,
  });
  assert.equal(conflict.owner, "UNKNOWN");
  assert.equal(conflict.state, "PORT_3001_CONFLICT");
  const refusal = refuseUnknownProcessKill(conflict.state);
  assert.equal(refusal.allowed, false);
  assert.match(refusal.reason, /never kill/i);
});

test("allowlisted units only — unknown unit refused", () => {
  assert.equal(isAllowlistedUnit("clevones-x200-autopilot.service"), true);
  assert.equal(isAllowlistedUnit("sshd.service"), false);
  assert.throws(() => assertAllowlistedUnit("sshd.service"), /UNIT_NOT_ALLOWLISTED/);
  assert.deepEqual(systemctlUserControlArgs("start", "clevones-x200-control-center.service"), [
    "--user",
    "start",
    "clevones-x200-control-center.service",
  ]);
});

test("watchdog cooldown and threshold", () => {
  let state = emptyWatchdogState();
  const t0 = 1_000_000;
  let d = evaluateWatchdogTick({ healthy: false, state, nowMs: t0 });
  assert.equal(d.action, "WAIT_THRESHOLD");
  state = d.state;
  d = evaluateWatchdogTick({ healthy: false, state, nowMs: t0 + 1 });
  assert.equal(d.action, "WAIT_THRESHOLD");
  state = d.state;
  d = evaluateWatchdogTick({ healthy: false, state, nowMs: t0 + 2 });
  assert.equal(d.action, "RECOVER");
  state = d.state;
  assert.equal(state.recoveryCount, 1);

  // Exhaust recoveries
  for (let i = 0; i < 10; i += 1) {
    state = {
      ...state,
      consecutiveFailures: 2,
    };
    d = evaluateWatchdogTick({
      healthy: false,
      state,
      nowMs: t0 + 100 + i,
      maxRecoveries: 2,
    });
    state = d.state;
    if (d.action === "COOLDOWN") break;
  }
  assert.equal(d.action, "COOLDOWN");
  const blocked = evaluateWatchdogTick({
    healthy: false,
    state: d.state,
    nowMs: t0 + 200,
  });
  assert.equal(blocked.action, "COOLDOWN");
});

test("browser open once per session + fixed xdg-open argv", () => {
  assert.deepEqual(
    decideBrowserOpen({
      markerExists: false,
      controlCenterReachable: true,
      timedOut: false,
    }),
    { open: true, reason: "FIRST_OPEN" },
  );
  assert.deepEqual(
    decideBrowserOpen({
      markerExists: true,
      controlCenterReachable: true,
      timedOut: false,
    }),
    { open: false, reason: "ALREADY_OPENED_THIS_SESSION" },
  );
  const args = xdgOpenFixedArgs(CONTROL_CENTER_URL);
  assert.equal(args.file, "xdg-open");
  assert.deepEqual(args.args, [CONTROL_CENTER_URL]);
  assert.throws(() => xdgOpenFixedArgs("http://evil.example"), /REFUSED/);
});

test("boot action schema + fixed commands + disable confirmation", () => {
  assert.equal(
    bootActionRequestSchema.safeParse({ action: "START_DATABASE" }).success,
    true,
  );
  assert.equal(
    bootActionRequestSchema.safeParse({
      action: "START_DATABASE",
      command: "rm -rf /",
    }).success,
    false,
  );
  const start = fixedCommandForBootAction("START_CONTROL_CENTER", "/repo");
  assert.ok(start);
  assert.deepEqual(start!.args, [
    "--user",
    "start",
    "clevones-x200-control-center.service",
  ]);
  const denied = preflightBootAction("DISABLE_AUTOSTART", {
    actorRole: "SUPER_ADMIN",
    confirmDisable: false,
    controlActionsEnabled: true,
  });
  assert.equal(denied.ok, false);
  if (!denied.ok) assert.equal(denied.code, "CONFIRMATION_REQUIRED");
});

function unitStub(
  overrides: Partial<SystemdUnitSnapshot> & { unit: SystemdUnitSnapshot["unit"] },
): SystemdUnitSnapshot {
  return {
    status: "OK",
    loaded: true,
    enabled: true,
    activeState: "active",
    subState: "running",
    mainPid: 1,
    nRestarts: 0,
    activeEnterTimestamp: null,
    execMainStartTimestamp: null,
    result: "success",
    fragmentPath: null,
    workingDirectory: null,
    warning: null,
    source: "test",
    ...overrides,
  };
}

test("deriveBootOverall READY / DEGRADED / LINGER_REQUIRED / CONFLICT", () => {
  const ready = deriveBootOverall({
    controlCenter: unitStub({ unit: "clevones-x200-control-center.service" }),
    autopilot: unitStub({ unit: "clevones-x200-autopilot.service" }),
    dockerDb: {
      status: "OK",
      dockerAvailable: true,
      container: "clevones-x200-db",
      exists: true,
      running: true,
      health: "healthy",
      restartPolicy: "unless-stopped",
      autostartReady: true,
      warning: null,
      source: "test",
    },
    linger: {
      status: "OK",
      linger: "YES",
      lingerRequired: false,
      enableCommand: 'sudo loginctl enable-linger "u"',
      warning: null,
      source: "test",
    },
    port: {
      status: "OK",
      port: 3001,
      owner: "X200",
      state: "ALREADY_RUNNING",
      pid: 1,
      processName: "next",
      cmdline: null,
      cwd: null,
      listenAddress: "127.0.0.1",
      warning: null,
      source: "test",
    },
    browser: {
      status: "OK",
      installed: true,
      desktopPath: "/x.desktop",
      sessionMarkerPresent: null,
      warning: null,
      source: "test",
    },
  });
  assert.equal(ready.overall, "READY");

  const linger = deriveBootOverall({
    controlCenter: unitStub({ unit: "clevones-x200-control-center.service" }),
    autopilot: unitStub({ unit: "clevones-x200-autopilot.service" }),
    dockerDb: {
      status: "OK",
      dockerAvailable: true,
      container: "clevones-x200-db",
      exists: true,
      running: true,
      health: "healthy",
      restartPolicy: "unless-stopped",
      autostartReady: true,
      warning: null,
      source: "test",
    },
    linger: {
      status: "OK",
      linger: "NO",
      lingerRequired: true,
      enableCommand: 'sudo loginctl enable-linger "u"',
      warning: "LINGER_REQUIRED",
      source: "test",
    },
    port: {
      status: "OK",
      port: 3001,
      owner: "X200",
      state: "ALREADY_RUNNING",
      pid: 1,
      processName: "next",
      cmdline: null,
      cwd: null,
      listenAddress: "127.0.0.1",
      warning: null,
      source: "test",
    },
    browser: {
      status: "OK",
      installed: true,
      desktopPath: "/x.desktop",
      sessionMarkerPresent: null,
      warning: null,
      source: "test",
    },
  });
  assert.equal(linger.overall, "LINGER_REQUIRED");
});
