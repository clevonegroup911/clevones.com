import type { LocaleContent } from "@/lib/i18n/content/types";

export const frContent = {
  shell: {
    skipToContent: "Aller au contenu principal",
    signIn: "Connexion",
    languageSwitcherLabel: "Langue",
    allRightsReserved: "Tous droits réservés.",
    footerNavigation: "Navigation",
    footerEcosystem: "Écosystème",
    footerPlatform: "Plateforme",
    footerContact: "Contact",
  },
} as const satisfies LocaleContent;
