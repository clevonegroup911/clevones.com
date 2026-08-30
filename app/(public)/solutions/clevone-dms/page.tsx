import { createPageMetadata } from "@/lib/metadata";
import { getContent } from "@/lib/i18n";

import { ClevoneDmsPageContent } from "@/components/sections/clevone-dms-page";

const page = getContent("en").pages.clevoneDms;

export const metadata = createPageMetadata({
  title: page.meta.title,
  description: page.meta.description,
  path: "/solutions/clevone-dms",
  locale: "en",
  pageKey: "clevoneDms",
  hrefLang: true,
});

export default function ClevoneDmsPage() {
  return <ClevoneDmsPageContent />;
}
