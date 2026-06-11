export const methodologyPageHero = {
  eyebrow: "Methodology",
  title: "The Clevones Five-Step Governance Framework",
  subtitle:
    "A disciplined, sequential methodology that structures territorial initiatives from initial reading through strategic reporting — without operational exposure or sensitive disclosure.",
} as const;

export const methodologyPageIntroduction = {
  eyebrow: "Introduction",
  title: "Disciplined structure for every territorial initiative",
  paragraphs: [
    "Clevones does not approach territorial economic potential through improvisation or informal coordination. Every engagement follows a governed methodology — five sequential phases that bring institutional discipline to complex territorial dynamics.",
    "This framework ensures that initiatives are read accurately, flows are mapped responsibly, governance is designed before execution, collaboration is structured between legitimate actors, and strategic reporting sustains accountability throughout.",
    "The methodology is applied consistently across engagements. It protects institutional credibility, preserves compliance integrity, and produces documented outcomes that serious actors can rely upon.",
  ],
} as const;

export type MethodologyStep = {
  number: string;
  title: string;
  summary: string;
  paragraphs: readonly string[];
  highlights: readonly string[];
};

export const methodologyPageSteps: readonly MethodologyStep[] = [
  {
    number: "01",
    title: "Territorial Reading",
    summary:
      "Non-sensitive territorial understanding that establishes institutional context before any structural design.",
    paragraphs: [
      "Territorial Reading is the foundational phase. Before flows can be mapped or governance designed, Clevones conducts a systematic assessment of the territorial environment — using only non-sensitive, institutionally appropriate intelligence.",
      "This phase does not involve field operations, resource claims, or commercial positioning. It produces a governed understanding of the territorial landscape that informs every subsequent step.",
    ],
    highlights: [
      "Institutional context — regulatory frameworks, administrative structures, and governance traditions relevant to the territory",
      "Logistics constraints at macro level — infrastructure capacity, corridor dynamics, and circulation patterns without operational detail",
      "Stakeholder categories — classification of legitimate institutional, economic, and strategic actors by role and standing",
      "Governance environment — existing coordination mechanisms, compliance expectations, and institutional interfaces",
    ],
  },
  {
    number: "02",
    title: "Flow Mapping",
    summary:
      "Architecture of economic flows documented without exposing sensitive operational or commercial data.",
    paragraphs: [
      "Flow Mapping translates territorial reading into a structured representation of how economic value circulates — dependencies, coordination gaps, and structural relationships between legitimate actors.",
      "The output is an architectural document, not an operational plan. Sensitive commercial data, proprietary logistics detail, and confidential actor information are excluded by design.",
    ],
    highlights: [
      "Circulation patterns — documented pathways of economic value across territorial systems",
      "Structural dependencies — relationships between actors, institutions, and infrastructure without commercial exposure",
      "Coordination gaps — identified friction points where governance architecture is required",
      "Flow architecture — a neutral, institutionally legible map that informs governance design",
    ],
  },
  {
    number: "03",
    title: "Governance Structuring",
    summary:
      "Design of roles, responsibilities, reporting lines, compliance checkpoints, and escalation mechanisms.",
    paragraphs: [
      "Governance Structuring converts flow architecture into operational governance frameworks. This phase defines who decides, who reports, who is accountable, and how compliance is verified at each stage.",
      "The frameworks are aligned with institutional requirements and territorial realities — producing documented structures that legitimate actors can adopt without ambiguity or informal discretion.",
    ],
    highlights: [
      "Roles and responsibilities — clearly defined governance functions for each participating actor category",
      "Reporting architecture — structured communication lines between institutions, partners, and strategic actors",
      "Compliance checkpoints — documented verification points aligned with applicable regulatory standards",
      "Escalation mechanisms — governed pathways for resolving structural issues without informal intervention",
    ],
  },
  {
    number: "04",
    title: "Collaboration Framework",
    summary:
      "Structured collaboration protocols between institutions, partners, investors, and strategic actors.",
    paragraphs: [
      "The Collaboration Framework establishes how legitimate actors engage within the governed structure. Clevones designs neutral coordination protocols — not commercial intermediation — that align institutions, partners, investors, and strategic actors around documented objectives.",
      "Collaboration is controlled, documented, and institutionally disciplined. Informal arrangements, discretionary facilitation, and undisclosed actor relationships are excluded from the framework.",
    ],
    highlights: [
      "Institutional alignment — protocols for engagement between public, regulatory, and governance bodies",
      "Partner coordination — structured interfaces for economic and logistics actors within governed boundaries",
      "Investor engagement — documented frameworks for capital alignment without operational intermediation",
      "Strategic actor integration — governed participation of long-horizon actors with institutional standing",
    ],
  },
  {
    number: "05",
    title: "Strategic Reporting",
    summary:
      "Executive reports, governance notes, readiness assessments, and decision-support documents.",
    paragraphs: [
      "Strategic Reporting closes the methodology loop. Disciplined reporting architecture ensures that every phase produces documented outputs — executive summaries, governance notes, readiness assessments, and decision-support materials for institutional stakeholders.",
      "Reporting sustains transparency, accountability, and institutional credibility across the full lifecycle of a territorial initiative. It is not a final deliverable — it is an ongoing governance discipline.",
    ],
    highlights: [
      "Executive reports — structured summaries for institutional decision-makers and governance bodies",
      "Governance notes — documented observations on compliance status, structural integrity, and coordination health",
      "Readiness reports — assessments of initiative maturity against governance and compliance criteria",
      "Decision-support documents — institutionally legible materials that inform strategic choices without operational bias",
    ],
  },
] as const;

export const methodologyPagePrinciples = [
  {
    title: "Neutrality",
    description:
      "Governance design exercised without commercial interest, operational bias, or actor substitution.",
  },
  {
    title: "Documentation",
    description:
      "Every phase produces structured, auditable outputs — not informal understandings or verbal agreements.",
  },
  {
    title: "Compliance",
    description:
      "Frameworks aligned with applicable regulatory and institutional standards from inception.",
  },
  {
    title: "Non-sensitive intelligence",
    description:
      "Territorial reading and flow mapping exclude proprietary, commercial, or operationally sensitive data.",
  },
  {
    title: "Controlled collaboration",
    description:
      "Actor engagement governed by documented protocols — not informal or discretionary arrangements.",
  },
  {
    title: "Institutional discipline",
    description:
      "Sequential methodology applied consistently — structure before execution, governance before capital.",
  },
] as const;

export const methodologyPageCta = {
  title: "Ready to structure a territorial initiative?",
  description:
    "Submit a structured initiative for governed assessment under the Clevones Five-Step Framework.",
} as const;
