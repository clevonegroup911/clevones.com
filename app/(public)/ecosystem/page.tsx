import { EcosystemPageContent } from "@/components/sections/ecosystem-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  ...getContent("en").pages.ecosystem.meta,
  path: "/ecosystem",
  locale: "en",
  pageKey: "ecosystem",
  hrefLang: true,
});

export default function EcosystemPage() {
  return <EcosystemPageContent />;
}
