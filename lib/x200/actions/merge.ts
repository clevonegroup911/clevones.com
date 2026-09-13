import "server-only";

import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { GithubSnapshot, GitSnapshot, HumanGateSnapshot } from "@/lib/x200/types";
import { isProductionActionsEnvEnabled } from "@/lib/x200/actions/policy";

const execFileAsync = promisify(execFile);

export type MergeMode = "merge" | "squash";

export type GithubActionAdapterMode = "REAL" | "MOCK" | "UNAVAILABLE";

export type MergePreflight = {
  ok: boolean;
  code: string;
  message: string;
  expectedSha: string | null;
  currentSha: string | null;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
};

/**
 * Runtime adapter mode for GitHub human actions.
 * - REAL: fixed `gh` argv against remote
 * - MOCK: explicit test/mock flag only — never reports live SUCCESS
 * - UNAVAILABLE: gh/human actions disabled
 *
 * `process.env.CI` alone must NOT fake a successful human action.
 */
export function resolveGithubActionAdapterMode(
  env: NodeJS.ProcessEnv = process.env,
): GithubActionAdapterMode {
  if (env.X200_FORCE_MERGE_ADAPTER_MOCK === "true") {
    return "MOCK";
  }
  if (env.X200_HUMAN_ACTIONS_ENABLED !== "true") {
    return "UNAVAILABLE";
  }
  if (env.X200_GITHUB_ADAPTER_UNAVAILABLE === "true") {
    return "UNAVAILABLE";
  }
  return "REAL";
}

export function preflightMerge(input: {
  github: Pick<
    GithubSnapshot,
    | "prNumber"
    | "prDraft"
    | "prState"
    | "prMergeable"
    | "prHeadSha"
    | "ciLatestConclusion"
    | "status"
  >;
  git: Pick<GitSnapshot, "dirty" | "head">;
  humanGate: Pick<HumanGateSnapshot, "present">;
  actorRole: string;
  mode: MergeMode;
}): MergePreflight {
  const checks: MergePreflight["checks"] = [];
  const add = (name: string, ok: boolean, detail: string) =>
    checks.push({ name, ok, detail });

  add("super_admin", input.actorRole === "SUPER_ADMIN", input.actorRole);
  add("pr_open", input.github.prState === "open", String(input.github.prState));
  add("not_draft", input.github.prDraft === false, String(input.github.prDraft));
  const mergeable =
    input.github.prMergeable === "MERGEABLE" ||
    input.github.prMergeable === "true";
  add("mergeable", mergeable, String(input.github.prMergeable));
  add(
    "exact_head",
    Boolean(input.github.prHeadSha),
    input.github.prHeadSha ?? "missing",
  );
  add(
    "ci_success",
    input.github.ciLatestConclusion === "success",
    String(input.github.ciLatestConclusion),
  );
  add("no_human_gate", input.humanGate.present !== true, "gate");
  add("branch_clean", input.git.dirty === false, String(input.git.dirty));
  add("mode_allowed", input.mode === "merge" || input.mode === "squash", input.mode);
  add("no_force", true, "force merge never allowed");

  const failed = checks.find((c) => !c.ok);
  return {
    ok: !failed,
    code: failed ? "MERGE_BLOCKED" : "MERGE_READY",
    message: failed
      ? `Merge bloqué: ${failed.name}`
      : "Preflight merge OK",
    expectedSha: input.github.prHeadSha,
    currentSha: input.github.prHeadSha,
    checks,
  };
}

export type MergeAdapter = {
  mergePr: (input: {
    prNumber: number;
    mode: MergeMode;
    expectedSha: string;
  }) => Promise<{ ok: boolean; detail: string; adapterMode: GithubActionAdapterMode }>;
};

export function createGhMergeAdapter(
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
): MergeAdapter {
  return {
    async mergePr({ prNumber, mode, expectedSha }) {
      const adapterMode = resolveGithubActionAdapterMode(env);
      if (adapterMode !== "REAL") {
        return {
          ok: false,
          detail: `MERGE refused — adapterMode=${adapterMode}`,
          adapterMode,
        };
      }
      const args =
        mode === "squash"
          ? ["pr", "merge", String(prNumber), "--squash", "--match-head-commit", expectedSha]
          : ["pr", "merge", String(prNumber), "--merge", "--match-head-commit", expectedSha];
      try {
        const { stdout, stderr } = await execFileAsync("gh", args, {
          cwd,
          timeout: 60_000,
          encoding: "utf8",
          env: { ...process.env, ...env },
        });
        return {
          ok: true,
          detail: `${stdout}\n${stderr}`.trim().slice(0, 800),
          adapterMode,
        };
      } catch (error) {
        return {
          ok: false,
          detail:
            error instanceof Error ? error.message.slice(0, 800) : "merge failed",
          adapterMode,
        };
      }
    },
  };
}

