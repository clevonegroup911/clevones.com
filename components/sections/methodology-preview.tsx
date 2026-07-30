import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { SectionHeaderRow } from "@/components/ui/section-header-row";
import { TextLink } from "@/components/ui/text-link";
import { getLocaleContent } from "@/lib/i18n/get-locale-content";

export async function MethodologyPreviewSection() {
  const { pages } = await getLocaleContent();
  const methodology = pages.home.methodology;
  return (
    <Section tone="muted" spacing="md">
      <Container>
        <SectionHeaderRow
          eyebrow={methodology.eyebrow}
          title={methodology.title}
          description={methodology.description}
          action={
            <TextLink href={methodology.href}>{methodology.linkLabel}</TextLink>
          }
        />
        <ol className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:mt-14 lg:grid-cols-5 lg:gap-5">
          {methodology.steps.map((step, index) => (
            <li key={step.number} className="relative">
              {index < methodology.steps.length - 1 ? (
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
