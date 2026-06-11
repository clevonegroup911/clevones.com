import { createPageMetadata } from "@/lib/metadata";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata = createPageMetadata({
  title: "Mission",
  description:
    "La mission de Clevones : structurer et coordonner les flux économiques territoriaux en République Démocratique du Congo et en Afrique.",
  path: "/mission",
  locale: "fr",
});

export default function MissionPage() {
  return (
    <Section tone="elevated" spacing="md" bordered="bottom">
        <Container size="prose">
          <SectionHeading
            eyebrow="Mission"
            title="Structurer les dynamiques économiques territoriales"
          />
          <div className="mt-10 space-y-6 text-base leading-relaxed text-muted">
            <p>
              Clevones est une plateforme indépendante de gouvernance des flux
              économiques territoriaux. Elle intervient en République
              Démocratique du Congo et, plus largement, sur le continent
              africain.
            </p>
            <p>
              Notre mission consiste à architecturer, structurer et coordonner
              les dynamiques économiques à l&apos;échelle territoriale — sans
              jamais exercer d&apos;activité opérationnelle directe.
            </p>
            <p>
              Clevones agit comme entité neutre et conforme, au service de la
              transparence et de la durabilité des écosystèmes économiques
              territoriaux — sans exercer d&apos;activité opérationnelle,
              commerciale ou d&apos;intermédiation directe.
            </p>
            <p>
              Clevone Mining constitue une unité opérationnelle distincte,
              structurellement séparée de la plateforme de gouvernance Clevones.
            </p>
          </div>
        </Container>
    </Section>
  );
}
