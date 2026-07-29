import type { NavItem } from "@/types";

export const mainNavigation: readonly NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Positioning", href: "/positioning" },
  { label: "Solutions", href: "/solutions" },
  { label: "Methodology", href: "/methodology" },
  { label: "Ecosystem", href: "/ecosystem" },
  { label: "Insights", href: "/insights" },
  { label: "Governance", href: "/governance" },
] as const;

export const legalNavigation: readonly NavItem[] = [
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "Legal notice", href: "/mentions-legales" },
  { label: "Privacy", href: "/confidentialite" },
] as const;

export const platformNavigation: readonly NavItem[] = [
  { label: "Sign in", href: "/sign-in" },
  { label: "Client portal", href: "/portal" },
] as const;

export const navigation = {
  main: mainNavigation,
  legal: legalNavigation,
  platform: platformNavigation,
} as const;
