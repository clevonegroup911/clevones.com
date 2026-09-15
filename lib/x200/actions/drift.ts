import type {
  DriftSnapshot,
  DriftState,
} from "@/lib/x200/actions/types";

export function computeDrift(input: {
  localHead: string | null;
  prHead: string | null;
  mainHead: string | null;
  deployedProductionSha: string | null;
  productCompleteHead: string | null;
}): DriftSnapshot {
  const known = [
    input.localHead,
    input.prHead,
    input.mainHead,
    input.deployedProductionSha,
    input.productCompleteHead,
  ].filter((v): v is string => typeof v === "string" && v.length > 0);

  if (known.length < 2) {
    return {
      ...input,
      state: "UNKNOWN",
      detail: "Insufficient SHA signals to compare drift",
      blocksDeploy: true,
    };
  }

  const unique = new Set(known.map((s) => s.slice(0, 40)));
  const state: DriftState = unique.size === 1 ? "IN_SYNC" : "DRIFT";

  // Critical unexplained drift: local/PR vs production when both known and differ.
  const blocksDeploy =
    state === "DRIFT" &&
    Boolean(input.deployedProductionSha) &&
    Boolean(input.localHead || input.prHead) &&
    input.deployedProductionSha !== (input.prHead ?? input.localHead);

  const detail =
    state === "IN_SYNC"
      ? "Compared SHAs are aligned"
      : `Distinct SHAs detected (${unique.size}): local=${short(input.localHead)} pr=${short(input.prHead)} main=${short(input.mainHead)} prod=${short(input.deployedProductionSha)} complete=${short(input.productCompleteHead)}`;

  return {
    localHead: input.localHead,
    prHead: input.prHead,
    mainHead: input.mainHead,
    deployedProductionSha: input.deployedProductionSha,
    productCompleteHead: input.productCompleteHead,
    state,
    detail,
    blocksDeploy,
  };
}

function short(sha: string | null): string {
  return sha ? sha.slice(0, 7) : "N/A";
}
