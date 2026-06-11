import { createPageMetadata } from "@/lib/metadata";

import { PositioningPageContent } from "@/components/sections/positioning-page";

export const metadata = createPageMetadata({
  title: "Positioning",
  description:
    "Clevones is an independent governance architecture platform for territorial economic flows — not an operator, trader, resource exploiter, or direct intermediary.",
  path: "/positioning",
  pageKey: "positioning",
  hrefLang: true,
});

export default function PositioningPage() {
  return <PositioningPageContent />;
}
