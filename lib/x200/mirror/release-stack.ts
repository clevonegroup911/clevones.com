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

/**
 * Detect stacked PRs from base↔head relationships.
 * Does not execute merges — only recommends NEXT SAFE MERGE.
 */
export function buildReleaseStack(input: {
  openPrs: OpenPrLite[];
  currentPrNumber: number | null;
}): ReleaseStackSnapshot {
  if (!input.openPrs.length) {
    return {
      status: "UNKNOWN",
      nodes: [],
      mergeOrder: [],
      nextSafeMerge: null,
      nextSafeMergeReason: "No open PRs observed",
      requiresApproval: true,
      warning: null,
    };
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

  // Topological merge order: dependencies first.
  const remaining = new Set(nodes.map((n) => n.prNumber));
  const mergeOrder: number[] = [];
  while (remaining.size > 0) {
    const ready = [...remaining].filter((num) => {
      const node = nodes.find((n) => n.prNumber === num)!;
      return node.dependsOn.every((dep) => !remaining.has(dep));
    });
    if (ready.length === 0) {
      // Cycle / unresolved — append remaining deterministically.
      mergeOrder.push(...[...remaining].sort((a, b) => a - b));
      break;
    }
    ready.sort((a, b) => a - b);
    for (const num of ready) {
      mergeOrder.push(num);
      remaining.delete(num);
    }
  }

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
      ? `PR #${nextNode.prNumber} first in stack (base=${nextNode.base}); approval required before merge`
      : "No safe merge candidate",
    requiresApproval: true,
    warning: null,
  };
}
