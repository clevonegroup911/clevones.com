import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { proseStack } from "@/lib/ui-classes";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ProseSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  paragraphs: readonly string[];
  tone?: ComponentPropsWithoutRef<typeof Section>["tone"];
  spacing?: ComponentPropsWithoutRef<typeof Section>["spacing"];
  bordered?: ComponentPropsWithoutRef<typeof Section>["bordered"];
  children?: ReactNode;
};

export function ProseSection({
  id,
  eyebrow,
  title,
  paragraphs,
  tone = "elevated",
  spacing = "md",
  bordered = "bottom",
  children,
}: ProseSectionProps) {
  return (
    <Section
      id={id}
      tone={tone}
      spacing={spacing}
      bordered={bordered}
      className={id ? "scroll-mt-24" : undefined}
    >
      <Container size="prose">
        <SectionHeading eyebrow={eyebrow} title={title} />
        <div className={proseStack}>
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        {children}
      </Container>
    </Section>
  );
}
