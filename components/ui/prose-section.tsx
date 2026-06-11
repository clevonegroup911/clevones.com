import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { proseStack } from "@/lib/ui-classes";
import type { ComponentPropsWithoutRef } from "react";

type ProseSectionProps = {
  eyebrow?: string;
  title: string;
  paragraphs: readonly string[];
  tone?: ComponentPropsWithoutRef<typeof Section>["tone"];
  spacing?: ComponentPropsWithoutRef<typeof Section>["spacing"];
  bordered?: ComponentPropsWithoutRef<typeof Section>["bordered"];
};

export function ProseSection({
  eyebrow,
  title,
  paragraphs,
  tone = "elevated",
  spacing = "md",
  bordered = "bottom",
}: ProseSectionProps) {
  return (
    <Section tone={tone} spacing={spacing} bordered={bordered}>
      <Container size="prose">
        <SectionHeading eyebrow={eyebrow} title={title} />
        <div className={proseStack}>
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </Container>
    </Section>
  );
}
