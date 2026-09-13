import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  renderControlCenterUnit,
  summarizeAutostartStatus,
  unitContentHash,
  writeFileIdempotent,
  assertAllowlistedUnit,
  ALLOWLISTED_UNITS,
} from "./lib/x200-autostart-core.mjs";
import { install } from "./x200-autostart.mjs";

test("installer unit template binds 127.0.0.1 and uses resolved node", () => {
  const unit = renderControlCenterUnit({
    root: "/repo",
    nodeBin: "/usr/bin/node-22",
    serveScript: "/repo/scripts/x200-control-center-serve.mjs",
  });
  assert.match(unit, /WorkingDirectory=\/repo/);
  assert.match(unit, /ExecStart=\/usr\/bin\/node-22 /);
  assert.match(unit, /X200_CONTROL_CENTER=1/);
  assert.match(unit, /Restart=on-failure/);
  assert.match(unit, /RestartSec=5/);
  assert.doesNotMatch(unit, /0\.0\.0\.0/);
  assert.doesNotMatch(unit, /GITHUB_TOKEN|ghp_/);
});

test("writeFileIdempotent does not duplicate content", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "x200-autostart-"));
  try {
    const file = path.join(dir, "unit.service");
    const content = "hello-x200\n";
    const first = await writeFileIdempotent(file, content);
    const second = await writeFileIdempotent(file, content);
    assert.equal(first.written, true);
    assert.equal(second.written, false);
    assert.equal(second.reason, "UNCHANGED");
    assert.equal(await readFile(file, "utf8"), content);
    assert.equal(unitContentHash(content), first.hash);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("install dry-run is idempotent and never touches live systemd", async () => {
  const home = await mkdtemp(path.join(tmpdir(), "x200-home-"));
  process.env.X200_AUTOSTART_DRY_RUN = "1";
  process.env.X200_AUTOSTART_HOME = home;
  try {
    const a = await install({
      dryRun: true,
      home,
      nodeBin: "/usr/bin/node",
      npmBin: "/usr/bin/npm",
      agentBin: null,
    });
    const b = await install({
      dryRun: true,
      home,
      nodeBin: "/usr/bin/node",
      npmBin: "/usr/bin/npm",
      agentBin: null,
    });
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
    assert.equal(a.mode, "DRY_RUN");
    assert.equal(a.writes.length, b.writes.length);
  } finally {
    delete process.env.X200_AUTOSTART_DRY_RUN;
    delete process.env.X200_AUTOSTART_HOME;
    await rm(home, { recursive: true, force: true });
  }
});

test("status summarizer + allowlist refusal", () => {
  const ready = summarizeAutostartStatus({
    controlCenterEnabled: true,
    controlCenterActive: true,
    autopilotEnabled: true,
    autopilotActive: true,
    databaseAutostart: true,
    browserAutostart: true,
    linger: "YES",
    portState: "LISTENING",
  });
  assert.equal(ready.OVERALL, "READY");

  const linger = summarizeAutostartStatus({
    controlCenterEnabled: true,
    controlCenterActive: true,
    autopilotEnabled: true,
    autopilotActive: true,
    databaseAutostart: true,
    browserAutostart: true,
    linger: "NO",
    portState: "LISTENING",
  });
  assert.equal(linger.OVERALL, "LINGER_REQUIRED");

  assert.equal(ALLOWLISTED_UNITS.includes("sshd.service"), false);
  assert.throws(() => assertAllowlistedUnit("sshd.service"), /UNIT_NOT_ALLOWLISTED/);
});
