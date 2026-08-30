import { createPageMetadata } from "@/lib/metadata";

import { FaqPageContent } from "@/components/sections/faq-page";

export const metadata = createPageMetadata({
  title: "FAQ",
  description:
    "Frequently asked institutional questions about Clevones: corporate role, corporate purpose, ecosystem, and how structured collaboration begins.",
  path: "/faq",
});

export default function FaqPage() {
  return <FaqPageContent />;
}
