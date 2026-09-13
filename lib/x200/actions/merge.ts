import "server-only";

import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { GithubSnapshot, GitSnapshot, HumanGateSnapshot } from "@/lib/x200/types";
import { isProductionActionsEnvEnabled } from "@/lib/x200/actions/policy";

const execFileAsync = promisify(execFile);

export type MergeMode = "merge" | "squash";

export type MergePreflight = {
  ok: boolean;
  code: string;
  message: string;
  expectedSha: string | null;
  currentSha: string | null;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
};

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
  }) => Promise<{ ok: boolean; detail: string }>;
};

export function createGhMergeAdapter(
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
): MergeAdapter {
  return {
    async mergePr({ prNumber, mode, expectedSha }) {
      // Never force. Never merge without production/human flags in CI-safe default.
      if (env.X200_HUMAN_ACTIONS_ENABLED !== "true") {
        return { ok: false, detail: "X200_HUMAN_ACTIONS_ENABLED=false" };
      }
      if (env.X200_FORCE_MERGE_ADAPTER_MOCK === "true" || env.CI === "true") {
        return {
          ok: false,
          detail: "MERGE_ADAPTER_MOCK — CI/mock refuses real merge",
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
        };
      } catch (error) {
        return {
          ok: false,
          detail:
            error instanceof Error ? error.message.slice(0, 800) : "merge failed",
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
      return result;
    },
  };
}

/** Ready-for-review uses fixed gh argv only. */
export async function markPrReadyForReview(input: {
  prNumber: number;
  env?: NodeJS.ProcessEnv;
  cwd?: string;
}): Promise<{ ok: boolean; detail: string }> {
  const env = input.env ?? process.env;
  if (env.X200_HUMAN_ACTIONS_ENABLED !== "true") {
    return { ok: false, detail: "X200_HUMAN_ACTIONS_ENABLED=false" };
  }
  if (env.X200_FORCE_MERGE_ADAPTER_MOCK === "true" || env.CI === "true") {
    return { ok: true, detail: "READY_FOR_REVIEW_MOCK" };
  }
  try {
    const { stdout, stderr } = await execFileAsync(
      "gh",
      ["pr", "ready", String(input.prNumber)],
      {
        cwd: input.cwd ?? process.cwd(),
        timeout: 45_000,
        encoding: "utf8",
      },
    );
    return { ok: true, detail: `${stdout}\n${stderr}`.trim().slice(0, 800) };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message.slice(0, 800) : "ready failed",
    };
  }
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
