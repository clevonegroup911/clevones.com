import assert from "node:assert/strict";
import { test } from "node:test";

import {
  assertNoSecretsInPayload,
  buildActivityFeed,
} from "@/lib/x200/activity";
import {
  computeEfficiency,
  computeSystemHealth,
  deriveBlockers,
  derivePipeline,
} from "@/lib/x200/derive";
import {
  countDetectableCriteria,
  emptyTaskCounts,
  hashProductGoal,
  parseBacklogJson,
} from "@/lib/x200/sources";
import type {
  ControlCenterTask,
  GitSnapshot,
  GithubSnapshot,
  HumanGateSnapshot,
  ProductCompleteSnapshot,
} from "@/lib/x200/types";

test("parseBacklogJson counts statuses and picks current EN_COURS task", () => {
  const result = parseBacklogJson(
    JSON.stringify({
      repository: "clevonegroup911/clevones.com",
      tasks: [
        {
          id: "T001",
          title: "Done",
          status: "TERMINÉE",
          priority: "P1",
          attempts: 1,
          requiresHuman: false,
          evidence: ["ok"],
          dependencies: [],
        },
        {
          id: "T042",
          title: "Control Center",
          status: "EN_COURS",
          priority: "P0",
          attempts: 1,
          requiresHuman: false,
          evidence: [],
          dependencies: ["T041"],
          claim: { workerId: "local:fedora", expiresAt: "2026-09-13T12:00:00Z" },
        },
      ],
      history: [
        {
          at: "2026-09-13",
          taskId: "T042",
          status: "EN_COURS",
          note: "claimed",
        },
      ],
    }),
  );

  assert.equal(result.status, "OK");
  assert.equal(result.counts?.total, 2);
  assert.equal(result.counts?.["TERMINÉE"], 1);
  assert.equal(result.counts?.["EN_COURS"], 1);
  assert.equal(result.currentTask?.id, "T042");
  assert.equal(result.currentTask?.claimWorkerId, "local:fedora");
  assert.equal(result.repository, "clevonegroup911/clevones.com");
});

test("parseBacklogJson returns INVALID for broken JSON without inventing counts", () => {
  const result = parseBacklogJson("{not-json");
  assert.equal(result.status, "INVALID");
  assert.equal(result.counts, null);
  assert.equal(result.currentTask, null);
  assert.equal(result.tasks.length, 0);
});

test("hashProductGoal is stable and criteria counter is deterministic", () => {
  const content = "# Goal\n\n1. One\n2. Two\n3. Three\n";
  assert.equal(hashProductGoal(content), hashProductGoal(content));
  assert.notEqual(hashProductGoal(content), hashProductGoal(`${content}x`));
  assert.equal(countDetectableCriteria(content), 3);
});

test("computeSystemHealth stays UNKNOWN without inventing a percentage when inconclusive", () => {
  const health = computeSystemHealth({
    backlogStatus: "UNKNOWN",
    counts: null,
    git: { status: "UNKNOWN", dirty: null },
    github: {
      status: "UNKNOWN",
      ciLatestConclusion: null,
      ciLatestStatus: null,
    },
    humanGate: { present: false, status: "UNKNOWN" },
  });
  assert.equal(health.status, "UNKNOWN");
  assert.equal(health.scorePercent, null);
});

test("computeSystemHealth BLOCKED on human gate and documents criteria", () => {
  const counts = emptyTaskCounts();
  counts.total = 1;
  counts["TERMINÉE"] = 1;
  const health = computeSystemHealth({
    backlogStatus: "OK",
    counts,
    git: { status: "OK", dirty: false },
    github: {
      status: "OK",
      ciLatestConclusion: "success",
      ciLatestStatus: "completed",
    },
    humanGate: { present: true, status: "OK" },
  });
  assert.equal(health.status, "BLOCKED");
  assert.equal(typeof health.scorePercent, "number");
  assert.ok(health.criteria.some((c) => c.id === "no_human_gate" && c.passed === false));
});

