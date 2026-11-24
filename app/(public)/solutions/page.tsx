import { getContent } from "@/lib/i18n";
import { createPageMetadata } from "@/lib/metadata";

import { SolutionsPageContent } from "@/components/sections/solutions-page";

export const metadata = createPageMetadata({
  ...getContent("en").pages.solutions.meta,
  path: "/solutions",
});

export default function SolutionsPage() {
  return <SolutionsPageContent />;
}
