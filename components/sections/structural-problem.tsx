import { StickyAsideSection } from "@/components/ui/sticky-aside-section";

const failureFactors = [
  "Fragmented actors operating without shared governance frameworks",
  "Weak documentation undermining institutional credibility and traceability",
  "Informal coordination producing fragile, non-repeatable outcomes",
  "Late compliance exposing initiatives to regulatory and reputational risk",
  "Absence of reporting discipline preventing strategic accountability",
] as const;

export function StructuralProblemSection() {
  return (
    <StickyAsideSection
      eyebrow="Structural problem"
      title="Territorial potential does not become value without governance."
      description="Across the Democratic Republic of Congo and Africa, territorial economic opportunities consistently fail to convert into durable value — not for lack of potential, but for lack of governance architecture."
      bordered="top"
    >
      <div className="space-y-4">
        {failureFactors.map((factor, index) => (
          <div
            key={factor}
            className="flex gap-5 rounded-sm border border-border-subtle bg-surface px-5 py-5 sm:px-6"
          >
            <span
              className="shrink-0 font-heading text-sm font-semibold text-gold"
              aria-hidden
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="text-sm leading-relaxed text-muted sm:text-base">
              {factor}
            </p>
          </div>
        ))}
      </div>
    </StickyAsideSection>
  );
}
