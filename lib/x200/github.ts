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
    ciLatestHeadSha: null,
    ciShaMatch: status === "NOT_CONNECTED" ? "NOT_CONNECTED" : "UNKNOWN",
    githubSource: source,
  };
}

function asRunRecord(
  item: unknown,
): Record<string, unknown> | null {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
  return item as Record<string, unknown>;
}

function runHeadSha(run: Record<string, unknown>): string | null {
  return typeof run.head_sha === "string" && run.head_sha.trim()
    ? run.head_sha.trim()
    : null;
}

function shaEquals(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return false;
  return left === right || left.startsWith(right) || right.startsWith(left);
}

/**
 * Prefer a workflow run whose head_sha matches the displayed commit.
 * Never treat a newer commit as validated by an older branch SUCCESS.
 */
export function selectWorkflowRunForCommit(
  runs: unknown[],
  expectedSha: string | null,
): {
  run: Record<string, unknown> | null;
  ciShaMatch: GithubSnapshot["ciShaMatch"];
} {
  const normalized = runs.map(asRunRecord).filter(Boolean) as Record<
    string,
    unknown
  >[];
  if (normalized.length === 0) {
    return { run: null, ciShaMatch: expectedSha ? "UNKNOWN" : "UNKNOWN" };
  }

  if (expectedSha) {
    const match = normalized.find((run) => shaEquals(runHeadSha(run), expectedSha));
    if (match) {
      return { run: match, ciShaMatch: "MATCH" };
    }
  }

  const latest = normalized[0]!;
  const latestSha = runHeadSha(latest);
  if (!expectedSha || !latestSha) {
    return { run: latest, ciShaMatch: "UNKNOWN" };
  }
  return {
    run: latest,
    ciShaMatch: shaEquals(latestSha, expectedSha) ? "MATCH" : "MISMATCH",
  };
}

/**
 * Bind CI fields to a displayed commit. On MISMATCH, clear conclusion so UI/health
 * cannot advertise CI SUCCESS for the wrong SHA (raw run metadata stays via warning).
 */
export function bindCiToDisplayedCommit(
  snapshot: GithubSnapshot,
  expectedSha: string | null,
): GithubSnapshot {
  if (snapshot.status === "NOT_CONNECTED") {
    return { ...snapshot, ciShaMatch: "NOT_CONNECTED" };
  }

  const runSha = snapshot.ciLatestHeadSha;
  if (!expectedSha || !runSha) {
    return {
      ...snapshot,
      ciShaMatch: snapshot.ciShaMatch === "MATCH" ? "MATCH" : "UNKNOWN",
    };
  }

  if (shaEquals(runSha, expectedSha)) {
    return { ...snapshot, ciShaMatch: "MATCH" };
  }

  const shortRun = runSha.slice(0, 7);
  const shortExpected = expectedSha.slice(0, 7);
  const mismatchWarning = `CI SHA mismatch: run ${shortRun} ≠ displayed ${shortExpected} — SUCCESS not applied to current commit`;
  return {
    ...snapshot,
    ciShaMatch: "MISMATCH",
    // Do not present SUCCESS for a different commit.
    ciLatestConclusion: null,
    warning: [snapshot.warning, mismatchWarning].filter(Boolean).join("; "),
  };
}

export async function readGithubSnapshot(options: {
  repository?: string | null;
  branch?: string | null;
  /** Local HEAD or PR head — used to select/bind the CI run. */
  expectedSha?: string | null;
}): Promise<GithubSnapshot> {
  const repository = options.repository?.trim() || DEFAULT_REPO;
  const branch = options.branch?.trim() || null;
  const expectedSha = options.expectedSha?.trim() || null;

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

  const commitForCi = expectedSha || snapshot.prHeadSha;

  const runsUrl = `https://api.github.com/repos/${repository}/actions/runs?branch=${encodeURIComponent(
    branch,
  )}&per_page=5`;
  const runsRes = await githubApiGet(runsUrl);
  if (!runsRes.ok) {
    return {
      ...snapshot,
      status: snapshot.prNumber ? "OK" : "NOT_CONNECTED",
      githubSource: snapshot.prNumber ? snapshot.githubSource : runsRes.source,
      ciShaMatch: "NOT_CONNECTED",
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

  const selected = selectWorkflowRunForCommit(runs, commitForCi);
  const run = selected.run;

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
      ciLatestHeadSha: runHeadSha(run),
      ciShaMatch: selected.ciShaMatch,
    };
  }

  return bindCiToDisplayedCommit(snapshot, commitForCi);
}
