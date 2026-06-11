import { createPageMetadata } from "@/lib/metadata";
import { resolveContactIntent } from "@/lib/contact-page";

import { ContactPageContent } from "@/components/sections/contact-page";

export const metadata = createPageMetadata({
  title: "Contact",
  description:
    "Initiate a strategic collaboration with Clevones. Submit a structured, documented, and compliant initiative for institutional review.",
  path: "/contact",
});

type ContactPageProps = {
  searchParams: Promise<{ intent?: string }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { intent: intentParam } = await searchParams;

  return (
    <ContactPageContent intent={resolveContactIntent(intentParam)} />
  );
}
