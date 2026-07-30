import { PageCtaSection } from "@/components/ui/page-cta-section";
import { getLocaleContent } from "@/lib/i18n/get-locale-content";

export async function FinalCtaSection() {
  const { pages } = await getLocaleContent();
  const finalCta = pages.home.finalCta;
  return (
    <PageCtaSection
      title={finalCta.title}
      actions={[
        {
          href: finalCta.collaboration.href,
          label: finalCta.collaboration.label,
        },
        {
          href: finalCta.initiative.href,
          label: finalCta.initiative.label,
          variant: "outline",
          className: "border-border text-white hover:bg-navy-hover w-full sm:w-auto",
        },
      ]}
    />
  );
}
