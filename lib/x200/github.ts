import "server-only";

import {
  githubApiGet,
  isValidGithubRepository,
  type GithubTransportSource,
} from "@/lib/x200/github-client";
import type { GithubSnapshot, SourceStatus } from "@/lib/x200/types";

const DEFAULT_REPO = "clevonegroup911/clevones.com";

function emptyGithub(
  repository: string,
  status: SourceStatus,
  warning: string | null,
  source: GithubTransportSource = "NOT_CONNECTED",
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
    githubSource: source,
  };
}

export async function readGithubSnapshot(options: {
  repository?: string | null;
  branch?: string | null;
}): Promise<GithubSnapshot> {
  const repository = options.repository?.trim() || DEFAULT_REPO;
  const branch = options.branch?.trim() || null;

  if (!isValidGithubRepository(repository)) {
    return emptyGithub(
      repository,
      "ERROR",
      "Invalid repository identifier",
      "NOT_CONNECTED",
    );
  }

  if (!branch) {
    return emptyGithub(
      repository,
      "UNKNOWN",
      "No local branch available for GitHub lookup",
    );
  }

  const owner = repository.split("/")[0]!;
  const prUrl = `https://api.github.com/repos/${repository}/pulls?head=${encodeURIComponent(
    `${owner}:${branch}`,
  )}&state=all&per_page=5`;

  const prRes = await githubApiGet(prUrl);
  if (!prRes.ok) {
    return emptyGithub(
      repository,
      "NOT_CONNECTED",
      `GitHub PR lookup unavailable: ${prRes.error}`,
      prRes.source,
    );
  }

  const prs = Array.isArray(prRes.json) ? prRes.json : [];
  const pr =
    prs.find(
      (item): item is Record<string, unknown> =>
        Boolean(item && typeof item === "object" && !Array.isArray(item)),
    ) ?? null;

  let snapshot = emptyGithub(repository, "OK", null, prRes.source);

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
  const runsRes = await githubApiGet(runsUrl);
  if (!runsRes.ok) {
    return {
      ...snapshot,
      status: snapshot.prNumber ? "OK" : "NOT_CONNECTED",
      githubSource: snapshot.prNumber ? snapshot.githubSource : runsRes.source,
      warning: [snapshot.warning, `CI lookup unavailable: ${runsRes.error}`]
        .filter(Boolean)
        .join("; "),
    };
  }

  snapshot = { ...snapshot, githubSource: runsRes.source };

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
