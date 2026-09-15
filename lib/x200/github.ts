import "server-only";

import type { GithubSnapshot, SourceStatus } from "@/lib/x200/types";

const DEFAULT_REPO = "clevonegroup911/clevones.com";
const USER_AGENT = "clevones-x200-control-center/T042";

function optionalGithubToken(): string | null {
  const token =
    process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim() || null;
  return token && token.length > 0 ? token : null;
}

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": USER_AGENT,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = optionalGithubToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function githubGet(url: string): Promise<
  | { ok: true; status: number; json: unknown }
  | { ok: false; status: number | null; error: string }
> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: githubHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: `GitHub HTTP ${response.status}`,
      };
    }
    return { ok: true, status: response.status, json: await response.json() };
  } catch (error) {
    return {
      ok: false,
      status: null,
      error: error instanceof Error ? error.message : "GitHub unreachable",
    };
  }
}

function emptyGithub(
  repository: string,
  status: SourceStatus,
  warning: string | null,
): GithubSnapshot {
  return {
    status,
    warning,
    repository,
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
  };
}

export async function readGithubSnapshot(options: {
  repository?: string | null;
  branch?: string | null;
}): Promise<GithubSnapshot> {
  const repository = options.repository?.trim() || DEFAULT_REPO;
  const branch = options.branch?.trim() || null;

  if (!branch) {
    return emptyGithub(
      repository,
      "UNKNOWN",
      "No local branch available for GitHub lookup",
    );
  }

  const prUrl = `https://api.github.com/repos/${repository}/pulls?head=${encodeURIComponent(
    `${repository.split("/")[0]}:${branch}`,
  )}&state=all&per_page=5`;

  const prRes = await githubGet(prUrl);
  if (!prRes.ok) {
    return emptyGithub(
      repository,
      "UNKNOWN",
      `GitHub PR lookup unavailable: ${prRes.error}`,
    );
  }

  const prs = Array.isArray(prRes.json) ? prRes.json : [];
  const pr =
    prs.find(
      (item): item is Record<string, unknown> =>
        Boolean(item && typeof item === "object" && !Array.isArray(item)),
    ) ?? null;

  let snapshot = emptyGithub(repository, "OK", null);

  if (pr) {
    const head =
      pr.head && typeof pr.head === "object" && !Array.isArray(pr.head)
        ? (pr.head as Record<string, unknown>)
        : null;
    snapshot = {
      ...snapshot,
      prNumber: typeof pr.number === "number" ? pr.number : null,
      prTitle: typeof pr.title === "string" ? pr.title.slice(0, 200) : null,
      prState: typeof pr.state === "string" ? pr.state : null,
      prDraft: typeof pr.draft === "boolean" ? pr.draft : null,
      prMergeable:
        typeof pr.mergeable_state === "string"
          ? pr.mergeable_state
          : typeof pr.mergeable === "boolean"
            ? String(pr.mergeable)
            : null,
      prHeadSha: typeof head?.sha === "string" ? head.sha : null,
      prUrl: typeof pr.html_url === "string" ? pr.html_url : null,
    };
  } else {
    snapshot = {
      ...snapshot,
      warning: `No PR found for branch ${branch}`,
    };
  }

  const runsUrl = `https://api.github.com/repos/${repository}/actions/runs?branch=${encodeURIComponent(
    branch,
  )}&per_page=5`;
  const runsRes = await githubGet(runsUrl);
  if (!runsRes.ok) {
    return {
      ...snapshot,
      status: snapshot.prNumber ? "OK" : "UNKNOWN",
      warning: [snapshot.warning, `CI lookup unavailable: ${runsRes.error}`]
        .filter(Boolean)
        .join("; "),
    };
  }

  const runsBody =
    runsRes.json && typeof runsRes.json === "object" && !Array.isArray(runsRes.json)
      ? (runsRes.json as Record<string, unknown>)
      : null;
  const runs = Array.isArray(runsBody?.workflow_runs)
    ? runsBody.workflow_runs
    : [];
  const run =
    runs.find(
      (item): item is Record<string, unknown> =>
        Boolean(item && typeof item === "object" && !Array.isArray(item)),
    ) ?? null;

  if (run) {
    snapshot = {
      ...snapshot,
      ciLatestRunId: typeof run.id === "number" ? run.id : null,
      ciLatestRunNumber:
        typeof run.run_number === "number" ? run.run_number : null,
      ciLatestConclusion:
        typeof run.conclusion === "string" ? run.conclusion : null,
      ciLatestStatus: typeof run.status === "string" ? run.status : null,
      ciLatestUrl: typeof run.html_url === "string" ? run.html_url : null,
      ciLatestName: typeof run.name === "string" ? run.name : null,
    };
  }

  return snapshot;
}
