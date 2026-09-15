import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { buildHumanActionInbox } from "@/lib/x200/actions/inbox";
import { executeHumanAction } from "@/lib/x200/actions/executor";
import {
  createMockReadyForReviewAdapter,
  createRealReadyForReviewAdapter,
  markPrReadyForReview,
  parsePrViewJson,
  resolveGithubActionAdapterMode,
  verifyReadyRemoteState,
  type GhExec,
} from "@/lib/x200/actions/merge";

function env(partial: Record<string, string>): NodeJS.ProcessEnv {
  return { NODE_ENV: "test", ...partial } as NodeJS.ProcessEnv;
}

test("resolveGithubActionAdapterMode: CI alone is not MOCK success", () => {
  assert.equal(
    resolveGithubActionAdapterMode(
      env({ CI: "true", X200_HUMAN_ACTIONS_ENABLED: "true" }),
    ),
    "REAL",
  );
  assert.equal(
    resolveGithubActionAdapterMode(
      env({
        X200_FORCE_MERGE_ADAPTER_MOCK: "true",
        X200_HUMAN_ACTIONS_ENABLED: "true",
      }),
    ),
    "MOCK",
  );
  assert.equal(
    resolveGithubActionAdapterMode(env({ X200_HUMAN_ACTIONS_ENABLED: "false" })),
    "UNAVAILABLE",
  );
});

test("gh command success + remote isDraft=false => SUCCESS", async () => {
  const calls: string[][] = [];
  const ghExec: GhExec = async (_file, args) => {
    calls.push([...args]);
    if (args[1] === "ready") return { stdout: "", stderr: "" };
    return {
      stdout: JSON.stringify({
        number: 10,
        isDraft: false,
        state: "OPEN",
        headRefOid: "abc1234deadbeef",
        url: "https://github.com/x/y/pull/10",
      }),
      stderr: "",
    };
  };
  const adapter = createRealReadyForReviewAdapter(ghExec);
  const result = await adapter({
    prNumber: 10,
    expectedSha: "abc1234deadbeef",
    beforeDraft: true,
    env: env({ X200_HUMAN_ACTIONS_ENABLED: "true" }),
  });
  assert.equal(result.ok, true);
  assert.equal(result.remoteVerified, true);
  assert.equal(result.afterDraft, false);
  assert.equal(result.code, "READY_FOR_REVIEW");
  assert.equal(calls[0]?.[1], "ready");
  assert.equal(calls[1]?.[1], "view");
});

