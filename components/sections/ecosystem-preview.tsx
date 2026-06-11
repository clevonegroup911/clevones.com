import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { ExternalLink } from "@/components/ui/external-link";
import { Section } from "@/components/ui/section";
import { SectionHeaderRow } from "@/components/ui/section-header-row";
import { TextLink } from "@/components/ui/text-link";
import { clevoneMiningSeparationDisclaimer } from "@/lib/constants/brand-positioning";
import { cardGrid3 } from "@/lib/ui-classes";
import { ecosystemEntities } from "@/lib/home";

export function EcosystemPreviewSection() {
  return (
    <Section tone="elevated" spacing="md">
      <Container>
        <SectionHeaderRow
          eyebrow="Ecosystem"
          title="A structured institutional ecosystem"
          description="Clevones sits within a broader architecture of complementary entities — each with a defined role, none substituting the neutral governance function."
          action={
            <TextLink href="/ecosystem">Explore ecosystem →</TextLink>
          }
        />
        <div className={cardGrid3}>
          {ecosystemEntities.map((entity) => (
            <Card
              key={entity.name}
              variant={entity.operational ? "outlined" : "default"}
              padding="md"
              className={
                entity.operational
                  ? "border-gold/20 bg-gold-subtle/30"
                  : "transition-colors hover:border-border-subtle"
              }
            >
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{entity.name}</CardTitle>
                {entity.operational ? (
                  <Badge
                    variant="outline"
                    className="border-gold/30 text-gold-muted"
                  >
                    Operational unit
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs font-medium tracking-wide text-gold-muted">
                {entity.role}
              </p>
              <CardDescription className="mt-3">{entity.description}</CardDescription>
              <ExternalLink href={entity.href} className="mt-5">
                {entity.href.replace(/^https?:\/\//, "")}
              </ExternalLink>
            </Card>
          ))}
        </div>
        <div className="mt-10 rounded-sm border border-border-subtle/60 bg-surface-muted px-5 py-5 sm:px-6">
          <p className="text-sm leading-relaxed text-muted">
            {clevoneMiningSeparationDisclaimer}
          </p>
        </div>
      </Container>
    </Section>
  );
}
