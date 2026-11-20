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
  { value: "business-customer", label: "Business customer" },
  { value: "other", label: "Other" },
] as const;

export const initiativeStages = [
  { value: "concept", label: "Concept" },
  { value: "documented-initiative", label: "Documented initiative" },
  { value: "institutional-discussion", label: "Institutional discussion" },
  { value: "investment-preparation", label: "Investment preparation" },
  { value: "governance-support-required", label: "Governance support required" },
] as const;

/** Contact intents. `product` is the short customer path; the others are governance intents. */
export const governanceIntents = ["collaboration", "initiative", "eligibility"] as const;
export const contactIntents = ["product", ...governanceIntents] as const;

/** Products offered in the product inquiry / quote path. */
export const productOptions = [
  { value: "clevone-dms", label: "CLEVONE DMS" },
  { value: "other-solution", label: "Other solution" },
] as const;

export const productNeedMaxLength = 1500;

export type ContactIntentValue = (typeof contactIntents)[number];
export type GovernanceIntent = (typeof governanceIntents)[number];
export type ProductOption = (typeof productOptions)[number]["value"];
export type ActorType = (typeof actorTypes)[number]["value"];
export type InitiativeStage = (typeof initiativeStages)[number]["value"];
