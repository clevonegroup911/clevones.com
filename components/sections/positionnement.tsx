import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { ProseSection } from "@/components/ui/prose-section";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
import { clevoneMiningSeparationDisclaimerFr } from "@/lib/constants/brand-positioning";
import {
  positionnementCorporatePurpose,
  positionnementIs,
  positionnementIsNot,
} from "@/lib/positionnement-page";

export function PositionnementSection() {
  return (
    <>
      <Section tone="elevated" spacing="md">
        <Container>
          <SectionHeading
            eyebrow="Positionnement"
            title="Ce qu'est Clevones — et ce qu'il n'est pas"
            description="Clevones exerce un rôle d'architecture, de structuration et de coordination des flux économiques territoriaux. La plateforme n'intervient jamais en tant qu'opérateur direct."
          />
          <div className="mt-10 grid gap-5 sm:mt-12 sm:gap-6 lg:mt-14 lg:grid-cols-2 lg:gap-8">
            <Card variant="default" padding="md">
              <Badge variant="gold" className="mb-6">
                Clevones est
              </Badge>
              <ul className="space-y-4">
                {positionnementIs.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-4 border-l-2 border-gold pl-5"
                  >
                    <span className="font-heading text-base font-semibold text-foreground sm:text-lg">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card variant="muted" padding="md">
              <Badge
                variant="outline"
                className="mb-6 border-border-subtle text-gray-muted"
              >
                Clevones n&apos;est pas
              </Badge>
              <ul className="space-y-4">
                {positionnementIsNot.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-4 border-l-2 border-border-subtle pl-5"
                  >
                    <span className="font-heading text-base font-semibold text-gray-muted sm:text-lg">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          <div className="mt-10 rounded-sm border border-border-subtle/60 bg-surface-muted px-5 py-5 sm:px-6">
            <p className="text-sm leading-relaxed text-muted">
              {clevoneMiningSeparationDisclaimerFr}
            </p>
          </div>
        </Container>
      </Section>

      <ProseSection
        eyebrow={positionnementCorporatePurpose.eyebrow}
        title={positionnementCorporatePurpose.title}
        paragraphs={positionnementCorporatePurpose.paragraphs}
        tone="default"
        bordered="bottom"
      />

      <Section tone="elevated" spacing="sm" bordered="bottom">
        <Container size="prose">
          <p className="text-sm leading-relaxed text-muted">
            Vision, mission et champs d&apos;intervention détaillés :{" "}
            <TextLink href="/mission">page Mission</TextLink>. Texte intégral
            de l&apos;objet social :{" "}
            <TextLink href="/mentions-legales">mentions légales</TextLink>.
          </p>
        </Container>
      </Section>
    </>
  );
}
