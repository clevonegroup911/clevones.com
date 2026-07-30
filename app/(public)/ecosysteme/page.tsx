import { EcosystemPageContent } from "@/components/sections/ecosystem-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  ...getContent("fr").pages.ecosystem.meta,
  path: "/ecosysteme",
  locale: "fr",
  pageKey: "ecosystem",
  hrefLang: true,
});

export default function EcosystemePage() {
  return <EcosystemPageContent />;
}
