import { type ReactNode } from "react";

import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { CtaButtonGroup } from "@/components/ui/cta-button-group";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { buttonFullMobile, pageCtaGradient } from "@/lib/ui-classes";

type PageCtaAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  className?: string;
};

type PageCtaSectionProps = {
  title: string;
  description?: string;
  actions: PageCtaAction[];
  children?: ReactNode;
};

export function PageCtaSection({
  title,
  description,
  actions,
  children,
}: PageCtaSectionProps) {
  const useButtonGroup = actions.length > 1;

  return (
    <Section
      tone="navy"
      spacing="md"
      bordered="top"
      className="relative overflow-hidden"
    >
      <div className={pageCtaGradient} aria-hidden />
      <Container className="relative">
        <div className="mx-auto max-w-3xl min-w-0 text-center">
          <Divider variant="gold" accent className="mx-auto" />
          <Heading level={2} tone="inverse" align="center" className="mt-8">
            {title}
          </Heading>
          {description ? (
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-muted">
              {description}
            </p>
          ) : null}
          {children}
          {useButtonGroup ? (
            <CtaButtonGroup align="center" className="mx-auto mt-8 sm:mt-10">
              {actions.map((action) => (
                <ButtonLink
                  key={action.href + action.label}
                  href={action.href}
                  variant={action.variant ?? "secondary"}
                  size="lg"
                  className={action.className ?? buttonFullMobile}
                >
                  {action.label}
                </ButtonLink>
              ))}
            </CtaButtonGroup>
          ) : (
            <div className="mt-8 flex justify-center sm:mt-10">
              <ButtonLink
                href={actions[0].href}
                variant={actions[0].variant ?? "secondary"}
                size="lg"
                className={actions[0].className ?? buttonFullMobile}
              >
                {actions[0].label}
              </ButtonLink>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}
