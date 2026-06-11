/**
 * Shared shell/UI copy loaded by locale.
 * Page-level institutional copy remains in `lib/*-page.ts` until migrated.
 */
export type ShellContent = {
  skipToContent: string;
  signIn: string;
  languageSwitcherLabel: string;
  allRightsReserved: string;
  footerNavigation: string;
  footerEcosystem: string;
  footerPlatform: string;
  footerContact: string;
};

export type LocaleContent = {
  shell: ShellContent;
};
