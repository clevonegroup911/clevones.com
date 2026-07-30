import { PositioningPageContent } from "@/components/sections/positioning-page";
import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  ...getContent("en").pages.positioning.meta,
  path: "/positioning",
  locale: "en",
  pageKey: "positioning",
  hrefLang: true,
});

export default function PositioningPage() {
  return <PositioningPageContent />;
}
