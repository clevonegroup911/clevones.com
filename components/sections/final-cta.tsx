import { PageCtaSection } from "@/components/ui/page-cta-section";
import { homeCta } from "@/lib/home";

export function FinalCtaSection() {
  return (
    <PageCtaSection
      title="For serious initiatives requiring structure, governance, and institutional discipline."
      actions={[
        {
          href: homeCta.collaboration.href,
          label: homeCta.collaboration.label,
        },
        {
          href: homeCta.initiative.href,
          label: homeCta.initiative.label,
          variant: "outline",
          className: "border-border text-white hover:bg-navy-hover w-full sm:w-auto",
        },
      ]}
    />
  );
}
