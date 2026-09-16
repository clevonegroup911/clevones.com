import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { categorizeCiFailure, buildCiInspectorFromJobs } from "@/lib/x200/mirror/ci-inspector";
import {
  buildDiffInspectorFromGitNameStatus,
  shouldRedactDiffPath,
} from "@/lib/x200/mirror/diff-inspector";
import { fact, freshnessFromAge, formatAgeLabel } from "@/lib/x200/mirror/freshness";
import { computeNextSafeAction } from "@/lib/x200/mirror/next-safe-action";
import {
  buildErrorIntelligence,
  buildMirrorNotifications,
} from "@/lib/x200/mirror/notifications";
import { buildOperatorView } from "@/lib/x200/mirror/operator-view";
import { buildReleaseStack } from "@/lib/x200/mirror/release-stack";
import { buildSourceOfTruthMatrix } from "@/lib/x200/mirror/sources-matrix";
import { redactMonitoringText } from "@/lib/x200/activity";

describe("T047 operational mirror", () => {
  it("formats freshness and age labels", () => {
    assert.equal(formatAgeLabel(4_000), "4s ago");
    assert.equal(freshnessFromAge(4_000, 60_000, "live"), "live");
    assert.equal(freshnessFromAge(120_000, 60_000, "live"), "stale");
    assert.equal(freshnessFromAge(null, 60_000), "unavailable");
    const cell = fact({
      id: "x",
      label: "X",
      value: "v",
      source: "git local",
      timestamp: new Date().toISOString(),
      freshness: "live",
      verification: "VERIFIED",
    });
    assert.equal(cell.id, "x");
    assert.equal(cell.verification, "VERIFIED");
  });

  it("marks SOURCE_CONFLICT when local HEAD ≠ PR HEAD", () => {
    const matrix = buildSourceOfTruthMatrix({
      git: {
        head: "aaa",
        branch: "feat/x",
        dirty: false,
        dirtyFileCount: 0,
        recentCommits: [],
        status: "OK",
        warning: null,
      },
      github: {
        status: "OK",
        warning: null,
        repository: "org/repo",
        prNumber: 10,
        prTitle: "t",
        prState: "open",
        prDraft: false,
        prMergeable: "MERGEABLE",
        prHeadSha: "bbb",
        prUrl: null,
        ciLatestRunId: 1,
        ciLatestRunNumber: 1,
        ciLatestConclusion: "success",
        ciLatestStatus: "completed",
        ciLatestUrl: null,
        ciLatestName: "CI",
      },
      fedora: {
        fedoraTelemetry: "OK",
        autopilotLiveState: "IDLE",
        note: "",
        updatedAt: new Date().toISOString(),
        ageMs: 1000,
        pid: 1,
        host: "fedora",
        mode: "daemon",
        head: "aaa",
        branch: "feat/x",
        lastEvent: "tick",
        cycle: 1,
        agentRunning: false,
        taskId: null,
      },
      backlogStatus: "OK",
      mainHead: "ccc",
      deployedProductionSha: null,
      databaseState: "NOT_CONNECTED",
      backupState: "NOT_AVAILABLE",
      migrationState: "NOT_AVAILABLE",
      paymentsLive: "NOT_AVAILABLE",
      secretsConnected: true,
      monitoringStatus: "OK",
      githubAgeLabel: "4s ago",
      telemetryAgeLabel: "2s ago",
      githubFreshness: "live",
      telemetryFreshness: "live",
    });
    const gitRow = matrix.find((r) => r.domain === "Git");
    assert.ok(gitRow);
    assert.equal(gitRow.state, "CONFLICT");
    assert.match(gitRow.conflictLabel ?? "", /SOURCE_CONFLICT/);
  });

  it("computes deterministic next safe actions", () => {
    const baseGithub = {
      prNumber: 10,
      prDraft: true as boolean | null,
      prState: "open",
      prMergeable: "unstable",
      ciLatestConclusion: "success",
      ciLatestStatus: "completed",
      status: "OK" as const,
    };
    const emptyStack = buildReleaseStack({ openPrs: [], currentPrNumber: 10 });
    const markReady = computeNextSafeAction({
      github: baseGithub,
      humanGate: { present: false, requiredAction: null },
      fedora: { autopilotLiveState: "IDLE", agentRunning: false },
      sourcesMatrix: [],
      releaseStack: emptyStack,
      currentTaskId: "T047",
    });
    assert.equal(markReady.code, "MARK_READY");

    const waitCi = computeNextSafeAction({
      github: { ...baseGithub, ciLatestStatus: "in_progress", ciLatestConclusion: null },
      humanGate: { present: false, requiredAction: null },
      fedora: { autopilotLiveState: "IDLE", agentRunning: false },
      sourcesMatrix: [],
      releaseStack: emptyStack,
      currentTaskId: null,
    });
    assert.equal(waitCi.code, "WAIT_FOR_CI");

    const failed = computeNextSafeAction({
      github: { ...baseGithub, ciLatestConclusion: "failure", ciLatestStatus: "completed" },
      humanGate: { present: false, requiredAction: null },
      fedora: { autopilotLiveState: "IDLE", agentRunning: false },
      sourcesMatrix: [],
      releaseStack: emptyStack,
      currentTaskId: null,
    });
    assert.equal(failed.code, "INSPECT_FAILED_STEP");
  });

  it("detects stacked PR merge order without auto-executing", () => {
    const stack = buildReleaseStack({
      openPrs: [
        {
          number: 10,
          title: "T047",
          base: "feat/x200-human-action-center",
          head: "feat/x200-operational-mirror",
          headSha: "abc",
          draft: true,
          mergeable: null,
          ciConclusion: null,
          url: null,
        },
        {
          number: 9,
          title: "T045",
          base: "feat/x200-interactive-control-center",
          head: "feat/x200-human-action-center",
          headSha: "def",
          draft: true,
          mergeable: null,
          ciConclusion: "success",
          url: null,
        },
      ],
      currentPrNumber: 10,
    });
    assert.equal(stack.requiresApproval, true);
    assert.ok(stack.mergeOrder.includes(9));
    assert.ok(stack.mergeOrder.includes(10));
    assert.equal(stack.mergeOrder[0], 9);
    assert.equal(stack.nextSafeMerge, 9);
  });

  it("redacts secret-looking diff paths and content", () => {
    assert.equal(shouldRedactDiffPath(".env.local"), true);
    assert.equal(shouldRedactDiffPath("lib/x200/mirror/facts.ts"), false);
    const diff = buildDiffInspectorFromGitNameStatus({
      nameStatusStdout: "M\t.env\nM\tlib/x200/foo.ts\n",
      numstatStdout: "1\t1\t.env\n2\t0\tlib/x200/foo.ts\n",
      commits: [{ sha: "abc", subject: "token=supersecretvalue", at: null }],
    });
    assert.ok(diff.files.some((f) => f.path === "[REDACTED_PATH]"));
    assert.ok(diff.files.some((f) => f.path.includes("foo.ts")));
    assert.match(diff.commits[0]?.subject ?? "", /REDACTED/);
  });

  it("categorizes CI failures without inventing success", () => {
    const cat = categorizeCiFailure("failure", "Run lint");
    assert.equal(cat.errorCategory, "LINT");
    const inspector = buildCiInspectorFromJobs({
      runId: 1,
      runNumber: 99,
      runUrl: "https://example.test",
      runStatus: "completed",
      runConclusion: "failure",
      durationMs: 1000,
      jobs: [
        {
          name: "quality",
          status: "completed",
          conclusion: "failure",
          durationMs: 1000,
          startedAt: null,
          completedAt: null,
          steps: [
            { name: "Run lint", status: "completed", conclusion: "failure" },
          ],
        },
      ],
      fetchedAt: new Date().toISOString(),
    });
    assert.equal(inspector.failedStep, "Run lint");
    assert.notEqual(inspector.runConclusion, "success");
  });

  it("builds operator view and notifications from observable facts", () => {
    const next = computeNextSafeAction({
      github: {
        prNumber: 10,
        prDraft: false,
        prState: "open",
        prMergeable: "MERGEABLE",
        ciLatestConclusion: "success",
        ciLatestStatus: "completed",
        status: "OK",
      },
      humanGate: { present: false, requiredAction: null },
      fedora: { autopilotLiveState: "IDLE", agentRunning: false },
      sourcesMatrix: [],
      releaseStack: buildReleaseStack({ openPrs: [], currentPrNumber: 10 }),
      currentTaskId: "T047",
    });
    assert.equal(next.code, "REVIEW_MERGE");
    const op = buildOperatorView({
      github: {
        status: "OK",
        warning: null,
        repository: "org/repo",
        prNumber: 10,
        prTitle: "t",
        prState: "open",
        prDraft: false,
        prMergeable: "MERGEABLE",
        prHeadSha: "abc123456789",
        prUrl: null,
        ciLatestRunId: 1,
        ciLatestRunNumber: 129,
        ciLatestConclusion: "success",
        ciLatestStatus: "completed",
        ciLatestUrl: null,
        ciLatestName: "CI",
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
      sourcesMatrix: [],
      blockers: [],
      nextSafeAction: next,
      driftLabel: "IN_SYNC",
      mainHead: "mainsha",
    });
    assert.ok(op.currentFacts.some((f) => f.includes("PR #10")));
    assert.ok(op.currentFacts.some((f) => f.includes("CI #129")));
    assert.match(op.nextSafeAction, /REVIEW_MERGE/);

    const notes = buildMirrorNotifications({
      generatedAt: new Date().toISOString(),
      github: {
        status: "OK",
        warning: null,
        repository: "org/repo",
        prNumber: 10,
        prTitle: "t",
        prState: "open",
        prDraft: false,
        prMergeable: "true",
        prHeadSha: null,
        prUrl: null,
        ciLatestRunId: 1,
        ciLatestRunNumber: 1,
        ciLatestConclusion: "success",
        ciLatestStatus: "completed",
        ciLatestUrl: null,
        ciLatestName: null,
      },
      humanGate: {
        status: "OK",
        present: true,
        createdAt: new Date().toISOString(),
        reason: "merge",
        taskId: null,
        requiredAction: "MERGE",
        blocking: [],
        merged: null,
        deployed: null,
        warning: null,
      },
      fedora: {
        fedoraTelemetry: "OK",
        autopilotLiveState: "STALE",
        note: "stale",
        updatedAt: new Date().toISOString(),
        ageMs: 999999,
        pid: 1,
        host: "h",
        mode: "m",
        head: null,
        branch: null,
        lastEvent: "e",
        cycle: 1,
        agentRunning: false,
        taskId: null,
      },
      incidentPresent: false,
      databaseState: "NOT_CONNECTED",
    });
    assert.ok(notes.some((n) => n.kind === "CI_SUCCESS"));
    assert.ok(notes.some((n) => n.kind === "HUMAN_GATE"));
    assert.ok(notes.some((n) => n.kind === "AUTOPILOT_STALLED"));
  });

  it("deduplicates error intelligence and redacts audit text", () => {
    const items = buildErrorIntelligence({
      blockers: [
        {
          id: "ci_failed",
          severity: "HIGH",
          title: "CI failed",
          detail: "failure",
          source: "github",
        },
        {
          id: "ci_failed",
          severity: "HIGH",
          title: "CI failed again",
          detail: "failure",
          source: "github",
        },
      ],
      github: {
        status: "OK",
        warning: null,
        repository: "org/repo",
        prNumber: null,
        prTitle: null,
        prState: null,
        prDraft: null,
        prMergeable: null,
        prHeadSha: null,
        prUrl: null,
        ciLatestRunId: 1,
        ciLatestRunNumber: 1,
        ciLatestConclusion: "failure",
        ciLatestStatus: "completed",
        ciLatestUrl: "https://example.test",
        ciLatestName: "CI",
      },
      warnings: ["boom", "boom"],
      currentTaskId: "T047",
      localHead: "abc",
      generatedAt: new Date().toISOString(),
    });
    const blocker = items.find((i) => i.errorCode === "BLOCKER_CI_FAILED");
    assert.ok(blocker);
    assert.ok(blocker.count >= 2);
    const redacted = redactMonitoringText("password=hunter2 token=abc");
    assert.match(redacted, /REDACTED/);
    assert.doesNotMatch(redacted, /hunter2/);
  });
});