export function createMockMergeAdapter(
  result: { ok: boolean; detail: string } = {
    ok: false,
    detail: "mock",
  },
): MergeAdapter {
  return {
    async mergePr() {
      return { ...result, adapterMode: "MOCK" };
    },
  };
}

export type ReadyForReviewRemote = {
  number: number;
  isDraft: boolean;
  state: string;
  headRefOid: string;
  url: string | null;
};

export type ReadyForReviewResult = {
  ok: boolean;
  code: string;
  detail: string;
  adapterMode: GithubActionAdapterMode;
  prNumber: number;
  expectedSha: string | null;
  beforeDraft: boolean | null;
  afterDraft: boolean | null;
  remoteVerified: boolean;
  remoteState: string | null;
  remoteHeadSha: string | null;
  remoteUrl: string | null;
};

export type ReadyForReviewAdapter = (input: {
  prNumber: number;
  expectedSha: string | null;
  beforeDraft: boolean | null;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}) => Promise<ReadyForReviewResult>;

export type GhExec = (
  file: string,
  args: readonly string[],
  options: { cwd: string; timeoutMs: number; env: NodeJS.ProcessEnv },
) => Promise<{ stdout: string; stderr: string }>;

async function defaultGhExec(
  file: string,
  args: readonly string[],
  options: { cwd: string; timeoutMs: number; env: NodeJS.ProcessEnv },
): Promise<{ stdout: string; stderr: string }> {
  return execFileAsync(file, [...args], {
    cwd: options.cwd,
    timeout: options.timeoutMs,
    encoding: "utf8",
    env: { ...process.env, ...options.env },
  });
}

export function parsePrViewJson(raw: string): ReadyForReviewRemote | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.number !== "number") return null;
    if (typeof parsed.isDraft !== "boolean") return null;
    if (typeof parsed.state !== "string") return null;
    if (typeof parsed.headRefOid !== "string") return null;
    return {
      number: parsed.number,
      isDraft: parsed.isDraft,
      state: parsed.state,
      headRefOid: parsed.headRefOid,
      url: typeof parsed.url === "string" ? parsed.url : null,
    };
  } catch {
    return null;
  }
}

export function verifyReadyRemoteState(input: {
  expectedPrNumber: number;
  expectedSha: string | null;
  remote: ReadyForReviewRemote;
}): { ok: boolean; code: string; detail: string } {
  if (input.remote.number !== input.expectedPrNumber) {
    return {
      ok: false,
      code: "REMOTE_STATE_MISMATCH",
      detail: `wrong PR remote=${input.remote.number} expected=${input.expectedPrNumber}`,
    };
  }
  if (input.remote.isDraft !== false) {
    return {
      ok: false,
      code: "REMOTE_STATE_MISMATCH",
      detail: "remote still draft=true after gh pr ready",
    };
  }
  if (input.remote.state.toUpperCase() !== "OPEN") {
    return {
      ok: false,
      code: "REMOTE_STATE_MISMATCH",
      detail: `remote state=${input.remote.state} expected=OPEN`,
    };
  }
  if (
    input.expectedSha &&
    input.remote.headRefOid !== input.expectedSha
  ) {
    return {
      ok: false,
      code: "STALE_REMOTE_STATE",
      detail: `EXPECTED_SHA=${input.expectedSha} REMOTE_HEAD=${input.remote.headRefOid}`,
    };
  }
  return { ok: true, code: "READY_FOR_REVIEW", detail: "remote verified draft=false" };
}

/**
 * REAL adapter: `gh pr ready` then immediate `gh pr view --json` verification.
 * SUCCESS only when remote isDraft=false, state=OPEN, number/SHA match.
 */
