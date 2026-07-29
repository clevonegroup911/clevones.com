import { createPageMetadata } from "@/lib/metadata";

import { MissionPageContent } from "@/components/sections/mission-page";

export const metadata = createPageMetadata({
  title: "Mission",
  description:
    "Vision et mission de Clevones : concevoir, structurer et coordonner des architectures de flux économiques territoriaux — champs d'intervention et objet social au service de cette architecture, en RDC et en Afrique.",
  path: "/mission",
  locale: "fr",
  pageKey: "about",
  hrefLang: true,
});

export default function MissionPage() {
  return <MissionPageContent />;
}
