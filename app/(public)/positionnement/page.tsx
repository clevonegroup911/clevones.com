import { createPageMetadata } from "@/lib/metadata";

import { PositionnementSection } from "@/components/sections/positionnement";

export const metadata = createPageMetadata({
  title: "Positionnement",
  description:
    "Clevones est architecte des flux, structureur territorial et plateforme de coordination — ni opérateur, ni négociant, ni exploitant de ressources, ni intermédiaire direct.",
  path: "/positionnement",
  locale: "fr",
  pageKey: "positioning",
  hrefLang: true,
});

export default function PositionnementPage() {
  return <PositionnementSection />;
}
