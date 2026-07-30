import { PositioningPageContent } from "@/components/sections/positioning-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  ...getContent("fr").pages.positioning.meta,
  path: "/positionnement",
  locale: "fr",
  pageKey: "positioning",
  hrefLang: true,
});

export default function PositionnementPage() {
  return <PositioningPageContent />;
}
