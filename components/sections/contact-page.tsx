import Link from "next/link";

import { ContactInitiativeForm } from "@/components/sections/contact-initiative-form";
import { ContactProductForm } from "@/components/sections/contact-product-form";
import { CompanyContact } from "@/components/layout/company-contact";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { Section } from "@/components/ui/section";
import { getContent, getLocaleFromHeaders } from "@/lib/i18n";
import { type ContactIntent } from "@/lib/i18n/content/pages";
import { cn } from "@/lib/utils";
import { headers } from "next/headers";

const intentOrder: readonly ContactIntent[] = [
  "product",
  "collaboration",
  "initiative",
  "eligibility",
];

type ContactPageContentProps = {
  intent?: ContactIntent;
};

export async function ContactPageContent({
  intent,
}: ContactPageContentProps) {
  const locale = getLocaleFromHeaders(await headers());
  const { shell, pages } = getContent(locale);
  const page = pages.contact;
  // No intent: two-audience header; the form defaults to the governance path.
  const content = intent ? page.intents[intent] : page.hero;
  const activeIntent: ContactIntent = intent ?? "collaboration";
  const isProduct = activeIntent === "product";
  const guidance = isProduct ? page.productGuidance : page.guidance;

  return (
    <>
      <PageHero
        eyebrow={content.eyebrow}
        title={content.title}
        subtitle={content.subtitle}
        tagline={page.hero.tagline}
      />

      <Section tone="elevated" spacing="sm" bordered="bottom">
        <Container size="prose">
          <div className="rounded-sm border border-border-subtle/60 bg-surface-muted px-5 py-6 sm:px-7 sm:py-7">
            <p className="text-xs font-semibold tracking-[0.15em] text-gold-muted uppercase">
              {page.directory.title}
            </p>
            <CompanyContact
              location={page.directory.location}
              phoneLabel={page.directory.phoneLabel}
              emailLabel={page.directory.emailLabel}
              addressLines={shell.addressLines}
              showRegistration
              className="mt-4"
            />
          </div>
        </Container>
      </Section>

      <Section tone="elevated" spacing="sm" bordered="bottom">
        <Container size="prose">
          <div className="rounded-sm border border-border-subtle/60 bg-surface-muted px-5 py-6 sm:px-7 sm:py-7">
            <p className="text-xs font-semibold tracking-[0.15em] text-gold-muted uppercase">
              {guidance.title}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {guidance.description}
            </p>
            <ol className="mt-5 space-y-3">
              {guidance.steps.map((step, index) => (
                <li
                  key={step}
                  className="flex gap-4 text-sm leading-relaxed text-soft-white"
                >
                  <span
                    className="shrink-0 font-heading text-sm font-semibold text-gold"
                    aria-hidden
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <Section tone="default" spacing="md">
        <Container>
          <nav aria-label={page.intentSelector.label}>
            <p className="text-xs font-semibold tracking-[0.15em] text-gold-muted uppercase">
              {page.intentSelector.label}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {intentOrder.map((key) => {
                const item = page.intents[key];
                const active = key === activeIntent;
                return (
                  <li key={key}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-sm border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40",
                        active
                          ? "border-navy bg-navy text-white"
                          : "border-border-subtle bg-surface text-foreground hover:border-navy/40",
                      )}
                    >
                      {item.navLabel}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          {isProduct ? (
            <ContactProductForm />
          ) : (
            <ContactInitiativeForm intent={activeIntent as Exclude<ContactIntent, "product">} />
          )}
        </Container>
      </Section>
    </>
  );
}
