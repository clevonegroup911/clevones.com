import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  apiUrlToGhPath,
  isLocalGithubCliFallbackAllowed,
  isValidGithubRepository,
  isValidPositiveInt,
} from "@/lib/x200/github-client";
import {
  bindCiToDisplayedCommit,
  selectWorkflowRunForCommit,
} from "@/lib/x200/github";
import {
  reconcileAutopilotLiveness,
  type AutopilotServiceSnapshot,
} from "@/lib/x200/autopilot-service";

describe("T047 github transport helpers", () => {
  it("validates repository and run ids", () => {
    assert.equal(isValidGithubRepository("clevonegroup911/clevones.com"), true);
    assert.equal(isValidGithubRepository("../evil"), false);
    assert.equal(isValidGithubRepository("a/b/c"), false);
    assert.equal(isValidPositiveInt(34780600801), true);
    assert.equal(isValidPositiveInt(0), false);
    assert.equal(isValidPositiveInt(-1), false);
  });

  it("maps api.github.com URLs to gh api paths only", () => {
    assert.equal(
      apiUrlToGhPath(
        "https://api.github.com/repos/clevonegroup911/clevones.com/commits/main",
      ),
      "repos/clevonegroup911/clevones.com/commits/main",
    );
    assert.equal(
      apiUrlToGhPath(
        "https://api.github.com/repos/clevonegroup911/clevones.com/pulls?state=open",
      ),
      "repos/clevonegroup911/clevones.com/pulls?state=open",
    );
    assert.equal(apiUrlToGhPath("https://evil.example/repos/a/b"), null);
    assert.equal(apiUrlToGhPath("https://api.github.com/user"), null);
  });

  it("allows gh CLI fallback only locally by default", () => {
    assert.equal(
      isLocalGithubCliFallbackAllowed({ NODE_ENV: "development" }),
      true,
    );
    assert.equal(
      isLocalGithubCliFallbackAllowed({ NODE_ENV: "production" }),
      false,
    );
    assert.equal(
      isLocalGithubCliFallbackAllowed({
        NODE_ENV: "production",
        X200_GITHUB_CLI_FALLBACK: "true",
      }),
      true,
    );
  });
});

describe("T047 autopilot telemetry/service reconciliation", () => {
  const inactive: AutopilotServiceSnapshot = {
    status: "OK",
    activeState: "inactive",
    subState: "dead",
    mainPid: 0,
    nRestarts: 3,
    serviceActive: false,
    warning: null,
    source: "systemd --user show",
  };
  const active: AutopilotServiceSnapshot = {
    status: "OK",
    activeState: "active",
    subState: "running",
    mainPid: 1234,
    nRestarts: 201,
    serviceActive: true,
    warning: null,
    source: "systemd --user show",
  };

  it("keeps fresh telemetry agentRunning for control", () => {
    const r = reconcileAutopilotLiveness({
      telemetryStale: false,
      telemetryAgentRunning: true,
      telemetryPid: 99,
      service: active,
    });
    assert.equal(r.telemetryState, "FRESH");
    assert.equal(r.agentRunningForControl, true);
    assert.equal(r.agentRunningVerified, true);
  });

  it("clears stale agentRunning when service inactive", () => {
    const r = reconcileAutopilotLiveness({
      telemetryStale: true,
      telemetryAgentRunning: true,
      telemetryPid: 99,
      service: inactive,
    });
    assert.equal(r.telemetryState, "STALE");
    assert.equal(r.agentRunningForControl, false);
    assert.equal(r.agentRunningVerified, false);
    assert.equal(r.code, "SERVICE_INACTIVE_TELEMETRY_STALE");
  });

  it("marks SERVICE_ACTIVE_TELEMETRY_STALE without trusting agent progress", () => {
    const r = reconcileAutopilotLiveness({
      telemetryStale: true,
      telemetryAgentRunning: true,
      telemetryPid: 99,
      service: active,
    });
    assert.equal(r.agentRunningForControl, false);
    assert.equal(r.agentRunningVerified, null);
    assert.equal(r.code, "SERVICE_ACTIVE_TELEMETRY_STALE");
  });
});

describe("T082 CI commit binding", () => {
  it("prefers a run matching the expected SHA over a newer unrelated success", () => {
    const { run, ciShaMatch } = selectWorkflowRunForCommit(
      [
        { id: 2, run_number: 20, head_sha: "bbbbbbbb", conclusion: "success", status: "completed" },
        { id: 1, run_number: 19, head_sha: "aaaaaaaa", conclusion: "success", status: "completed" },
      ],
      "aaaaaaaa",
    );
    assert.equal(ciShaMatch, "MATCH");
    assert.equal(run?.id, 1);
  });

  it("marks MISMATCH when latest SUCCESS is for another commit", () => {
    const { run, ciShaMatch } = selectWorkflowRunForCommit(
      [{ id: 9, run_number: 9, head_sha: "oldold01", conclusion: "success", status: "completed" }],
      "newnew01deadbeef",
    );
    assert.equal(ciShaMatch, "MISMATCH");
    assert.equal(run?.id, 9);

    const bound = bindCiToDisplayedCommit(
      {
        status: "OK",
        warning: null,
        repository: "org/repo",
        prNumber: 1,
        prTitle: "t",
        prState: "open",
        prDraft: true,
        prMergeable: "MERGEABLE",
        prHeadSha: "newnew01deadbeef",
        prUrl: null,
        ciLatestRunId: 9,
        ciLatestRunNumber: 9,
        ciLatestConclusion: "success",
        ciLatestStatus: "completed",
        ciLatestUrl: null,
        ciLatestName: "quality",
        ciLatestHeadSha: "oldold01",
        ciShaMatch: "MISMATCH",
      },
      "newnew01deadbeef",
    );
    assert.equal(bound.ciShaMatch, "MISMATCH");
    assert.equal(bound.ciLatestConclusion, null);
    assert.match(bound.warning || "", /CI SHA mismatch/);
  });

  it("keeps SUCCESS when run SHA matches displayed commit", () => {
    const bound = bindCiToDisplayedCommit(
      {
        status: "OK",
        warning: null,
        repository: "org/repo",
        prNumber: 1,
        prTitle: "t",
        prState: "open",
        prDraft: true,
        prMergeable: "MERGEABLE",
        prHeadSha: "abc1234deadbeef",
        prUrl: null,
        ciLatestRunId: 1,
        ciLatestRunNumber: 1,
        ciLatestConclusion: "success",
        ciLatestStatus: "completed",
        ciLatestUrl: null,
        ciLatestName: "quality",
        ciLatestHeadSha: "abc1234deadbeef",
        ciShaMatch: "UNKNOWN",
      },
      "abc1234deadbeef",
    );
    assert.equal(bound.ciShaMatch, "MATCH");
    assert.equal(bound.ciLatestConclusion, "success");
  });
});
