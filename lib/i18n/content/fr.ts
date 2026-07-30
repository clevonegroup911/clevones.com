import {
  clevoneMiningSeparationDisclaimerFr,
  clevonesNeutralityDisclaimerFr,
} from "@/lib/constants/brand-positioning";
import {
  challengePageContent,
  contactPageContent,
  ecosystemPageContent,
  evidencePageContent,
  faqPageContent,
  governancePageContent,
  homePageContent,
  insightsPageContent,
  legalPageContent,
  methodologyPageContent,
  positioningPageContent,
  privacyPageContent,
  solutionsPageContent,
  whyNowPageContent,
} from "@/lib/i18n/content/pages";
import type { LocaleContent } from "@/lib/i18n/content/types";

const siteLegalDisclaimerFr =
  `${clevonesNeutralityDisclaimerFr} Son objet social élargit les champs d'intervention territoriale via l'écosystème et les filiales sans redéfinir la plateforme de gouvernance comme opérateur. ${clevoneMiningSeparationDisclaimerFr}` as const;

export const frContent = {
  shell: {
    skipToContent: "Aller au contenu principal",
    signIn: "Connexion",
    languageSwitcherLabel: "Langue",
    languageUnavailable: "Cette page n'est pas encore disponible dans cette langue.",
    allRightsReserved: "Tous droits réservés.",
    footerNavigation: "Navigation",
    footerEcosystem: "Écosystème",
    footerAccess: "Accès",
    footerSecondary: "Plus",
    footerContact: "Contact",
    primaryNavigationLabel: "Navigation principale",
    mobileNavigationLabel: "Navigation mobile",
    secondaryNavigationLabel: "Autres pages",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    operationalBadge: "Opérationnel",
    description:
      "Clevones conçoit, structure et coordonne des architectures de flux économiques territoriaux — une plateforme de gouvernance neutre qui transforme le potentiel territorial en actifs économiques durables, à travers les technologies, la logistique, l'industrie, l'énergie, les médias, l'éducation et la coordination institutionnelle en République Démocratique du Congo et en Afrique.",
    legalDisclaimer: siteLegalDisclaimerFr,
    cta: {
      label: "Commencer une conversation stratégique",
      shortLabel: "Conversation stratégique",
      href: "/collaboration",
    },
    nav: {
      main: {
        challenge: "Défi",
        positioning: "Positionnement",
        solutions: "Solutions",
        methodology: "Méthodologie",
        governance: "Gouvernance",
        ecosystem: "Plateforme",
        evidence: "Preuves",
        contact: "Contact",
      },
      secondary: {
        whyNow: "Pourquoi maintenant",
        about: "À propos",
        faq: "FAQ",
        insights: "Analyses",
      },
      legal: {
        legal: "Mentions légales",
        privacy: "Confidentialité",
      },
      access: {
        signIn: "Connexion",
        portal: "Portail client",
      },
    },
  },
  pages: {
    home: homePageContent.fr,
    challenge: challengePageContent.fr,
    whyNow: whyNowPageContent.fr,
    positioning: positioningPageContent.fr,
    solutions: solutionsPageContent.fr,
    methodology: methodologyPageContent.fr,
    governance: governancePageContent.fr,
    ecosystem: ecosystemPageContent.fr,
    evidence: evidencePageContent.fr,
    contact: contactPageContent.fr,
    faq: faqPageContent.fr,
    insights: insightsPageContent.fr,
    legal: legalPageContent.fr,
    privacy: privacyPageContent.fr,
  },
} as const satisfies LocaleContent;
