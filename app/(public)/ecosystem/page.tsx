import { createPageMetadata } from "@/lib/metadata";

import { EcosystemPageContent } from "@/components/sections/ecosystem-page";

export const metadata = createPageMetadata({
  title: "Ecosystem",
  description:
    "The Clevones ecosystem extends corporate fields of intervention — Clevodia, Clevonet, Bicuni, Btlearn Inc., and operationally separated Clevone Mining — with Clevones as the neutral coordination hub.",
  path: "/ecosystem",
});

export default function EcosystemPage() {
  return <EcosystemPageContent />;
}
