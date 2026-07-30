import { EvidencePageSection } from "@/components/sections/evidence-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  ...getContent("fr").pages.evidence.meta,
  path: "/preuves",
  locale: "fr",
  pageKey: "evidence",
  hrefLang: true,
});

export default function PreuvesPage() {
  return <EvidencePageSection />;
}
