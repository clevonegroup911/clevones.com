import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { homePositioning } from "@/lib/home";

export function PositioningSection() {
  return (
    <Section tone="elevated" spacing="md">
      <Container>
        <SectionHeading
          eyebrow="Positioning"
          title="What Clevones is — and is not"
          description="Clevones exercises a role of architecture, structuring, and coordination for territorial economic flows — as platform of coordination and ecosystem integrator. The governance platform never intervenes as a direct operator."
        />
        <div className="mt-10 grid gap-5 sm:mt-12 sm:gap-6 lg:mt-14 lg:grid-cols-2 lg:gap-8">
          <Card variant="default" padding="md">
            <Badge variant="gold" className="mb-6">
              Clevones is
            </Badge>
            <ul className="space-y-4">
              {homePositioning.is.map((item) => (
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
            <Badge variant="outline" className="mb-6 border-border-subtle text-gray-muted">
              Clevones is not
            </Badge>
            <ul className="space-y-4">
              {homePositioning.isNot.map((item) => (
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
      </Container>
    </Section>
  );
}
