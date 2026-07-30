import { EvidencePageSection } from "@/components/sections/evidence-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  ...getContent("en").pages.evidence.meta,
  path: "/evidence",
  locale: "en",
  pageKey: "evidence",
  hrefLang: true,
});

export default function EvidencePage() {
  return <EvidencePageSection />;
}
