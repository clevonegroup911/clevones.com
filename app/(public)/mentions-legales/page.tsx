import { createPageMetadata } from "@/lib/metadata";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { capacityVsPlatformClarification, objetSocialLegalFr } from "@/lib/constants/corporate-purpose";
import { proseLink, proseStack } from "@/lib/ui-classes";
import { siteConfig } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Mentions légales",
  description:
    "Mentions légales de Clevones : éditeur du site, objet social officiel, plateforme de gouvernance des flux économiques territoriaux, et coordonnées de contact.",
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
            Le site {siteConfig.url} est édité par {siteConfig.name}, société
            intervenant en République Démocratique du Congo et à
            l&apos;étranger. Clevones conçoit, structure et coordonne des
            architectures de flux économiques territoriaux.
          </p>
          <p>{capacityVsPlatformClarification.fr}</p>

          <h2 className="font-heading text-base font-semibold text-foreground">
            Objet social
          </h2>
          <p>{objetSocialLegalFr.intro}</p>
          <ul className="list-disc space-y-2 pl-5">
            {objetSocialLegalFr.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{objetSocialLegalFr.closing}</p>

          <h2 className="font-heading text-base font-semibold text-foreground">
            Contact
          </h2>
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
