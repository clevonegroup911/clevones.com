import { createPageMetadata } from "@/lib/metadata";

import { AboutPageContent } from "@/components/sections/about-page";

export const metadata = createPageMetadata({
  title: "About",
  description:
    "Clevones designs, structures, and coordinates architectures of territorial economic flows — transforming territorial potential into durable economic assets across technology, logistics, industry, energy, media, education, and institutional governance in the DRC and Africa.",
  path: "/about",
  pageKey: "about",
  hrefLang: true,
});

export default function AboutPage() {
  return <AboutPageContent />;
}
