/**
 * Shared shell/UI copy loaded by locale.
 * Page-level institutional copy remains in `lib/*-page.ts` until migrated.
 */
import type { PageKey } from "@/lib/i18n/routes";
import type {
  ChallengePageContent,
  ContactPageContent,
  EcosystemPageContent,
  EvidencePageContent,
  FaqPageContent,
  GovernancePageContent,
  HomePageContent,
  InsightsPageContent,
  LegalPageContent,
  MethodologyPageContent,
  PositioningPageContent,
  PrivacyPageContent,
  SolutionsPageContent,
  WhyNowPageContent,
} from "@/lib/i18n/content/pages";

export type ShellNavLabels = {
  main: Record<
    Extract<
      PageKey,
      | "challenge"
      | "positioning"
      | "solutions"
      | "methodology"
      | "governance"
      | "ecosystem"
      | "evidence"
      | "contact"
    >,
    string
  >;
  secondary: Record<
    Extract<PageKey, "whyNow" | "about" | "faq" | "insights">,
    string
  >;
  legal: Record<Extract<PageKey, "legal" | "privacy">, string>;
  /** Authenticated access — never called "Platform" (D1). */
  access: {
    signIn: string;
    portal: string;
  };
};

export type ShellCta = {
  label: string;
  shortLabel: string;
  href: string;
};

export type ShellContent = {
  skipToContent: string;
  signIn: string;
  languageSwitcherLabel: string;
  languageUnavailable: string;
  allRightsReserved: string;
  footerNavigation: string;
  footerEcosystem: string;
  /** Footer column for Sign-in / Portal (D1: Access, not Platform). */
  footerAccess: string;
  footerSecondary: string;
  footerContact: string;
  primaryNavigationLabel: string;
  mobileNavigationLabel: string;
  secondaryNavigationLabel: string;
  openMenu: string;
  closeMenu: string;
  operationalBadge: string;
  description: string;
  legalDisclaimer: string;
  cta: ShellCta;
  nav: ShellNavLabels;
};

export type LocaleContent = {
  shell: ShellContent;
  pages: {
    home: HomePageContent;
    challenge: ChallengePageContent;
    whyNow: WhyNowPageContent;
    positioning: PositioningPageContent;
    solutions: SolutionsPageContent;
    methodology: MethodologyPageContent;
    governance: GovernancePageContent;
    ecosystem: EcosystemPageContent;
    evidence: EvidencePageContent;
    contact: ContactPageContent;
    faq: FaqPageContent;
    insights: InsightsPageContent;
    legal: LegalPageContent;
    privacy: PrivacyPageContent;
  };
};
