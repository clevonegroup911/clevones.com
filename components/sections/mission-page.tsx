import { Container } from "@/components/ui/container";
import { FeatureCard, FeatureCardGrid } from "@/components/ui/feature-card";
import { PageHero } from "@/components/ui/page-hero";
import { ProseSection } from "@/components/ui/prose-section";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
import {
  missionPageDomains,
  missionPageHero,
  missionPageIdentity,
  missionPageMission,
  missionPageObjetSocial,
  missionPageVision,
} from "@/lib/mission-page";
import { proseStack } from "@/lib/ui-classes";

export function MissionPageContent() {
  return (
    <>
      <PageHero
        eyebrow={missionPageHero.eyebrow}
        title={missionPageHero.title}
        subtitle={missionPageHero.subtitle}
        tagline="Neutre. Conforme. Non opérationnelle."
      />

      <ProseSection
        eyebrow={missionPageVision.eyebrow}
        title={missionPageVision.title}
        paragraphs={missionPageVision.paragraphs}
        tone="elevated"
        bordered="bottom"
      />

      <ProseSection
        eyebrow={missionPageMission.eyebrow}
        title={missionPageMission.title}
        paragraphs={missionPageMission.paragraphs}
        tone="default"
        bordered="bottom"
      />

      <ProseSection
        eyebrow={missionPageIdentity.eyebrow}
        title={missionPageIdentity.title}
        paragraphs={missionPageIdentity.paragraphs}
        tone="elevated"
        bordered="bottom"
      />

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={missionPageDomains.eyebrow}
            title={missionPageDomains.title}
            description={missionPageDomains.description}
          />
          <FeatureCardGrid className="mt-10 sm:mt-12">
            {missionPageDomains.domains.map((domain) => (
              <FeatureCard
                key={domain.id}
                title={domain.titleFr}
                description={
                  domain.ecosystemLink
                    ? `${domain.architectureRoleFr} Lien écosystème : ${domain.ecosystemLink}.`
                    : domain.architectureRoleFr
                }
              />
            ))}
          </FeatureCardGrid>
        </Container>
      </Section>

      <Section tone="elevated" spacing="md" bordered="bottom">
        <Container size="prose">
          <SectionHeading
            eyebrow={missionPageObjetSocial.eyebrow}
            title={missionPageObjetSocial.title}
          />
          <div className={`${proseStack} mt-8 text-sm`}>
            <p>{missionPageObjetSocial.intro}</p>
            <ul className="list-disc space-y-2 pl-5 text-muted">
              {missionPageObjetSocial.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>{missionPageObjetSocial.closing}</p>
            <p>
              {missionPageObjetSocial.note}{" "}
              <TextLink href="/mentions-legales">Mentions légales</TextLink>.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
