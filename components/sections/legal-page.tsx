import { company } from "@/lib/constants/company";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { getContent, getLocaleFromHeaders } from "@/lib/i18n";
import { proseLink, proseStack } from "@/lib/ui-classes";
import { headers } from "next/headers";

export async function LegalPage() {
  const locale = getLocaleFromHeaders(await headers());
  const page = getContent(locale).pages.legal;

  return (
    <Section spacing="md">
      <Container size="prose">
        <SectionHeading eyebrow={page.eyebrow} title={page.title} />
        <div className={`${proseStack} text-sm`}>
          {page.introduction.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <h2 className="font-heading text-base font-semibold text-foreground">
            {page.identity.title}
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            {page.identity.facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-xs font-semibold tracking-[0.12em] text-gold-muted uppercase">
                  {fact.label}
                </dt>
                <dd className="mt-1 text-foreground">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <p>
            <span className="font-medium text-foreground">
              {page.identity.addressLabel}.{" "}
            </span>
            {page.identity.addressLines.join(", ")}
          </p>
          <h2 className="font-heading text-base font-semibold text-foreground">
            {page.corporatePurpose.title}
          </h2>
          <p>{page.corporatePurpose.intro}</p>
          <ul className="list-disc space-y-2 pl-5">
            {page.corporatePurpose.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{page.corporatePurpose.closing}</p>
          <h2 className="font-heading text-base font-semibold text-foreground">
            {page.contact.title}
          </h2>
          <p>{page.contact.text}</p>
          <p>
            {company.legalName}
            <br />
            {page.contact.location}
          </p>
          <p>
            {page.contact.phoneLabel}:{" "}
            <a href={company.phone.href} className={proseLink}>
              {page.contact.phone}
            </a>
          </p>
          <p>
            Email:{" "}
            <a href={company.email.href} className={proseLink}>
              {page.contact.email}
            </a>
          </p>
        </div>
      </Container>
    </Section>
  );
}
