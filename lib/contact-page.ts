import { governanceAcknowledgmentText } from "@/lib/constants/brand-positioning";

export const contactPageHero = {
  eyebrow: "Contact",
  title: "Initiate a Strategic Collaboration",
  subtitle:
    "Clevones reviews only structured, documented, and compliant initiatives.",
} as const;

export const contactPageForm = {
  governanceAcknowledgment: governanceAcknowledgmentText,
  submitLabel: "Submit structured initiative",
  sections: {
    organization: "Organization Information",
    actorType: "Actor Type",
    initiative: "Initiative Information",
    confirmation: "Confirmation",
  },
} as const;

export type ContactIntent = "initiative" | "eligibility" | "collaboration";

export const contactPageGuidance = {
  title: "What happens next",
  description:
    "Clevones reviews submissions on a structured, institutional basis. Eligible initiatives proceed to governed assessment — not informal discussion or commercial intermediation.",
  steps: [
    "Submit organization details, actor type, and initiative documentation.",
    "Clevones applies governance and compliance filters before any coordination begins.",
    "Qualified initiatives receive a structured response within institutional timelines.",
  ],
} as const;

export const contactPageIntents: Record<
  ContactIntent,
  { eyebrow: string; title: string; subtitle: string; submitLabel: string }
> = {
  collaboration: {
    eyebrow: contactPageHero.eyebrow,
    title: contactPageHero.title,
    subtitle: contactPageHero.subtitle,
    submitLabel: contactPageForm.submitLabel,
  },
  initiative: {
    eyebrow: "Structured initiative",
    title: "Submit a Structured Initiative",
    subtitle:
      "Provide documented initiative details for governed assessment under the Clevones Five-Step Framework.",
    submitLabel: "Submit structured initiative",
  },
  eligibility: {
    eyebrow: "Eligibility review",
    title: "Check Initiative Eligibility",
    subtitle:
      "Assess whether your initiative meets Clevones governance criteria — legitimacy, compliance readiness, and institutional compatibility — before formal coordination.",
    submitLabel: "Request eligibility review",
  },
};

export function resolveContactIntent(
  value: string | undefined,
): ContactIntent {
  if (value === "initiative" || value === "eligibility") {
    return value;
  }

  return "collaboration";
}
