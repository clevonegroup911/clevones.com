import { capacityVsPlatformClarification } from "@/lib/constants/corporate-purpose";

export const faqPageHero = {
  eyebrow: "FAQ",
  title: "Institutional questions, structural answers",
  subtitle:
    "Clarity on Clevones' role, corporate purpose, ecosystem, and engagement criteria.",
} as const;

export type FaqItem = {
  question: string;
  answer: string;
};

export const faqPageItems: readonly FaqItem[] = [
  {
    question: "What is Clevones?",
    answer:
      "Clevones is a neutral governance architecture platform that designs, structures, and coordinates territorial economic flows in the Democratic Republic of Congo and across Africa. It transforms territorial potential into durable economic assets through technology, logistics, digital infrastructure, economic intelligence, and coordination platforms.",
  },
  {
    question: "What is Clevones' corporate purpose (objet social)?",
    answer:
      "The corporate purpose defines legal fields of intervention: technology and digital transformation; transport, logistics, and supply chains; industry and productive innovation; energy; media and creative industries; education and capacity building; strategic advisory, compliance, and governance; sports, culture, and professional events; and lawful commerce and distribution. It also provides for subsidiaries, equity participations, partnerships, and related operations under applicable law.",
  },
  {
    question:
      "Does a broad corporate purpose mean Clevones is a multi-service operator?",
    answer: capacityVsPlatformClarification.en,
  },
  {
    question: "How does the ecosystem relate to the corporate purpose?",
    answer:
      "Specialized entities extend domain capacity under a shared architectural mandate: Clevodia (media and economic intelligence), Clevonet (secure digital infrastructure), Bicuni (scientific knowledge), and Btlearn Inc. (certified education). Clevone Mining is presented as an ecosystem project / entity with distinct status. Clevones remains the company hub. No separate legal registration is claimed except for CLEVONE SARL.",
  },
  {
    question: "Is Clevone Mining part of the governance platform?",
    answer:
      "Clevone Mining is presented as an ecosystem project / entity with distinct status. It is not described on this site as an operational mining unit. No separate legal registration is claimed except for CLEVONE SARL.",
  },
  {
    question: "Who can engage with Clevones?",
    answer:
      "Serious institutions, investors, structured logistics actors, and strategic partners with documented initiatives. Engagement is filtered for legitimacy, strategic relevance, compliance readiness, institutional compatibility, coordination maturity, and long-term value.",
  },
  {
    question: "What does Clevones not do?",
    answer:
      "As a governance platform, Clevones is not an operator, trader, resource exploiter, direct intermediary, informal broker, or generic services vendor. It does not substitute legitimate economic actors or conduct undocumented facilitation.",
  },
  {
    question: "How does collaboration begin?",
    answer:
      "Through a structured initiative submission. Clevones reviews documented, compliant proposals under its Five-Step Framework — Territorial Reading, Flow Mapping, Governance Structuring, Collaboration Framework, and Strategic Reporting — not through informal discussion or commercial intermediation.",
  },
] as const;

export const faqPageCta = {
  title: "Still assessing fit?",
  description:
    "Submit a structured initiative or request an eligibility review under Clevones governance criteria.",
} as const;
