import { createPageMetadata } from "@/lib/metadata";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { proseLink, proseStack } from "@/lib/ui-classes";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité de Clevones : traitement, protection et droits relatifs aux données personnelles collectées via le site institutionnel.",
  path: "/confidentialite",
  locale: "fr",
  robots: { index: false, follow: true },
});

export default function ConfidentialitePage() {
  return (
    <Section spacing="md">
      <Container size="prose">
        <SectionHeading eyebrow="Légal" title="Politique de confidentialité" />
        <div className={`${proseStack} text-sm`}>
          <p>
            {siteConfig.name} s&apos;engage à protéger la confidentialité des
            données personnelles collectées via ce site institutionnel.
          </p>
          <p>
            Les données transmises par courriel ou via les formulaires de
            contact sont utilisées exclusivement pour répondre aux demandes
            institutionnelles reçues. Elles ne sont ni vendues, ni cédées à
            des tiers à des fins commerciales.
          </p>
          <p>
            Conformément à la réglementation applicable, vous disposez d&apos;un
            droit d&apos;accès, de rectification et de suppression de vos
            données. Pour exercer ces droits, contactez{" "}
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
