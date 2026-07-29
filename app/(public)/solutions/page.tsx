import { createPageMetadata } from "@/lib/metadata";

import { SolutionsPageContent } from "@/components/sections/solutions-page";

export const metadata = createPageMetadata({
  title: "Solutions",
  description:
    "Clevones' domains of intervention: technology, logistics, industry, energy, media, education, strategic advisory, events, and lawful commerce — structured as territorial architectures, not generic services.",
  path: "/solutions",
});

export default function SolutionsPage() {
  return <SolutionsPageContent />;
}
