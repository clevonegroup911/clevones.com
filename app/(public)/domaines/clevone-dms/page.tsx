import { ClevoneDmsPageContent } from "@/components/sections/clevone-dms-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";

const page = getContent("fr").pages.clevoneDms;

export const metadata = createPageMetadata({
  title: page.meta.title,
  description: page.meta.description,
  path: "/domaines/clevone-dms",
  locale: "fr",
  pageKey: "clevoneDms",
  hrefLang: true,
});

export default function ClevoneDmsFrPage() {
  return <ClevoneDmsPageContent />;
}