export function createRealReadyForReviewAdapter(
  ghExec: GhExec = defaultGhExec,
): ReadyForReviewAdapter {
  return async (input) => {
    const env = input.env ?? process.env;
    const cwd = input.cwd ?? process.cwd();
    const adapterMode = resolveGithubActionAdapterMode(env);
    const base: ReadyForReviewResult = {
      ok: false,
      code: "READY_FAILED",
      detail: "",
      adapterMode,
      prNumber: input.prNumber,
      expectedSha: input.expectedSha,
      beforeDraft: input.beforeDraft,
      afterDraft: null,
      remoteVerified: false,
      remoteState: null,
      remoteHeadSha: null,
      remoteUrl: null,
    };

    if (adapterMode === "MOCK") {
      return {
        ...base,
        code: "ADAPTER_MOCK",
        detail:
          "MOCK adapter cannot produce live runtime SUCCESS — inject test adapter in unit tests only",
      };
    }
    if (adapterMode === "UNAVAILABLE") {
      return {
        ...base,
        code: "ADAPTER_UNAVAILABLE",
        detail: "GitHub action adapter unavailable",
      };
    }

    try {
      await ghExec("gh", ["pr", "ready", String(input.prNumber)], {
        cwd,
        timeoutMs: 45_000,
        env,
      });
    } catch (error) {
      return {
        ...base,
        code: "GH_READY_FAILED",
        detail:
          error instanceof Error ? error.message.slice(0, 800) : "gh pr ready failed",
      };
    }

    let viewRaw: string;
    try {
      const viewed = await ghExec(
        "gh",
        [
          "pr",
          "view",
          String(input.prNumber),
          "--json",
          "number,isDraft,state,headRefOid,url",
        ],
        { cwd, timeoutMs: 45_000, env },
      );
      viewRaw = viewed.stdout;
    } catch (error) {
      return {
        ...base,
        code: "GH_UNAVAILABLE",
        detail:
          error instanceof Error
            ? error.message.slice(0, 800)
            : "gh pr view failed",
      };
    }

    const remote = parsePrViewJson(viewRaw);
    if (!remote) {
      return {
        ...base,
        code: "REMOTE_STATE_MISMATCH",
        detail: "unable to parse gh pr view JSON",
      };
    }

    const verified = verifyReadyRemoteState({
      expectedPrNumber: input.prNumber,
      expectedSha: input.expectedSha,
      remote,
    });

    return {
      ...base,
      ok: verified.ok,
      code: verified.code,
      detail: verified.detail,
      afterDraft: remote.isDraft,
      remoteVerified: verified.ok,
      remoteState: remote.state,
      remoteHeadSha: remote.headRefOid,
      remoteUrl: remote.url,
    };
  };
}

/** Test-only injectable mock — never used as live runtime SUCCESS path by default. */
export function createMockReadyForReviewAdapter(
  result: Partial<ReadyForReviewResult> & Pick<ReadyForReviewResult, "ok" | "code">,
): ReadyForReviewAdapter {
  return async (input) => ({
    ok: result.ok,
    code: result.code,
    detail: result.detail ?? result.code,
    adapterMode: "MOCK",
    prNumber: input.prNumber,
    expectedSha: input.expectedSha,
    beforeDraft: input.beforeDraft,
    afterDraft: result.afterDraft ?? null,
    remoteVerified: result.remoteVerified ?? false,
    remoteState: result.remoteState ?? null,
    remoteHeadSha: result.remoteHeadSha ?? null,
    remoteUrl: result.remoteUrl ?? null,
  });
}

const defaultReadyAdapter = createRealReadyForReviewAdapter();

/**
 * Mark PR ready for review with mandatory remote verification.
 * Optional `adapter` is for unit/e2e dependency injection only.
 */
export async function markPrReadyForReview(input: {
  prNumber: number;
  expectedSha?: string | null;
  beforeDraft?: boolean | null;
  env?: NodeJS.ProcessEnv;
  cwd?: string;
  adapter?: ReadyForReviewAdapter;
}): Promise<ReadyForReviewResult> {
  const adapter = input.adapter ?? defaultReadyAdapter;
  return adapter({
    prNumber: input.prNumber,
    expectedSha: input.expectedSha ?? null,
    beforeDraft: input.beforeDraft ?? null,
    cwd: input.cwd,
    env: input.env,
  });
}

export function productionActionsGate(
  env: NodeJS.ProcessEnv = process.env,
): { ok: boolean; message: string } {
  if (!isProductionActionsEnvEnabled(env)) {
    return {
      ok: false,
      message: "X200_PRODUCTION_ACTIONS_ENABLED=false",
    };
  }
  return { ok: true, message: "ok" };
}
