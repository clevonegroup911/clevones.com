import { createPageMetadata } from "@/lib/metadata";

import { PositionnementSection } from "@/components/sections/positionnement";

export const metadata = createPageMetadata({
  title: "Positionnement",
  description:
    "Clevones est architecte des flux, structureur territorial, plateforme de coordination et intégrateur d'écosystèmes — ni opérateur, ni négociant, ni prestataire de services génériques. L'objet social élargit les champs d'intervention sans remplacer cette vision.",
  path: "/positionnement",
  locale: "fr",
  pageKey: "positioning",
  hrefLang: true,
});

export default function PositionnementPage() {
  return <PositionnementSection />;
}
