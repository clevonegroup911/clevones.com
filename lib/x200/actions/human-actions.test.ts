import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertSameOriginMutation,
  diagnoseCsrfStatus,
  parseLocalAllowedOrigins,
} from "@/lib/http/same-origin";
import { issueApproval, consumeApproval } from "@/lib/x200/actions/approvals";
import { sanitizeAuditValue } from "@/lib/x200/actions/audit";
import { computeDrift } from "@/lib/x200/actions/drift";
import {
  executeHumanAction,
  FORBIDDEN_ACTION_KEYS,
  humanActionRequestSchema,
} from "@/lib/x200/actions/executor";
import { activateEmergencyStop, isEmergencyStopActive } from "@/lib/x200/actions/incident";
import { preflightMerge } from "@/lib/x200/actions/merge";
import { preflightDeploy } from "@/lib/x200/actions/deploy";
import { preflightMigration } from "@/lib/x200/actions/migration";
import { preflightRestore } from "@/lib/x200/actions/backup";
import { detectAutopilotStall } from "@/lib/x200/actions/stall";
import { buildSecretsStatus } from "@/lib/x200/actions/secrets-status";
import { policyForAction } from "@/lib/x200/actions/policy";
import { computeSystemHealth } from "@/lib/x200/derive";

function req(origin: string | null, url = "http://localhost:3000/api"): Request {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  return new Request(url, { method: "POST", headers });
}

test("CSRF localhost allow-list works only in development", () => {
  const env = {
    NODE_ENV: "development",
    APP_ORIGIN: "http://localhost:3000",
    X200_LOCAL_ALLOWED_ORIGINS: "http://localhost:3000,http://localhost:3001",
  } as NodeJS.ProcessEnv;
  const ok = assertSameOriginMutation(req("http://localhost:3001"), env);
  assert.equal(ok.ok, true);
  assert.equal(ok.status, "OK");
});

test("production CSRF ignores local allow-list", () => {
  const env = {
    NODE_ENV: "production",
    APP_ORIGIN: "https://clevones.com",
    X200_LOCAL_ALLOWED_ORIGINS: "http://localhost:3001",
  } as NodeJS.ProcessEnv;
  const bad = assertSameOriginMutation(req("http://localhost:3001", "https://clevones.com/api"), env);
  assert.equal(bad.ok, false);
  assert.equal(bad.status, "ORIGIN_MISMATCH");
});

test("no wildcard origin accepted", () => {
  const env = {
    NODE_ENV: "development",
    APP_ORIGIN: "http://localhost:3000",
    X200_LOCAL_ALLOWED_ORIGINS: "*,http://evil.com,http://localhost:3001",
  } as NodeJS.ProcessEnv;
  const list = parseLocalAllowedOrigins(env);
  assert.deepEqual(list, ["http://localhost:3001"]);
  const evil = assertSameOriginMutation(req("http://evil.com"), env);
  assert.equal(evil.ok, false);
});

test("CSRF diagnose never exposes secrets", () => {
  const d = diagnoseCsrfStatus(req("http://localhost:3000"), {
    NODE_ENV: "development",
    APP_ORIGIN: "http://localhost:3000",
    AUTH_SECRET: "super-secret-value",
  } as NodeJS.ProcessEnv);
  assert.equal(d.status, "OK");
  assert.equal(JSON.stringify(d).includes("super-secret"), false);
});