test("GitHub unavailable does not invent CI SUCCESS", () => {
  const health = computeSystemHealth({
    backlogStatus: "OK",
    counts: emptyTaskCounts(),
    git: { status: "OK", dirty: false },
    github: {
      status: "UNKNOWN",
      ciLatestConclusion: null,
      ciLatestStatus: null,
    },
    humanGate: { present: false, status: "MISSING" },
  });
  const ci = health.criteria.find((c) => c.id === "ci_success");
  assert.equal(ci?.passed, null);
  assert.notEqual(ci?.detail.includes("success") && ci.passed === true, true);
});

test("derivePipeline uses UNKNOWN/WAITING when proofs are missing", () => {
  const steps = derivePipeline({
    currentTask: null,
    git: {
      status: "UNKNOWN",
      head: null,
      recentCommits: [],
    },
    github: {
      status: "UNKNOWN",
      prNumber: null,
      prDraft: null,
      prState: null,
      ciLatestConclusion: null,
      ciLatestStatus: null,
      ciLatestUrl: null,
    },
    productComplete: {
      present: false,
      matchesCurrentHead: null,
      matchesCurrentGoalHash: null,
    },
  });
  assert.equal(steps.find((s) => s.id === "CI")?.state, "UNKNOWN");
  assert.equal(steps.find((s) => s.id === "MERGE")?.state, "WAITING");
});

test("efficiency returns N/A fields instead of fabricated rates when history is thin", () => {
  const metrics = computeEfficiency({
    counts: emptyTaskCounts(),
    tasks: [],
    history: [],
    humanGatePresent: false,
  });
  assert.equal(metrics.successRatePercent, null);
  assert.equal(metrics.averageCycleDays, null);
  assert.ok(metrics.notes.some((note) => /insuffisante/i.test(note)));
});

test("deriveBlockers includes telemetry INFO and never invents CI failure", () => {
  const blockers = deriveBlockers({
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
    } satisfies HumanGateSnapshot,
    github: {
      status: "UNKNOWN",
      warning: "unreachable",
      repository: "clevonegroup911/clevones.com",
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
    } satisfies GithubSnapshot,
    git: {
      status: "OK",
      head: "abc",
      branch: "feat/x200-control-center",
      dirty: false,
      dirtyFileCount: 0,
      recentCommits: [],
      warning: null,
    } satisfies GitSnapshot,
    counts: emptyTaskCounts(),
    backlogStatus: "OK",
    fedoraConnected: false,
  });

  assert.ok(blockers.some((b) => b.id === "telemetry_unavailable"));
  assert.ok(blockers.some((b) => b.id === "github_unreachable"));
  assert.equal(
    blockers.some((b) => b.id === "ci_failure"),
    false,
  );
});

test("activity feed redacts token-like strings and payload secret scan catches ghp tokens", () => {
  const task: ControlCenterTask = {
    id: "T001",
    title: "t",
    objective: "o",
    status: "TERMINÉE",
    priority: "P1",
    dependencies: [],
    attempts: 1,
    requiresHuman: false,
    nextAction: null,
    blockedReason: null,
    evidence: ["token=ghp_abcdefghijklmnopqrstuvwxyz012345"],
    evidenceCount: 1,
    owner: "cursor",
    updatedAt: "2026-09-13",
    claimWorkerId: null,
    claimExpiresAt: null,
    lastTransitionReason: null,
  };

  const activity = buildActivityFeed({
    history: [],
    tasks: [task],
    git: {
      status: "OK",
      head: "a",
      branch: "b",
      dirty: false,
      dirtyFileCount: 0,
      recentCommits: [],
      warning: null,
    },
    github: {
      status: "UNKNOWN",
      warning: null,
      repository: "clevonegroup911/clevones.com",
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
    } satisfies ProductCompleteSnapshot,
  });

  assert.ok(activity.some((item) => item.detail.includes("[REDACTED]")));
  assert.ok(
    assertNoSecretsInPayload({
      token: "ghp_abcdefghijklmnopqrstuvwxyz012345",
    }).length > 0,
  );
  assert.deepEqual(assertNoSecretsInPayload({ ok: true, status: "HEALTHY" }), []);
});
