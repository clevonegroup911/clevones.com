import { createPageMetadata } from "@/lib/metadata";

import { PositioningPageContent } from "@/components/sections/positioning-page";

export const metadata = createPageMetadata({
  title: "Positioning",
  description:
    "Clevones is an independent governance architecture platform for territorial economic flows — architect of flows, ecosystem integrator, not an operator, trader, or generic services vendor. Corporate purpose expands domains without replacing this vision.",
  path: "/positioning",
  pageKey: "positioning",
  hrefLang: true,
});

export default function PositioningPage() {
  return <PositioningPageContent />;
}
