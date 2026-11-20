import { createPageMetadata } from "@/lib/metadata";

import { FaqPageContent } from "@/components/sections/faq-page";

export const metadata = createPageMetadata({
  title: "FAQ",
  description:
    "Answers about CLEVONE SARL: activities, products, corporate purpose, coordination missions and how to get in touch.",
  path: "/faq",
});

export default function FaqPage() {
  return <FaqPageContent />;
}
