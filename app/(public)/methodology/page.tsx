import { createPageMetadata } from "@/lib/metadata";

import { MethodologyPageContent } from "@/components/sections/methodology-page";

export const metadata = createPageMetadata({
  title: "Methodology",
  description:
    "The Clevones five-step governance framework: territorial reading, flow mapping, governance structuring, collaboration protocols, and strategic reporting.",
  path: "/methodology",
});

export default function MethodologyPage() {
  return <MethodologyPageContent />;
}
