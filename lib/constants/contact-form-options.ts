/**
 * Domain options for the institutional contact / initiative form.
 * Dependency-free: safe to import from validation schemas and UI modules.
 */
export const actorTypes = [
  { value: "institution", label: "Institution" },
  { value: "investor", label: "Investor" },
  { value: "structured-logistics", label: "Structured logistics actor" },
  { value: "strategic-partner", label: "Strategic partner" },
  { value: "academic-research", label: "Academic / research actor" },
  { value: "other", label: "Other" },
] as const;

export const initiativeStages = [
  { value: "concept", label: "Concept" },
  { value: "documented-initiative", label: "Documented initiative" },
  { value: "institutional-discussion", label: "Institutional discussion" },
  { value: "investment-preparation", label: "Investment preparation" },
  { value: "governance-support-required", label: "Governance support required" },
] as const;

export type ActorType = (typeof actorTypes)[number]["value"];
export type InitiativeStage = (typeof initiativeStages)[number]["value"];
