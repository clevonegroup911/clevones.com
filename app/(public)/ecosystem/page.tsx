import { createPageMetadata } from "@/lib/metadata";

import { EcosystemPageContent } from "@/components/sections/ecosystem-page";

export const metadata = createPageMetadata({
  title: "Ecosystem",
  description:
    "The Clevones ecosystem brings together specialized platforms in governance, economic intelligence, secure infrastructure, scientific knowledge, and territorial development.",
  path: "/ecosystem",
});

export default function EcosystemPage() {
  return <EcosystemPageContent />;
}
