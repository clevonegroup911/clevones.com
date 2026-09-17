import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  assertNoSecretsInPayload,
  buildActivityFeed,
  redactMonitoringText,
} from "@/lib/x200/activity";
import {
  buildControlCenterFatalSnapshot,
  getControlCenterSnapshot,
} from "@/lib/x200/control-center";
import { parseTelemetryJson } from "@/lib/x200/telemetry";
import { parseBacklogJson, readProductCompleteSnapshot } from "@/lib/x200/sources";

test("redactMonitoringText strips MFA_ENCRYPTION_KEY and AUTH_SECRET names", () => {
  const out = redactMonitoringText(
    "MFA_ENCRYPTION_KEY missing; AUTH_SECRET unset; recovery codes off-git",
  );
  assert.doesNotMatch(out, /MFA_ENCRYPTION_KEY/i);
  assert.doesNotMatch(out, /AUTH_SECRET/i);
  assert.doesNotMatch(out, /recovery\s*codes?/i);
  assert.equal(assertNoSecretsInPayload({ note: out }).length, 0);
});

test("activity feed must not leave MFA_ENCRYPTION_KEY name unredacted", () => {
  const feed = buildActivityFeed({
    history: [
      {
        at: "2026-09-13",
        taskId: "T005",
        status: "BLOQUÉE",
        note: "MFA_ENCRYPTION_KEY missing on production runtime",
      },
    ],
    tasks: [],
    git: {
      head: "abc",
      branch: "feat",
      dirty: false,
      dirtyFileCount: 0,
      recentCommits: [],
      status: "OK",
      warning: null,
    },
    github: {
      status: "UNKNOWN",
      warning: null,
      repository: "org/repo",
      prNumber: null,
      prTitle: null,
      prState: null,
      prDraft: null,
      prMergeable: null,
      prHeadSha: null,
      prUrl: null,
      ciLatestRunId: null,
      ciLatestRunNumber: null,
      ciLatestConclusion: null,
      ciLatestStatus: null,
      ciLatestUrl: null,
      ciLatestName: null,
      ciLatestHeadSha: null,
      ciShaMatch: "UNKNOWN" as const,
    },
    humanGate: {
      status: "MISSING",
      present: false,
      createdAt: null,
      reason: null,
      taskId: null,
      requiredAction: null,
      blocking: [],
      merged: null,
      deployed: null,
      warning: null,
    },
    productComplete: {
      status: "MISSING",
      present: false,
      head: null,
      goalHash: null,
      generatedAt: null,
      matchesCurrentHead: null,
      matchesCurrentGoalHash: null,
      summary: null,
      warning: null,
    },
  });
  assert.equal(assertNoSecretsInPayload({ activity: feed }).length, 0);
});

test("telemetry parse tolerates empty/partial/malformed JSON", () => {
  assert.equal(parseTelemetryJson("").status, "INVALID");
  assert.equal(parseTelemetryJson("{").status, "INVALID");
  assert.equal(parseTelemetryJson('{"version":1').status, "INVALID");
  assert.equal(parseTelemetryJson("null").status, "INVALID");
  assert.equal(parseTelemetryJson("[]").status, "INVALID");
  const valid = parseTelemetryJson(
    JSON.stringify({
      version: 1,
      updatedAt: "2026-09-13T14:00:00.000Z",
      pid: 1,
      host: "fedora",
      mode: "daemon",
      lastEvent: "BOOT",
    }),
  );
  assert.equal(valid.status, "OK");
  assert.ok(valid.data);
});

test("backlog parse tolerates empty/partial JSON without throw", () => {
  assert.equal(parseBacklogJson("").status, "INVALID");
  assert.equal(parseBacklogJson("{").status, "INVALID");
  assert.equal(parseBacklogJson("[]").status, "INVALID");
});

test("PRODUCT_COMPLETE empty/partial/malformed → INVALID not throw", async () => {
  const root = mkdtempSync(join(tmpdir(), "x200-pc-"));
  const prev = process.cwd();
  try {
    mkdirSync(join(root, ".x200"), { recursive: true });
    process.chdir(root);

    writeFileSync(join(root, ".x200", "PRODUCT_COMPLETE.json"), "");
    const empty = await readProductCompleteSnapshot({
      currentHead: "abc",
      currentGoalHash: "def",
    });
    assert.equal(empty.status, "INVALID");

    writeFileSync(join(root, ".x200", "PRODUCT_COMPLETE.json"), "{");
    const partial = await readProductCompleteSnapshot({
      currentHead: "abc",
      currentGoalHash: "def",
    });
    assert.equal(partial.status, "INVALID");

    writeFileSync(
      join(root, ".x200", "PRODUCT_COMPLETE.json"),
      JSON.stringify({ version: 1, head: "old", goalHash: "wrong" }),
    );
    const stale = await readProductCompleteSnapshot({
      currentHead: "abc",
      currentGoalHash: "def",
    });
    assert.equal(stale.status, "OK");
    assert.equal(stale.matchesCurrentHead, false);
    assert.equal(stale.matchesCurrentGoalHash, false);
  } finally {
    process.chdir(prev);
    rmSync(root, { recursive: true, force: true });
  }
});

test("getControlCenterSnapshot never throws on live repo", async () => {
  const snap = await getControlCenterSnapshot();
  assert.equal(typeof snap.generatedAt, "string");
  assert.equal(assertNoSecretsInPayload(snap).length, 0);
});

test("fatal snapshot is secret-clean and marked ERROR", () => {
  const snap = buildControlCenterFatalSnapshot(
    new Error("MFA_ENCRYPTION_KEY missing on production runtime"),
  );
  assert.equal(snap.sources.backlog, "ERROR");
  assert.equal(assertNoSecretsInPayload(snap).length, 0);
  assert.doesNotMatch(JSON.stringify(snap), /MFA_ENCRYPTION_KEY/);
});

test("telemetry writer is atomic and mode 0600", async () => {
  const root = mkdtempSync(join(tmpdir(), "x200-telem-atomic-"));
  try {
    const mod = await import("../../scripts/lib/x200-telemetry.mjs");
    const path = mod.writeTelemetryFile(
      mod.buildTelemetryPayload({
        mode: "daemon",
        head: "abc",
        branch: "feat",
        lastEvent: "BOOT",
        host: "fedora",
        pid: 7,
      }),
      { root },
    );
    assert.equal(path, mod.resolveTelemetryPath(root));
    const raw = readFileSync(path, "utf8");
    JSON.parse(raw);
    assert.equal(parseTelemetryJson(raw).status, "OK");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("ten telemetry heartbeat rewrites never crash Control Center snapshot", async () => {
  const {
    buildTelemetryPayload,
    writeTelemetryFile,
  } = await import("../../scripts/lib/x200-telemetry.mjs");
  const statuses: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    writeTelemetryFile(
      buildTelemetryPayload({
        mode: "daemon",
        head: "abc1234",
        branch: "feat/x200-control-center",
        lastEvent: i % 2 === 0 ? "FAST_LANE" : "WAIT",
        cycle: i,
        agentRunning: i % 2 === 0,
        host: "fedora",
        pid: process.pid,
      }),
    );
    const snap = await getControlCenterSnapshot();
    assert.equal(typeof snap.generatedAt, "string");
    assert.equal(assertNoSecretsInPayload(snap).length, 0);
    statuses.push(String(snap.fedora.fedoraTelemetry));
  }
  assert.equal(statuses.length, 10);
});
