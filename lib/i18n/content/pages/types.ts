export type PageMeta = {
  title: string;
  description: string;
};

export type LocalizedPageContent<T> = {
  en: T;
  fr: T;
};

export type HeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  tagline?: string;
};

export type SectionHeadingContent = {
  eyebrow: string;
  title: string;
  description?: string;
};

export type CtaAction = {
  href: string;
  label: string;
  variant?: "primary" | "outline" | "secondary";
};

export type CtaContent = {
  title: string;
  description: string;
  actions: readonly CtaAction[];
};

export type TitledDescription = {
  title: string;
  description: string;
};
