"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormSectionHeading } from "@/components/ui/form-section-heading";
import {
  FormField,
  FormFieldset,
  Input,
  Select,
  Textarea,
} from "@/components/ui/form-field";
import { buttonFullMobile } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import {
  actorTypes,
  emptyInitiativeSubmission,
  initiativeStages,
  type InitiativeSubmission,
  type InitiativeSubmissionErrors,
  type InitiativeSubmissionField,
  submitInitiativeSubmission,
  validateInitiativeSubmission,
} from "@/lib/contact-form";
import {
  contactPageForm,
  contactPageIntents,
  type ContactIntent,
} from "@/lib/contact-page";

type ContactInitiativeFormProps = {
  intent?: ContactIntent;
};

export function ContactInitiativeForm({
  intent = "collaboration",
}: ContactInitiativeFormProps) {
  const intentContent = contactPageIntents[intent];
  const [form, setForm] = useState<InitiativeSubmission>(() => ({
    ...emptyInitiativeSubmission(),
    initiativeStage:
      intent === "initiative" ? "documented-initiative" : "",
  }));
  const [errors, setErrors] = useState<InitiativeSubmissionErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateField<K extends InitiativeSubmissionField>(
    field: K,
    value: InitiativeSubmission[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
    if (submitted) {
      setSubmitted(false);
    }
    if (submitError) {
      setSubmitError(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateInitiativeSubmission(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstInvalid = document.querySelector<HTMLElement>(
        "[aria-invalid='true']",
      );
      firstInvalid?.focus();
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitInitiativeSubmission(form);
      setSubmitted(true);
      setForm(emptyInitiativeSubmission());
    } catch (error) {
      const submissionError = error as Error & {
        formErrors?: InitiativeSubmissionErrors;
      };

      if (submissionError.formErrors) {
        setErrors(submissionError.formErrors);
        const firstInvalid = document.querySelector<HTMLElement>(
          "[aria-invalid='true']",
        );
        firstInvalid?.focus();
        return;
      }

      setSubmitError(
        submissionError.message ||
          "The submission could not be recorded at this time. Please try again later.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card
        variant="elevated"
        padding="md"
        className="mt-10"
        role="status"
        aria-live="polite"
      >
        <p className="text-xs font-semibold tracking-[0.15em] text-gold-muted uppercase">
          Submission received
        </p>
        <h2 className="mt-3 font-heading text-2xl font-semibold text-white">
          Submission received for institutional review
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Your structured initiative has been recorded. The Clevones governance
          team will assess eligibility against documented criteria and respond
          through official channels. Clevones does not conduct informal
          brokerage or operational intermediation.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-8"
          onClick={() => setSubmitted(false)}
        >
          Submit another initiative
        </Button>
      </Card>
    );
  }

  const showActorOther = form.actorType === "other";

  return (
    <Card variant="elevated" padding="md" className="mt-8 sm:mt-10">
      <form
        noValidate
        onSubmit={handleSubmit}
        className="space-y-10 sm:space-y-12"
        aria-label="Structured initiative submission"
        aria-busy={isSubmitting}
      >
        <section className="space-y-6">
          <FormSectionHeading title={contactPageForm.sections.organization} />
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              id="organizationName"
              label="Organization name"
              required
              error={errors.organizationName}
            >
              <Input
                id="organizationName"
                name="organizationName"
                value={form.organizationName}
                onChange={(event) =>
                  updateField("organizationName", event.target.value)
                }
                hasError={Boolean(errors.organizationName)}
                autoComplete="organization"
              />
            </FormField>

            <FormField
              id="legalStatus"
              label="Legal status"
              required
              error={errors.legalStatus}
              hint="e.g. public institution, registered company, fund"
            >
              <Input
                id="legalStatus"
                name="legalStatus"
                value={form.legalStatus}
                onChange={(event) =>
                  updateField("legalStatus", event.target.value)
                }
                hasError={Boolean(errors.legalStatus)}
              />
            </FormField>

            <FormField
              id="country"
              label="Country"
              required
              error={errors.country}
            >
              <Input
                id="country"
                name="country"
                value={form.country}
                onChange={(event) => updateField("country", event.target.value)}
                hasError={Boolean(errors.country)}
                autoComplete="country-name"
              />
            </FormField>

            <FormField
              id="website"
              label="Website"
              error={errors.website}
            >
              <Input
                id="website"
                name="website"
                type="url"
                value={form.website}
                onChange={(event) => updateField("website", event.target.value)}
                hasError={Boolean(errors.website)}
                placeholder="https://"
                autoComplete="url"
              />
            </FormField>

            <FormField
              id="contactPerson"
              label="Contact person"
              required
              error={errors.contactPerson}
            >
              <Input
                id="contactPerson"
                name="contactPerson"
                value={form.contactPerson}
                onChange={(event) =>
                  updateField("contactPerson", event.target.value)
                }
                hasError={Boolean(errors.contactPerson)}
                autoComplete="name"
              />
            </FormField>

            <FormField
              id="professionalEmail"
              label="Professional email"
              required
              error={errors.professionalEmail}
            >
              <Input
                id="professionalEmail"
                name="professionalEmail"
                type="email"
                value={form.professionalEmail}
                onChange={(event) =>
                  updateField("professionalEmail", event.target.value)
                }
                hasError={Boolean(errors.professionalEmail)}
                autoComplete="email"
                placeholder="name@organization.com"
              />
            </FormField>

            <FormField
              id="phone"
              label="Phone / WhatsApp"
              error={errors.phone}
              className="sm:col-span-2"
            >
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                hasError={Boolean(errors.phone)}
                autoComplete="tel"
              />
            </FormField>
          </div>
        </section>

        <section className="space-y-6">
          <FormSectionHeading title={contactPageForm.sections.actorType} />
          <FormFieldset
            id="actorType"
            legend="Actor type"
            required
            error={errors.actorType}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {actorTypes.map((option) => {
                const inputId = `actorType-${option.value}`;
                const isSelected = form.actorType === option.value;

                return (
                  <label
                    key={option.value}
                    htmlFor={inputId}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-start gap-3 rounded-sm border px-4 py-4 transition-colors",
                      isSelected
                        ? "border-gold/40 bg-gold-subtle/30"
                        : "border-border-subtle bg-surface hover:border-gold/20",
                      errors.actorType && !isSelected && "border-red-500/30",
                    )}
                  >
                    <input
                      id={inputId}
                      name="actorType"
                      type="radio"
                      value={option.value}
                      checked={isSelected}
                      onChange={() => updateField("actorType", option.value)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-gold"
                    />
                    <span className="text-sm text-soft-white">{option.label}</span>
                  </label>
                );
              })}
            </div>
          </FormFieldset>

          {showActorOther ? (
            <FormField
              id="actorTypeOther"
              label="Specify actor type"
              required
              error={errors.actorTypeOther}
            >
              <Input
                id="actorTypeOther"
                name="actorTypeOther"
                value={form.actorTypeOther}
                onChange={(event) =>
                  updateField("actorTypeOther", event.target.value)
                }
                hasError={Boolean(errors.actorTypeOther)}
              />
            </FormField>
          ) : null}
        </section>

        <section className="space-y-6">
          <FormSectionHeading title={contactPageForm.sections.initiative} />
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              id="initiativeTitle"
              label="Initiative title"
              required
              error={errors.initiativeTitle}
              className="sm:col-span-2"
            >
              <Input
                id="initiativeTitle"
                name="initiativeTitle"
                value={form.initiativeTitle}
                onChange={(event) =>
                  updateField("initiativeTitle", event.target.value)
                }
                hasError={Boolean(errors.initiativeTitle)}
              />
            </FormField>

            <FormField
              id="initiativeStage"
              label="Initiative stage"
              required
              error={errors.initiativeStage}
              className="sm:col-span-2"
            >
              <Select
                id="initiativeStage"
                name="initiativeStage"
                value={form.initiativeStage}
                onChange={(event) =>
                  updateField(
                    "initiativeStage",
                    event.target.value as InitiativeSubmission["initiativeStage"],
                  )
                }
                hasError={Boolean(errors.initiativeStage)}
              >
                <option value="" disabled>
                  Select a stage
                </option>
                {initiativeStages.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              id="shortDescription"
              label="Short description"
              required
              error={errors.shortDescription}
              hint="Summarize scope, objectives, and governance needs."
              className="sm:col-span-2"
            >
              <Textarea
                id="shortDescription"
                name="shortDescription"
                value={form.shortDescription}
                onChange={(event) =>
                  updateField("shortDescription", event.target.value)
                }
                hasError={Boolean(errors.shortDescription)}
                rows={5}
              />
            </FormField>

            <FormField
              id="territoryConcerned"
              label="Territory concerned"
              required
              error={errors.territoryConcerned}
            >
              <Input
                id="territoryConcerned"
                name="territoryConcerned"
                value={form.territoryConcerned}
                onChange={(event) =>
                  updateField("territoryConcerned", event.target.value)
                }
                hasError={Boolean(errors.territoryConcerned)}
              />
            </FormField>

            <FormField
              id="availableDocumentation"
              label="Available documentation"
              error={errors.availableDocumentation}
              hint="Studies, frameworks, agreements, or audit references."
            >
              <Input
                id="availableDocumentation"
                name="availableDocumentation"
                value={form.availableDocumentation}
                onChange={(event) =>
                  updateField("availableDocumentation", event.target.value)
                }
                hasError={Boolean(errors.availableDocumentation)}
              />
            </FormField>

            <FormField
              id="complianceStatus"
              label="Compliance status"
              required
              error={errors.complianceStatus}
              hint="Regulatory, ESG, or institutional compliance position."
            >
              <Textarea
                id="complianceStatus"
                name="complianceStatus"
                value={form.complianceStatus}
                onChange={(event) =>
                  updateField("complianceStatus", event.target.value)
                }
                hasError={Boolean(errors.complianceStatus)}
                rows={3}
              />
            </FormField>

            <FormField
              id="expectedCollaborationType"
              label="Expected collaboration type"
              required
              error={errors.expectedCollaborationType}
              hint="Governance design, coordination, reporting, or advisory scope."
            >
              <Textarea
                id="expectedCollaborationType"
                name="expectedCollaborationType"
                value={form.expectedCollaborationType}
                onChange={(event) =>
                  updateField("expectedCollaborationType", event.target.value)
                }
                hasError={Boolean(errors.expectedCollaborationType)}
                rows={3}
              />
            </FormField>
          </div>
        </section>

        <section className="space-y-6">
          <FormSectionHeading title={contactPageForm.sections.confirmation} />
          <div
            className={cn(
              "rounded-sm border px-4 py-4",
              errors.governanceAcknowledgment
                ? "border-red-500/60 bg-red-500/5"
                : "border-border-subtle bg-surface",
            )}
          >
            <label className="flex min-h-12 cursor-pointer items-start gap-3 py-1">
              <input
                id="governanceAcknowledgment"
                name="governanceAcknowledgment"
                type="checkbox"
                checked={form.governanceAcknowledgment}
                onChange={(event) =>
                  updateField("governanceAcknowledgment", event.target.checked)
                }
                className="mt-1 h-5 w-5 shrink-0 rounded-sm accent-gold"
                aria-invalid={
                  Boolean(errors.governanceAcknowledgment) || undefined
                }
                aria-describedby={
                  errors.governanceAcknowledgment
                    ? "governanceAcknowledgment-error"
                    : undefined
                }
              />
              <span className="text-sm leading-relaxed text-soft-white">
                {contactPageForm.governanceAcknowledgment}
              </span>
            </label>
            {errors.governanceAcknowledgment ? (
              <p
                id="governanceAcknowledgment-error"
                className="mt-3 text-xs text-red-400"
                role="alert"
              >
                {errors.governanceAcknowledgment}
              </p>
            ) : null}
          </div>
        </section>

        {submitError ? (
          <div
            className="rounded-sm border border-red-500/40 bg-red-500/5 px-4 py-4"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-sm font-medium text-red-300">
              Submission not recorded
            </p>
            <p className="mt-2 text-sm leading-relaxed text-red-200/90">
              {submitError}
            </p>
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-4 border-t border-border-subtle pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-pretty text-muted">
            Required fields are marked with{" "}
            <span className="text-gold-muted">*</span>. Submissions are
            reviewed on a structured, institutional basis.
          </p>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className={buttonFullMobile}
          >
            {isSubmitting ? "Submitting…" : intentContent.submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
