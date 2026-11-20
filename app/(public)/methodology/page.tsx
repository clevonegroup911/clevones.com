import { createPageMetadata } from "@/lib/metadata";

import { MethodologyPageContent } from "@/components/sections/methodology-page";

export const metadata = createPageMetadata({
  title: "Methodology",
  description:
    "The CLEVONE five-step framework for coordination missions: territorial reading, flow mapping, governance structuring, collaboration protocols, and strategic reporting.",
  path: "/methodology",
});

export default function MethodologyPage() {
  return <MethodologyPageContent />;
}
