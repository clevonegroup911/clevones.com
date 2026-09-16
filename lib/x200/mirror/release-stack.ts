import type {
  ReleaseStackNode,
  ReleaseStackSnapshot,
} from "@/lib/x200/mirror/types";

export type OpenPrLite = {
  number: number;
  title: string;
  base: string;
  head: string;
  headSha: string | null;
  draft: boolean | null;
  mergeable: string | null;
  ciConclusion: string | null;
  url: string | null;
};

export type ReleaseStackInput = {
  openPrs: OpenPrLite[];
  currentPrNumber: number | null;
  githubStatus?: string | null;
  openPrsSource?: string | null;
};

function unverifiedStack(
  status: ReleaseStackSnapshot["status"],
  reason: string,
): ReleaseStackSnapshot {
  return {
    status,
    nodes: [],
    mergeOrder: [],
    nextSafeMerge: null,
    nextSafeMergeReason: reason,
    requiresApproval: true,
    warning: reason,
  };
}

/**
 * Detect stacked PRs from base↔head relationships for the CURRENT PR only.
 * Does not execute merges — only recommends NEXT SAFE MERGE from verified GitHub truth.
 * Never invents a predecessor from unrelated open PRs.
 */
export function buildReleaseStack(input: ReleaseStackInput): ReleaseStackSnapshot {
  const source = input.openPrsSource ?? null;

  if (source === "NOT_CONNECTED") {
    return unverifiedStack(
      "NOT_CONNECTED",
      "UNKNOWN / NOT_CONNECTED — GitHub truth not verified; predecessor not derived",
    );
  }
  if (source === "UNKNOWN" || source === "ERROR") {
    return unverifiedStack(
      "UNKNOWN",
      "UNKNOWN / NOT_CONNECTED — GitHub truth not verified; predecessor not derived",
    );
  }

  if (!input.openPrs.length) {
    return unverifiedStack("UNKNOWN", "No open PRs observed");
  }

  const byHead = new Map(input.openPrs.map((pr) => [pr.head, pr]));
  const nodes: ReleaseStackNode[] = input.openPrs.map((pr) => {
    const dependsOn: number[] = [];
    // If this PR's base is another open PR's head branch → stacked dependency.
    const baseOwner = byHead.get(pr.base);
    if (baseOwner && baseOwner.number !== pr.number) {
      dependsOn.push(baseOwner.number);
    }
    let readyState: ReleaseStackNode["readyState"] = "UNKNOWN";
    if (pr.draft === true) readyState = "DRAFT";
    else if (pr.draft === false && pr.ciConclusion === "success")
      readyState = "READY";
    else if (pr.ciConclusion && pr.ciConclusion !== "success")
      readyState = "BLOCKED";

    return {
      prNumber: pr.number,
      title: pr.title,
      base: pr.base,
      head: pr.head,
      headSha: pr.headSha,
      draft: pr.draft,
      mergeable: pr.mergeable,
      ciConclusion: pr.ciConclusion,
      dependsOn,
      readyState,
      url: pr.url,
    };
  });

  // Topological merge order of ALL observed PRs (display/context only).
  const remaining = new Set(nodes.map((n) => n.prNumber));
  const globalOrder: number[] = [];
  while (remaining.size > 0) {
    const ready = [...remaining].filter((num) => {
      const node = nodes.find((n) => n.prNumber === num)!;
      return node.dependsOn.every((dep) => !remaining.has(dep));
    });
    if (ready.length === 0) {
      globalOrder.push(...[...remaining].sort((a, b) => a - b));
      break;
    }
    ready.sort((a, b) => a - b);
    for (const num of ready) {
      globalOrder.push(num);
      remaining.delete(num);
    }
  }

  if (input.currentPrNumber == null) {
    return {
      status: "OK",
      nodes,
      mergeOrder: [],
      nextSafeMerge: null,
      nextSafeMergeReason:
        "No current PR observed — predecessor not derived from unrelated open PRs",
      requiresApproval: true,
      warning: null,
    };
  }

  const current = nodes.find((n) => n.prNumber === input.currentPrNumber);
  if (!current) {
    return {
      status: "OK",
      nodes,
      mergeOrder: [],
      nextSafeMerge: null,
      nextSafeMergeReason: `Current PR #${input.currentPrNumber} not in verified open PR list — predecessor unknown`,
      requiresApproval: true,
      warning: null,
    };
  }

  const stack = new Set<number>();
  const walk = (num: number) => {
    if (stack.has(num)) return;
    stack.add(num);
    const node = nodes.find((n) => n.prNumber === num);
    for (const dep of node?.dependsOn ?? []) walk(dep);
  };
  walk(current.prNumber);

  const mergeOrder = globalOrder.filter((num) => stack.has(num));
  const nextCandidate = mergeOrder.find((num) => {
    const node = nodes.find((n) => n.prNumber === num);
    return node && node.readyState !== "BLOCKED";
  });
  const nextNode = nextCandidate
    ? nodes.find((n) => n.prNumber === nextCandidate)
    : null;

  return {
    status: "OK",
    nodes,
    mergeOrder,
    nextSafeMerge: nextCandidate ?? null,
    nextSafeMergeReason: nextNode
      ? nextNode.prNumber === current.prNumber
        ? `PR #${nextNode.prNumber} is the root of the current stack (base=${current.base}); no stacked predecessor`
        : `PR #${nextNode.prNumber} is the verified stacked predecessor of PR #${current.prNumber} (base=${current.base} → head of #${nextNode.prNumber})`
      : "No safe merge candidate in current stack",
    requiresApproval: true,
    warning: null,
  };
}
