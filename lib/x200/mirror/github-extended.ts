import "server-only";

import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { CiJobDetail } from "@/lib/x200/mirror/types";
import type { OpenPrLite } from "@/lib/x200/mirror/release-stack";
import {
  githubApiGet,
  isValidGithubRepository,
  isValidPositiveInt,
  type GithubTransportSource,
} from "@/lib/x200/github-client";

const execFileAsync = promisify(execFile);
const DEFAULT_REPO = "clevonegroup911/clevones.com";

export type GithubFetchMeta = {
  source: GithubTransportSource;
  warning: string | null;
};

export async function fetchMainHead(
  repository = DEFAULT_REPO,
): Promise<{ sha: string | null } & GithubFetchMeta> {
  if (!isValidGithubRepository(repository)) {
    return {
      sha: null,
      source: "NOT_CONNECTED",
      warning: "Invalid repository identifier",
    };
  }
  const res = await githubApiGet(
    `https://api.github.com/repos/${repository}/commits/main`,
  );
  if (!res.ok) {
    return {
      sha: null,
      source: res.source,
      warning: `main HEAD unavailable: ${res.error}`,
    };
  }
  const body =
    res.json && typeof res.json === "object" && !Array.isArray(res.json)
      ? (res.json as Record<string, unknown>)
      : null;
  const sha = typeof body?.sha === "string" ? body.sha : null;
  return {
    sha,
    source: res.source,
    warning: sha ? null : "main HEAD missing sha",
  };
}

export async function fetchOpenPrs(
  repository = DEFAULT_REPO,
): Promise<{ prs: OpenPrLite[] } & GithubFetchMeta> {
  if (!isValidGithubRepository(repository)) {
    return {
      prs: [],
      source: "NOT_CONNECTED",
      warning: "Invalid repository identifier",
    };
  }
  const res = await githubApiGet(
    `https://api.github.com/repos/${repository}/pulls?state=open&per_page=20`,
  );
  if (!res.ok) {
    return {
      prs: [],
      source: res.source,
      warning: `open PRs unavailable: ${res.error}`,
    };
  }
  const list = Array.isArray(res.json) ? res.json : [];
  const prs: OpenPrLite[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const pr = item as Record<string, unknown>;
    const base =
      pr.base && typeof pr.base === "object" && !Array.isArray(pr.base)
        ? (pr.base as Record<string, unknown>)
        : null;
    const head =
      pr.head && typeof pr.head === "object" && !Array.isArray(pr.head)
        ? (pr.head as Record<string, unknown>)
        : null;
    if (typeof pr.number !== "number" || !isValidPositiveInt(pr.number)) continue;
    prs.push({
      number: pr.number,
      title: typeof pr.title === "string" ? pr.title.slice(0, 200) : `PR #${pr.number}`,
      base: typeof base?.ref === "string" ? base.ref : "unknown",
      head: typeof head?.ref === "string" ? head.ref : "unknown",
      headSha: typeof head?.sha === "string" ? head.sha : null,
      draft: typeof pr.draft === "boolean" ? pr.draft : null,
      mergeable:
        typeof pr.mergeable_state === "string"
          ? pr.mergeable_state
          : typeof pr.mergeable === "boolean"
            ? String(pr.mergeable)
            : null,
      ciConclusion: null,
      url: typeof pr.html_url === "string" ? pr.html_url : null,
    });
  }
  return { prs, source: res.source, warning: null };
}

export async function fetchCiJobs(input: {
  repository?: string;
  runId: number | null;
}): Promise<{
  jobs: CiJobDetail[];
  durationMs: number | null;
} & GithubFetchMeta> {
  if (input.runId == null || !isValidPositiveInt(input.runId)) {
    return {
      jobs: [],
      durationMs: null,
      source: "NOT_CONNECTED",
      warning: "No CI run id",
    };
  }
  const repository = input.repository ?? DEFAULT_REPO;
  if (!isValidGithubRepository(repository)) {
    return {
      jobs: [],
      durationMs: null,
      source: "NOT_CONNECTED",
      warning: "Invalid repository identifier",
    };
  }
  const res = await githubApiGet(
    `https://api.github.com/repos/${repository}/actions/runs/${input.runId}/jobs?per_page=50`,
  );
  if (!res.ok) {
    return {
      jobs: [],
      durationMs: null,
      source: res.source,
      warning: `CI jobs unavailable: ${res.error}`,
    };
  }
  const body =
    res.json && typeof res.json === "object" && !Array.isArray(res.json)
      ? (res.json as Record<string, unknown>)
      : null;
  const rawJobs = Array.isArray(body?.jobs) ? body.jobs : [];
  const jobs: CiJobDetail[] = [];
  let durationMs: number | null = null;

  for (const item of rawJobs) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const job = item as Record<string, unknown>;
    const startedAt = typeof job.started_at === "string" ? job.started_at : null;
    const completedAt =
      typeof job.completed_at === "string" ? job.completed_at : null;
    let jobDuration: number | null = null;
    if (startedAt && completedAt) {
      const ms = Date.parse(completedAt) - Date.parse(startedAt);
      if (Number.isFinite(ms) && ms >= 0) {
        jobDuration = ms;
        durationMs = (durationMs ?? 0) + ms;
      }
    }
    const stepsRaw = Array.isArray(job.steps) ? job.steps : [];
    const steps = stepsRaw
      .filter(
        (s): s is Record<string, unknown> =>
          Boolean(s && typeof s === "object" && !Array.isArray(s)),
      )
      .map((s) => ({
        name: typeof s.name === "string" ? s.name.slice(0, 160) : "step",
        status: typeof s.status === "string" ? s.status : null,
        conclusion: typeof s.conclusion === "string" ? s.conclusion : null,
      }));

    jobs.push({
      name: typeof job.name === "string" ? job.name.slice(0, 160) : "job",
      status: typeof job.status === "string" ? job.status : null,
      conclusion: typeof job.conclusion === "string" ? job.conclusion : null,
      durationMs: jobDuration,
      startedAt,
      completedAt,
      steps,
    });
  }

  return { jobs, durationMs, source: res.source, warning: null };
}

/** Fixed argv only — never caller-controlled shell. */
export async function readLocalDiffNameStatus(): Promise<{
  nameStatus: string;
  numstat: string;
  warning: string | null;
}> {
  try {
    const [nameStatus, numstat] = await Promise.all([
      execFileAsync("git", ["diff", "--name-status", "HEAD"], {
        cwd: process.cwd(),
        timeout: 8_000,
        maxBuffer: 512 * 1024,
      }),
      execFileAsync("git", ["diff", "--numstat", "HEAD"], {
        cwd: process.cwd(),
        timeout: 8_000,
        maxBuffer: 512 * 1024,
      }),
    ]);
    return {
      nameStatus: nameStatus.stdout,
      numstat: numstat.stdout,
      warning: null,
    };
  } catch (error) {
    return {
      nameStatus: "",
      numstat: "",
      warning:
        error instanceof Error ? error.message : "git diff unavailable",
    };
  }
}

export async function readWorktreePath(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--show-toplevel"], {
      cwd: process.cwd(),
      timeout: 5_000,
      maxBuffer: 64 * 1024,
    });
    return stdout.trim() || process.cwd();
  } catch {
    return process.cwd();
  }
}