test("gh command success + remote still draft=true => FAILED", async () => {
  const ghExec: GhExec = async (_file, args) => {
    if (args[1] === "ready") return { stdout: "ok", stderr: "" };
    return {
      stdout: JSON.stringify({
        number: 10,
        isDraft: true,
        state: "OPEN",
        headRefOid: "abc1234deadbeef",
        url: "https://example/pr/10",
      }),
      stderr: "",
    };
  };
  const result = await createRealReadyForReviewAdapter(ghExec)({
    prNumber: 10,
    expectedSha: "abc1234deadbeef",
    beforeDraft: true,
    env: env({ X200_HUMAN_ACTIONS_ENABLED: "true" }),
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "REMOTE_STATE_MISMATCH");
  assert.equal(result.remoteVerified, false);
  assert.equal(result.afterDraft, true);
});

test("SHA changed => STALE_REMOTE_STATE", () => {
  const verified = verifyReadyRemoteState({
    expectedPrNumber: 10,
    expectedSha: "aaaaaaaa",
    remote: {
      number: 10,
      isDraft: false,
      state: "OPEN",
      headRefOid: "bbbbbbbb",
      url: null,
    },
  });
  assert.equal(verified.ok, false);
  assert.equal(verified.code, "STALE_REMOTE_STATE");
});

test("wrong PR => FAILED", () => {
  const verified = verifyReadyRemoteState({
    expectedPrNumber: 10,
    expectedSha: "aaa",
    remote: {
      number: 11,
      isDraft: false,
      state: "OPEN",
      headRefOid: "aaa",
      url: null,
    },
  });
  assert.equal(verified.ok, false);
  assert.equal(verified.code, "REMOTE_STATE_MISMATCH");
});

test("gh unavailable => FAILED", async () => {
  const ghExec: GhExec = async () => {
    throw new Error("gh not found");
  };
  const result = await createRealReadyForReviewAdapter(ghExec)({
    prNumber: 10,
    expectedSha: "abc",
    beforeDraft: true,
    env: env({ X200_HUMAN_ACTIONS_ENABLED: "true" }),
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "GH_READY_FAILED");
});

test("mock adapter cannot produce live runtime SUCCESS via default path", async () => {
  const result = await markPrReadyForReview({
    prNumber: 10,
    expectedSha: "abc",
    beforeDraft: true,
    env: env({
      X200_HUMAN_ACTIONS_ENABLED: "true",
      X200_FORCE_MERGE_ADAPTER_MOCK: "true",
      CI: "true",
    }),
  });
  assert.equal(result.adapterMode, "MOCK");
  assert.equal(result.ok, false);
  assert.equal(result.remoteVerified, false);
  assert.notEqual(result.detail, "READY_FOR_REVIEW_MOCK");
});

test("inbox retains MARK_READY when remote draft=true", () => {
  const inbox = buildHumanActionInbox({
    humanGate: {
      present: false,
      reason: null,
      taskId: null,
      requiredAction: null,
      createdAt: null,
    },
    github: {
      status: "OK",
      prNumber: 10,
      prDraft: true,
      prState: "open",
      prMergeable: "MERGEABLE",
      prHeadSha: "bcc76980",
      ciLatestConclusion: "success",
    },
    git: { head: "bcc76980", branch: "feat", dirty: false },
    currentTask: null,
    paymentsLiveAvailable: false,
  });
  assert.ok(inbox.some((i) => i.type === "MARK_READY_FOR_REVIEW"));
});

test("inbox removes MARK_READY only after remote draft=false", () => {
  const inbox = buildHumanActionInbox({
    humanGate: {
      present: false,
      reason: null,
      taskId: null,
      requiredAction: null,
      createdAt: null,
    },
    github: {
      status: "OK",
      prNumber: 10,
      prDraft: false,
      prState: "open",
      prMergeable: "MERGEABLE",
      prHeadSha: "bcc76980",
      ciLatestConclusion: "success",
    },
    git: { head: "bcc76980", branch: "feat", dirty: false },
    currentTask: null,
    paymentsLiveAvailable: false,
  });
  assert.equal(
    inbox.some((i) => i.type === "MARK_READY_FOR_REVIEW"),
    false,
  );
});

test("receipt remoteVerified requirement enforced by executeHumanAction", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "x200-ready-"));
  try {
    const fakeOkWithoutRemote = createMockReadyForReviewAdapter({
      ok: true,
      code: "READY_FOR_REVIEW_MOCK",
      detail: "fake",
      afterDraft: true,
      remoteVerified: false,
    });
    const out = await executeHumanAction(
      {
        action: "MARK_READY_FOR_REVIEW",
        idempotencyKey: "ready-receipt-001",
        reason: "mark ready",
        expectedSha: "bcc76980bf3074157160c26c4c8c97f52571590a",
      },
      {
        actorId: "u1",
        actorEmail: "a@b.c",
        actorRole: "SUPER_ADMIN",
        git: {
          head: "bcc76980bf3074157160c26c4c8c97f52571590a",
          branch: "feat",
          dirty: false,
          status: "OK",
        },
        github: {
          prNumber: 10,
          prDraft: true,
          prState: "open",
          prMergeable: "MERGEABLE",
          prHeadSha: "bcc76980bf3074157160c26c4c8c97f52571590a",
          ciLatestConclusion: "success",
          status: "OK",
        },
        humanGate: {
          present: false,
          reason: null,
          taskId: null,
          requiredAction: null,
        },
        productComplete: { head: null },
        fedora: {
          autopilotLiveState: "IDLE",
          ageMs: 1,
          agentRunning: false,
        },
        cwd,
        env: env({ X200_HUMAN_ACTIONS_ENABLED: "true" }),
        readyForReviewAdapter: fakeOkWithoutRemote,
      },
    );
    assert.equal(out.ok, false);
    assert.equal(out.receipt?.result, "FAILED");
    assert.equal(out.receipt?.after.remoteVerified, false);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("parsePrViewJson reads required fields", () => {
  const parsed = parsePrViewJson(
    JSON.stringify({
      number: 10,
      isDraft: false,
      state: "OPEN",
      headRefOid: "sha",
      url: "u",
    }),
  );
  assert.equal(parsed?.number, 10);
  assert.equal(parsed?.isDraft, false);
});
