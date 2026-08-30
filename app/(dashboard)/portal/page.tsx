import { createPageMetadata } from "@/lib/metadata";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { CtaButtonGroup } from "@/components/ui/cta-button-group";
import { buttonFullMobile } from "@/lib/ui-classes";

export const metadata = createPageMetadata({
  title: "Client portal",
  description:
    "Secure client portal for Clevones partners — governance dashboards, initiative tracking, and institutional document access.",
  path: "/portal",
  robots: { index: false, follow: false },
});

const upcomingFeatures = [
  "Personalized governance dashboard",
  "Real-time territorial initiative tracking",
  "Secure document and deliverable repository",
  "Dedicated institutional messaging",
] as const;

export default function PortalPage() {
  return (
    <Section spacing="md">
      <Container size="prose" className="text-center">
        <SectionHeading
          eyebrow="Extranet"
          title="Client portal — coming soon"
          description="This area is reserved for a future client portal. No authentication system is live on this website."
          align="center"
        />

        <ul className="mt-10 space-y-3 text-left">
          {upcomingFeatures.map((feature) => (
            <li key={feature}>
              <Card variant="muted" padding="sm" className="flex items-center gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-subtle text-xs text-gold"
                  aria-hidden
                >
                  ·
                </span>
                <span className="text-sm text-soft-white">{feature}</span>
              </Card>
            </li>
          ))}
        </ul>

        <CtaButtonGroup align="center" className="mx-auto mt-8 sm:mt-10">
          <ButtonLink href="/contact" size="lg" className={buttonFullMobile}>
            Request access
          </ButtonLink>
          <ButtonLink href="/" variant="outline" size="lg" className={buttonFullMobile}>
            Back to site
          </ButtonLink>
        </CtaButtonGroup>
      </Container>
    </Section>
  );
}
