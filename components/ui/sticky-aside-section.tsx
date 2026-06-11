import { type ReactNode } from "react";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import type { ComponentPropsWithoutRef } from "react";

type StickyAsideSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  tone?: ComponentPropsWithoutRef<typeof Section>["tone"];
  spacing?: ComponentPropsWithoutRef<typeof Section>["spacing"];
  bordered?: ComponentPropsWithoutRef<typeof Section>["bordered"];
};

export function StickyAsideSection({
  eyebrow,
  title,
  description,
  children,
  tone = "default",
  spacing = "md",
  bordered = "bottom",
}: StickyAsideSectionProps) {
  return (
    <Section tone={tone} spacing={spacing} bordered={bordered}>
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            description={description}
            className="max-w-none lg:sticky lg:top-28"
          />
          {children}
        </div>
      </Container>
    </Section>
  );
}
