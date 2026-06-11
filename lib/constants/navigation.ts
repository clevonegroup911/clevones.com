import type { NavItem } from "@/types";

export const mainNavigation: readonly NavItem[] = [
  { label: "Positioning", href: "/positioning" },
  { label: "Methodology", href: "/methodology" },
  { label: "Ecosystem", href: "/ecosystem" },
  { label: "Insights", href: "/insights" },
  { label: "Governance", href: "/governance" },
  { label: "Contact", href: "/contact" },
] as const;

export const legalNavigation: readonly NavItem[] = [
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
