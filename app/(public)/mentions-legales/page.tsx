import { createPageMetadata } from "@/lib/metadata";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { proseLink, proseStack } from "@/lib/ui-classes";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Mentions légales",
  description:
    "Mentions légales du site institutionnel Clevones : éditeur, plateforme de gouvernance des flux économiques territoriaux, et coordonnées de contact.",
  path: "/mentions-legales",
  locale: "fr",
  robots: { index: false, follow: true },
});

export default function MentionsLegalesPage() {
  return (
    <Section spacing="md">
      <Container size="prose">
        <SectionHeading eyebrow="Légal" title="Mentions légales" />
        <div className={`${proseStack} text-sm`}>
          <p>
            Le site {siteConfig.url} est édité par {siteConfig.name},{" "}
            plateforme de gouvernance des flux économiques territoriaux.
          </p>
          <p>
            Pour toute question relative à ce site, veuillez nous contacter à
            l&apos;adresse{" "}
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className={proseLink}
            >
              {siteConfig.contact.email}
            </a>
            .
          </p>
        </div>
      </Container>
    </Section>
  );
}
