import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { ExternalLink } from "@/components/ui/external-link";
import { PageCtaSection } from "@/components/ui/page-cta-section";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { cardAccentLine } from "@/lib/ui-classes";
import { homeCta } from "@/lib/home";
import {
  ecosystemPageDisclaimer,
  ecosystemPageHero,
  ecosystemPageMap,
  getEcosystemEntityGroups,
} from "@/lib/ecosystem-page";

import { EcosystemMap } from "./ecosystem-map";

const { central: centralEntity, neutral: neutralEntities, operational: operationalEntity } =
  getEcosystemEntityGroups();

export function EcosystemPageContent() {
  return (
    <>
      <PageHero
        eyebrow={ecosystemPageHero.eyebrow}
        title={ecosystemPageHero.title}
        subtitle={ecosystemPageHero.subtitle}
        tagline="Neutral governance. Specialized platforms. Clear separation."
      />

      <Section tone="elevated" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow={ecosystemPageMap.eyebrow}
            title={ecosystemPageMap.title}
            description={ecosystemPageMap.description}
          />
          <EcosystemMap
            central={centralEntity}
            neutral={neutralEntities}
            operational={operationalEntity}
          />
        </Container>
      </Section>

      <Section tone="default" spacing="md" bordered="bottom">
        <Container>
          <SectionHeading
            eyebrow="Platforms"
            title="Each entity, a defined mandate"
            description="Specialized platforms serve distinct institutional functions — coordinated through governance, never substituting it."
          />
          <div className="mt-10 space-y-10 sm:mt-12 lg:mt-14">
            <Card
              variant="elevated"
              padding="md"
              className="mx-auto max-w-2xl border-gold/20 bg-surface-elevated"
            >
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className={cardAccentLine} aria-hidden />
                <CardTitle className="text-lg">{centralEntity.name}</CardTitle>
                <Badge
                  variant="outline"
                  className="border-gold/30 text-gold-muted"
                >
                  Governance platform
                </Badge>
              </div>
              <p className="text-xs font-medium tracking-wide text-gold-muted">
                {centralEntity.role}
              </p>
              <CardDescription className="mt-3">
                {centralEntity.description}
              </CardDescription>
              <ExternalLink href={centralEntity.href} className="mt-5">
                {centralEntity.domain}
              </ExternalLink>
            </Card>

            <div className="grid gap-5 sm:grid-cols-2">
              {neutralEntities.map((entity) => (
                <Card
                  key={entity.name}
                  variant="default"
                  padding="md"
                  className="transition-colors hover:border-border-subtle"
                >
                  <CardTitle className="text-lg">{entity.name}</CardTitle>
                  <p className="mt-2 text-xs font-medium tracking-wide text-gold-muted">
                    {entity.role}
                  </p>
                  <CardDescription className="mt-3">
                    {entity.description}
                  </CardDescription>
                  <ExternalLink href={entity.href} className="mt-5">
                    {entity.domain}
                  </ExternalLink>
                </Card>
              ))}
            </div>

            <Card
              variant="outlined"
              padding="md"
              className="mx-auto max-w-2xl border-gold/20 bg-gold-subtle/30"
            >
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{operationalEntity.name}</CardTitle>
                <Badge
                  variant="outline"
                  className="border-gold/30 text-gold-muted"
                >
                  Operational unit
                </Badge>
              </div>
              <p className="text-xs font-medium tracking-wide text-gold-muted">
                {operationalEntity.role}
              </p>
              <CardDescription className="mt-3">
                {operationalEntity.description}
              </CardDescription>
              <ExternalLink href={operationalEntity.href} className="mt-5">
                {operationalEntity.domain}
              </ExternalLink>
            </Card>
          </div>
        </Container>
      </Section>

      <Section tone="muted" spacing="md" bordered="bottom">
        <Container size="prose">
          <div className="rounded-sm border border-gold/20 bg-gold-subtle/20 px-5 py-6 sm:px-8 sm:py-8">
            <p className="text-xs font-semibold tracking-[0.2em] text-gold-muted uppercase">
              Critical distinction
            </p>
            <p className="mt-4 text-base leading-relaxed text-foreground sm:text-lg">
              {ecosystemPageDisclaimer}
            </p>
          </div>
        </Container>
      </Section>

      <PageCtaSection
        title="Engage with the governance layer of the Clevones ecosystem."
        actions={[
          {
            href: homeCta.collaboration.href,
            label: homeCta.collaboration.label,
          },
        ]}
      />
    </>
  );
}
