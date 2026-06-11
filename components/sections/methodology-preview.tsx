import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { SectionHeaderRow } from "@/components/ui/section-header-row";
import { TextLink } from "@/components/ui/text-link";
import { methodologySteps } from "@/lib/home";

export function MethodologyPreviewSection() {
  return (
    <Section tone="muted" spacing="md">
      <Container>
        <SectionHeaderRow
          eyebrow="Methodology"
          title="A disciplined approach to territorial governance"
          description="Five sequential phases structure every engagement — from territorial reading to strategic reporting."
          action={
            <TextLink href="/methodology">View full methodology →</TextLink>
          }
        />
        <ol className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:mt-14 lg:grid-cols-5 lg:gap-5">
          {methodologySteps.map((step, index) => (
            <li key={step.number} className="relative">
              {index < methodologySteps.length - 1 ? (
                <span
                  className="pointer-events-none absolute top-8 right-0 hidden h-px w-5 translate-x-full bg-border-subtle lg:block"
                  aria-hidden
                />
              ) : null}
              <Card
                variant="elevated"
                padding="md"
                className="h-full transition-colors hover:border-gold/20"
              >
                <p className="font-heading text-2xl font-semibold text-gold">
                  {step.number}
                </p>
                <Heading as="h3" level={4} className="mt-4">
                  {step.title}
                </Heading>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {step.description}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