test("approval expires and is single-use", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "x200-appr-"));
  try {
    const issued = await issueApproval(
      {
        actorId: "u1",
        actorEmail: "a@b.c",
        gateType: "MERGE_PR",
        taskId: "T046",
        action: "MERGE_PR",
        reason: "ok",
        expectedSha: "abc1234",
        environment: "LOCAL",
        ttlMs: 1000,
        nowMs: 1_000_000,
      },
      { cwd },
    );
    const staleTime = await consumeApproval(
      {
        approvalId: issued.approvalId,
        action: "MERGE_PR",
        expectedSha: "abc1234",
        environment: "LOCAL",
        nowMs: 1_000_000 + 2000,
      },
      { cwd },
    );
    assert.equal(staleTime.ok, false);
    if (!staleTime.ok) assert.equal(staleTime.code, "APPROVAL_EXPIRED");

    const fresh = await issueApproval(
      {
        actorId: "u1",
        actorEmail: "a@b.c",
        gateType: "MERGE_PR",
        taskId: "T046",
        action: "MERGE_PR",
        reason: "ok",
        expectedSha: "abc1234",
        environment: "LOCAL",
        ttlMs: 60_000,
        nowMs: 2_000_000,
      },
      { cwd },
    );
    const first = await consumeApproval(
      {
        approvalId: fresh.approvalId,
        action: "MERGE_PR",
        expectedSha: "abc1234",
        environment: "LOCAL",
        nowMs: 2_000_100,
      },
      { cwd },
    );
    assert.equal(first.ok, true);
    const second = await consumeApproval(
      {
        approvalId: fresh.approvalId,
        action: "MERGE_PR",
        expectedSha: "abc1234",
        environment: "LOCAL",
        nowMs: 2_000_200,
      },
      { cwd },
    );
    assert.equal(second.ok, false);
    if (!second.ok) assert.equal(second.code, "APPROVAL_CONSUMED");
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("SHA changed yields STALE_APPROVAL", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "x200-stale-"));
  try {
    const issued = await issueApproval(
      {
        actorId: "u1",
        actorEmail: "a@b.c",
        gateType: "MERGE_PR",
        taskId: null,
        action: "MERGE_PR",
        reason: "ok",
        expectedSha: "aaaaaaaa",
        environment: "LOCAL",
        ttlMs: 60_000,
      },
      { cwd },
    );
    const result = await consumeApproval(
      {
        approvalId: issued.approvalId,
        action: "MERGE_PR",
        expectedSha: "bbbbbbbb",
        environment: "LOCAL",
      },
      { cwd },
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "STALE_APPROVAL");
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("merge blocked if CI failed or draft", () => {
  const draft = preflightMerge({
    github: {
      prNumber: 1,
      prDraft: true,
      prState: "open",
      prMergeable: "MERGEABLE",
      prHeadSha: "abc",
      ciLatestConclusion: "success",
      status: "OK",
    },
    git: { dirty: false, head: "abc" },
    humanGate: { present: false },
    actorRole: "SUPER_ADMIN",
    mode: "squash",
  });
  assert.equal(draft.ok, false);

  const ciFail = preflightMerge({
    github: {
      prNumber: 1,
      prDraft: false,
      prState: "open",
      prMergeable: "MERGEABLE",
      prHeadSha: "abc",
      ciLatestConclusion: "failure",
      status: "OK",
    },
    git: { dirty: false, head: "abc" },
    humanGate: { present: false },
    actorRole: "SUPER_ADMIN",
    mode: "squash",
  });
  assert.equal(ciFail.ok, false);
});

test("deploy blocked without backup; migration blocked without backup", () => {
  const deploy = preflightDeploy({
    branch: "main",
    dirty: false,
    deploySha: "abc1234",
    ciSuccess: true,
    backupVerified: false,
    secretsConfigured: true,
    healthBefore: true,
    rollbackTarget: "old",
    drift: { blocksDeploy: false, state: "IN_SYNC", detail: "ok" },
  });
  assert.equal(deploy.ok, false);

  const mig = preflightMigration({
    environment: "PRODUCTION",
    backupVerified: false,
    pendingCount: 1,
  });
  assert.equal(mig.ok, false);
});

test("restore requires double confirmation", () => {
  const pre = preflightRestore({
    backupId: "b1",
    typedPhrase: "RESTORE PRODUCTION",
    secondConfirmation: false,
    currentBackupBeforeRestore: true,
    mfaVerified: true,
  });
  assert.equal(pre.ok, false);
});

test("critical action policy requires MFA + typed phrase", () => {
  const p = policyForAction("DEPLOY_PRODUCTION", { shortSha: "abcdef1" });
  assert.equal(p.risk, "CRITICAL");
  assert.equal(p.requireMfa, true);
  assert.equal(p.requireTypedPhrase, true);
  assert.equal(p.requireSecondConfirmation, true);
  assert.equal(p.typedPhrase, "DEPLOY PRODUCTION abcdef1");
});

test("no arbitrary shell keys in schema; forbidden keys listed", () => {
  const bad = humanActionRequestSchema.safeParse({
    action: "MERGE_PR",
    idempotencyKey: "12345678",
    command: "rm -rf /",
  });
  assert.equal(bad.success, false);
  assert.ok(FORBIDDEN_ACTION_KEYS.includes("command"));
  assert.ok(FORBIDDEN_ACTION_KEYS.includes("shell"));
});

test("audit redaction hides secrets", () => {
  const sanitized = sanitizeAuditValue({
    password: "secret",
    token: "abc",
    mfaCode: "123456",
    ok: "visible",
  }) as Record<string, unknown>;
  assert.equal(sanitized.password, "[REDACTED]");
  assert.equal(sanitized.token, "[REDACTED]");
  assert.equal(sanitized.mfaCode, "[REDACTED]");
  assert.equal(sanitized.ok, "visible");
});

test("secret status never includes values", () => {
  const items = buildSecretsStatus({
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://user:pass@localhost/db",
    AUTH_SECRET: "supersecret",
  } as NodeJS.ProcessEnv);
  const blob = JSON.stringify(items);
  assert.equal(blob.includes("supersecret"), false);
  assert.equal(blob.includes("postgresql://"), false);
});

test("drift detection and health degraded on stale telemetry", () => {
  const drift = computeDrift({
    localHead: "aaa",
    prHead: "bbb",
    mainHead: "aaa",
    deployedProductionSha: "ccc",
    productCompleteHead: "aaa",
  });
  assert.equal(drift.state, "DRIFT");

  const health = computeSystemHealth({
    backlogStatus: "OK",
    counts: {
      total: 1,
      À_FAIRE: 0,
      PRÊTE: 0,
      EN_COURS: 0,
      EN_CONTRÔLE: 0,
      BLOQUÉE: 0,
      ÉCHOUÉE: 0,
      TERMINÉE: 1,
      ANNULÉE: 0,
    },
    git: { status: "OK", dirty: false },
    github: { status: "OK", ciLatestConclusion: "success", ciLatestStatus: "completed" },
    humanGate: { present: false, status: "MISSING" },
    telemetryStale: true,
    telemetryStatus: "OK",
  });
  assert.equal(health.status, "DEGRADED");
  assert.ok(health.criteria.some((c) => c.id === "telemetry_fresh" && c.passed === false));
});

test("emergency stop preserves state and stall detector", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "x200-emg-"));
  try {
    await activateEmergencyStop({
      actor: "admin@example.com",
      reason: "test stop",
      cwd,
    });
    assert.equal(await isEmergencyStopActive(cwd), true);
    const stall = detectAutopilotStall({
      fedora: {
        autopilotLiveState: "STALE",
        ageMs: 999_999,
        agentRunning: false,
        lastEvent: "heartbeat",
      },
      git: { dirty: false },
    });
    assert.equal(stall.stalled, true);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("idempotency rejects duplicate human action", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "x200-idemp-"));
  try {
    const ctx = {
      actorId: "u1",
      actorEmail: "a@b.c",
      actorRole: "SUPER_ADMIN" as const,
      git: { head: "abc", branch: "feat", dirty: false, status: "OK" as const },
      github: {
        prNumber: 1,
        prDraft: true,
        prState: "open",
        prMergeable: "MERGEABLE",
        prHeadSha: "abc",
        ciLatestConclusion: "success",
        status: "OK" as const,
      },
      humanGate: {
        present: false,
        reason: null,
        taskId: null,
        requiredAction: null,
      },
      productComplete: { head: null },
      fedora: {
        autopilotLiveState: "IDLE" as const,
        ageMs: 1000,
        agentRunning: false,
      },
      cwd,
      env: {
        X200_HUMAN_ACTIONS_ENABLED: "true",
        X200_PRIVILEGED_MFA_MOCK: "true",
        NODE_ENV: "test",
        CI: "true",
      } as NodeJS.ProcessEnv,
    };
    const key = "idempotency-key-001";
    const first = await executeHumanAction(
      {
        action: "PREVIEW_MIGRATION",
        idempotencyKey: key,
      },
      ctx,
    );
    assert.equal(first.ok, true);
    const second = await executeHumanAction(
      {
        action: "PREVIEW_MIGRATION",
        idempotencyKey: key,
      },
      ctx,
    );
    assert.equal(second.ok, false);
    assert.equal(second.code, "IDEMPOTENCY_CONFLICT");
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("critical action without MFA is rejected", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "x200-mfa-"));
  try {
    const out = await executeHumanAction(
      {
        action: "EMERGENCY_STOP",
        idempotencyKey: "mfa-missing-001",
        reason: "need stop now",
      },
      {
        actorId: "u1",
        actorEmail: "a@b.c",
        actorRole: "SUPER_ADMIN",
        git: { head: "abc", branch: "feat", dirty: false, status: "OK" },
        github: {
          prNumber: null,
          prDraft: null,
          prState: null,
          prMergeable: null,
          prHeadSha: null,
          ciLatestConclusion: null,
          status: "NOT_CONNECTED",
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
        env: {
          X200_HUMAN_ACTIONS_ENABLED: "true",
          NODE_ENV: "test",
        } as NodeJS.ProcessEnv,
      },
    );
    assert.equal(out.ok, false);
    assert.equal(out.code, "MFA_REQUIRED");
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("previewOnly never mutates and does not consume idempotency", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "x200-preview-"));
  try {
    let adapterCalls = 0;
    const ctx = {
      actorId: "u1",
      actorEmail: "a@b.c",
      actorRole: "SUPER_ADMIN" as const,
      git: { head: "abc1234", branch: "feat", dirty: false, status: "OK" as const },
      github: {
        prNumber: 12,
        prDraft: true,
        prState: "open",
        prMergeable: "MERGEABLE",
        prHeadSha: "abc1234",
        ciLatestConclusion: "success",
        status: "OK" as const,
      },
      humanGate: {
        present: false,
        reason: null,
        taskId: null,
        requiredAction: null,
      },
      productComplete: { head: null },
      fedora: {
        autopilotLiveState: "IDLE" as const,
        ageMs: 1000,
        agentRunning: false,
      },
      cwd,
      env: {
        X200_HUMAN_ACTIONS_ENABLED: "false",
        NODE_ENV: "test",
      } as NodeJS.ProcessEnv,
      readyForReviewAdapter: async () => {
        adapterCalls += 1;
        throw new Error("adapter must not run during preview");
      },
    };
    const out = await executeHumanAction(
      {
        action: "MARK_READY_FOR_REVIEW",
        idempotencyKey: "preview-only-key-001",
        previewOnly: true,
      },
      ctx,
    );
    assert.equal(out.ok, true);
    assert.equal(out.code, "PREVIEW");
    assert.equal(out.receipt, null);
    assert.equal(out.preview?.verificationStatus, "PREVIEW_ONLY");
    assert.equal(out.preview?.prNumber, 12);
    assert.equal(adapterCalls, 0);
    const second = await executeHumanAction(
      {
        action: "MARK_READY_FOR_REVIEW",
        idempotencyKey: "preview-only-key-001",
        previewOnly: true,
      },
      ctx,
    );
    assert.equal(second.ok, true);
    assert.equal(second.code, "PREVIEW");
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
