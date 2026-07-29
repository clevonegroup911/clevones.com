import { createPageMetadata } from "@/lib/metadata";

import { FaqPageContent } from "@/components/sections/faq-page";

export const metadata = createPageMetadata({
  title: "FAQ",
  description:
    "Frequently asked institutional questions about Clevones: governance role, corporate purpose, ecosystem, Clevone Mining separation, and how structured collaboration begins.",
  path: "/faq",
});

export default function FaqPage() {
  return <FaqPageContent />;
}
