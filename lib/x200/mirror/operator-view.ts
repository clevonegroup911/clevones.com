import type {
  NextSafeAction,
  OperatorViewSnapshot,
  SourceMatrixRow,
} from "@/lib/x200/mirror/types";
import type {
  Blocker,
  GithubSnapshot,
  HumanGateSnapshot,
} from "@/lib/x200/types";

/** Observable operator brief — no private chain-of-thought. */
export function buildOperatorView(input: {
  github: GithubSnapshot;
  humanGate: HumanGateSnapshot;
  sourcesMatrix: SourceMatrixRow[];
  blockers: Blocker[];
  nextSafeAction: NextSafeAction;
  driftLabel: string;
  mainHead: string | null;
}): OperatorViewSnapshot {
  const facts: string[] = [];
  if (input.github.prNumber != null) {
    facts.push(`PR #${input.github.prNumber} ${input.github.prState ?? "unknown"}`);
  }
  if (typeof input.github.prDraft === "boolean") {
    facts.push(`draft=${input.github.prDraft}`);
  }
  if (input.github.prMergeable) {
    facts.push(`mergeable=${input.github.prMergeable}`);
  }
  if (input.github.ciLatestRunNumber != null) {
    facts.push(
      `CI #${input.github.ciLatestRunNumber} ${input.github.ciLatestConclusion ?? input.github.ciLatestStatus ?? "unknown"}`,
    );
  }
  if (input.github.prHeadSha) {
    facts.push(`PR HEAD ${input.github.prHeadSha.slice(0, 12)}`);
  }
  if (input.mainHead) {
    facts.push(`main HEAD ${input.mainHead.slice(0, 12)}`);
  }
  facts.push(`drift=${input.driftLabel}`);

  const evidence: string[] = [];
  if (input.github.status === "OK") evidence.push("GitHub remote");
  evidence.push("git local");
  evidence.push("backlog.json");

  const conflicts = input.sourcesMatrix
    .filter((row) => row.conflict)
    .map((row) => row.conflictLabel ?? `SOURCE_CONFLICT:${row.domain}`);

  const risks: string[] = [];
  if (input.humanGate.present) risks.push("Human Gate active");
  if (input.github.prDraft === true) risks.push("PR still draft");
  if (
    input.github.ciLatestConclusion &&
    input.github.ciLatestConclusion !== "success"
  ) {
    risks.push(`CI ${input.github.ciLatestConclusion}`);
  }

  const blockers = input.blockers.map(
    (b) => `[${b.severity}] ${b.title}: ${b.detail}`,
  );

  return {
    currentFacts: facts.length ? facts : ["No remote PR/CI facts available"],
    evidence,
    conflicts,
    risks,
    blockers,
    nextSafeAction: `${input.nextSafeAction.code}: ${input.nextSafeAction.detail}`,
    humanDecisionRequired: input.nextSafeAction.requiresHuman
      ? input.nextSafeAction.title
      : input.humanGate.present
        ? input.humanGate.requiredAction
        : null,
  };
}
