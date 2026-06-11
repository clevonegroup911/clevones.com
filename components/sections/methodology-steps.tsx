"use client";

import { useState } from "react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cardAccentLine } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import type { MethodologyStep } from "@/lib/methodology-page";

type MethodologyStepsProps = {
  steps: readonly MethodologyStep[];
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn(
        "h-5 w-5 shrink-0 text-gold-muted transition-transform duration-200",
        open && "rotate-180",
      )}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function StepHighlights({ highlights }: { highlights: readonly string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {highlights.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
          <span
            className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold/70"
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function StepBody({ step }: { step: MethodologyStep }) {
  return (
    <>
      <p className="text-sm leading-relaxed text-muted sm:text-base">
        {step.summary}
      </p>
      <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
        {step.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <StepHighlights highlights={step.highlights} />
    </>
  );
}

function MobileAccordion({ steps }: MethodologyStepsProps) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-3 lg:hidden">
      {steps.map((step, index) => {
        const isOpen = openIndex === index;
        return (
          <Card
            key={step.number}
            variant="elevated"
            padding="none"
            className={cn(
              "overflow-hidden transition-colors",
              isOpen && "border-gold/20",
            )}
          >
            <button
              type="button"
              id={`step-trigger-${step.number}`}
              aria-expanded={isOpen}
              aria-controls={`step-panel-${step.number}`}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="flex w-full items-start gap-4 p-5 text-left sm:p-6"
            >
              <span className="font-heading text-xl font-semibold text-gold sm:text-2xl">
                {step.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-base font-semibold text-foreground sm:text-lg">
                  Step {index + 1} — {step.title}
                </span>
                {!isOpen && (
                  <span className="mt-2 block text-sm leading-relaxed text-muted line-clamp-2">
                    {step.summary}
                  </span>
                )}
              </span>
              <ChevronIcon open={isOpen} />
            </button>
            {isOpen && (
              <div
                id={`step-panel-${step.number}`}
                role="region"
                aria-labelledby={`step-trigger-${step.number}`}
                className="border-t border-border-subtle px-5 pb-6 pt-5 sm:px-6 sm:pb-8"
              >
                <StepBody step={step} />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function DesktopTimeline({ steps }: MethodologyStepsProps) {
  return (
    <div className="relative hidden lg:block">
      <div
        className="absolute top-0 bottom-0 left-[1.625rem] w-px bg-border-subtle"
        aria-hidden
      />
      <ol>
        {steps.map((step, index) => (
          <li key={step.number} className="relative pb-16 last:pb-0">
          <div className="flex gap-10">
            <div className="relative z-10 flex shrink-0 flex-col items-center">
              <div className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-sm border border-gold/30 bg-surface-elevated shadow-sm">
                <span className="font-heading text-lg font-semibold text-gold">
                  {step.number}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className="mt-2 h-full min-h-8 w-px bg-gold/20"
                  aria-hidden
                />
              )}
            </div>
            <Card
              variant="elevated"
              padding="md"
              className="group flex-1 transition-colors hover:border-gold/15"
            >
              <div className={cardAccentLine} aria-hidden />
              <p className="text-xs font-semibold tracking-[0.2em] text-gold-muted uppercase">
                Step {index + 1}
              </p>
              <CardTitle className="mt-2">{step.title}</CardTitle>
              <CardDescription className="mt-3 text-base">
                {step.summary}
              </CardDescription>
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
                {step.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <StepHighlights highlights={step.highlights} />
            </Card>
          </div>
        </li>
        ))}
      </ol>
    </div>
  );
}

export function MethodologySteps({ steps }: MethodologyStepsProps) {
  return (
    <>
      <MobileAccordion steps={steps} />
      <DesktopTimeline steps={steps} />
    </>
  );
}
