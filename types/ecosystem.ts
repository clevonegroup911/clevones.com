/** Public ecosystem link shown in site navigation and footer. */
export type EcosystemLink = {
  name: string;
  href: string;
  /** When true, href is an in-site route (no new tab). */
  internal?: boolean;
};
