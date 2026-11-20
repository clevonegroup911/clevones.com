"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormSectionHeading } from "@/components/ui/form-section-heading";
import { FormField, Input, Select, Textarea } from "@/components/ui/form-field";
import { productNeedMaxLength } from "@/lib/constants/contact-form-options";
import {
  emptyProductInquiry,
  type ProductInquiry,
  type ProductInquiryErrors,
  type ProductInquiryField,
  submitProductInquiry,
  validateProductInquiry,
} from "@/lib/contact-form";
import { getContent, getLocaleFromPath } from "@/lib/i18n";
import { buttonFullMobile, proseLink } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

/**
 * Product inquiry / quote — short customer form (intent=product).
 * No governance fields: no documentation, compliance, territory or
 * neutrality acknowledgment.
 */
export function ContactProductForm() {
  const locale = getLocaleFromPath(usePathname());
  const page = getContent(locale).pages.contact;
  const content = page.productForm;
  const intentContent = page.intents.product;
  const [form, setForm] = useState<ProductInquiry>(() =>
    emptyProductInquiry("clevone-dms"),
  );
  const [errors, setErrors] = useState<ProductInquiryErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateField<K extends ProductInquiryField>(
    field: K,
    value: ProductInquiry[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
    if (submitError) {
      setSubmitError(null);
    }
  }

  function focusFirstInvalid() {
    document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateProductInquiry(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      focusFirstInvalid();
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitProductInquiry(form);
      setSubmitted(true);
      setForm(emptyProductInquiry("clevone-dms"));
    } catch (error) {
      const submissionError = error as Error & {
        formErrors?: ProductInquiryErrors;
      };
      if (submissionError.formErrors) {
        setErrors(submissionError.formErrors);
        focusFirstInvalid();
        return;
      }
      setSubmitError(submissionError.message || page.form.errorTitle);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card
        variant="elevated"
        padding="md"
        className="mt-8"
        role="status"
        aria-live="polite"
      >
        <p className="text-xs font-semibold tracking-[0.15em] text-gold-muted uppercase">
          {content.success.eyebrow}
        </p>
        <h2 className="mt-3 font-heading text-2xl font-semibold text-foreground">
          {content.success.title}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {content.success.fallbackMessage} {content.success.continuation}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-8"
          onClick={() => setSubmitted(false)}
        >
          {content.success.submitAnother}
        </Button>
      </Card>
    );
  }

  const field = content.fields;

  return (
    <Card variant="elevated" padding="md" className="mt-8">
      <form
        noValidate
        onSubmit={handleSubmit}
        className="space-y-10"
        aria-label={content.formAriaLabel}
        aria-busy={isSubmitting}
        data-testid="product-inquiry-form"
      >
        <section className="space-y-6">
          <FormSectionHeading title={content.sections.contact} />
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              id="organizationName"
              label={field.organizationName.label}
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
                maxLength={200}
              />
            </FormField>
            <FormField
              id="contactPerson"
              label={field.contactPerson.label}
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
                maxLength={200}
              />
            </FormField>
            <FormField
              id="professionalEmail"
              label={field.professionalEmail.label}
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
                maxLength={254}
              />
            </FormField>
            <FormField id="phone" label={field.phone.label} error={errors.phone}>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                hasError={Boolean(errors.phone)}
                autoComplete="tel"
                maxLength={40}
              />
            </FormField>
            <FormField
              id="location"
              label={field.location.label}
              error={errors.location}
              className="sm:col-span-2"
            >
              <Input
                id="location"
                name="location"
                value={form.location}
                onChange={(event) => updateField("location", event.target.value)}
                hasError={Boolean(errors.location)}
                maxLength={160}
              />
            </FormField>
          </div>
        </section>

        <section className="space-y-6">
          <FormSectionHeading title={content.sections.request} />
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              id="product"
              label={field.product.label}
              required
              error={errors.product}
            >
              <Select
                id="product"
                name="product"
                value={form.product}
                onChange={(event) =>
                  updateField(
                    "product",
                    event.target.value as ProductInquiry["product"],
                  )
                }
                hasError={Boolean(errors.product)}
              >
                <option value="" disabled>
                  {content.selectProduct}
                </option>
                {content.productOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              id="estimatedUsers"
              label={field.estimatedUsers.label}
              error={errors.estimatedUsers}
            >
              <Input
                id="estimatedUsers"
                name="estimatedUsers"
                type="number"
                inputMode="numeric"
                min={1}
                max={999999}
                value={form.estimatedUsers}
                onChange={(event) =>
                  updateField("estimatedUsers", event.target.value)
                }
                hasError={Boolean(errors.estimatedUsers)}
              />
            </FormField>
            <FormField
              id="need"
              label={field.need.label}
              required
              error={errors.need}
              hint={field.need.hint}
              className="sm:col-span-2"
            >
              <Textarea
                id="need"
                name="need"
                value={form.need}
                onChange={(event) => updateField("need", event.target.value)}
                hasError={Boolean(errors.need)}
                rows={5}
                maxLength={productNeedMaxLength}
              />
            </FormField>
          </div>
        </section>

        <section className="space-y-4">
          <FormSectionHeading title={content.sections.consent} />
          <div
            className={cn(
              "rounded-sm border px-4 py-4",
              errors.privacyConsent
                ? "border-danger/60 bg-danger/5"
                : "border-border-subtle bg-surface",
            )}
          >
            <label className="flex min-h-12 cursor-pointer items-start gap-3 py-1">
              <input
                id="privacyConsent"
                name="privacyConsent"
                type="checkbox"
                checked={form.privacyConsent}
                onChange={(event) =>
                  updateField("privacyConsent", event.target.checked)
                }
                className="mt-1 h-5 w-5 shrink-0 rounded-sm accent-navy"
                aria-invalid={Boolean(errors.privacyConsent) || undefined}
                aria-describedby={
                  errors.privacyConsent ? "privacyConsent-error" : undefined
                }
              />
              <span className="text-sm leading-relaxed text-foreground">
                {content.privacyConsent.before}
                <Link href={content.privacyConsent.href} className={proseLink}>
                  {content.privacyConsent.linkLabel}
                </Link>
                {content.privacyConsent.after}
              </span>
            </label>
            {errors.privacyConsent ? (
              <p
                id="privacyConsent-error"
                className="mt-3 text-xs text-danger"
                role="alert"
              >
                {errors.privacyConsent}
              </p>
            ) : null}
          </div>
        </section>

        {submitError ? (
          <div
            className="rounded-sm border border-danger/40 bg-danger/5 px-4 py-4"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-sm font-medium text-danger">
              {page.form.errorTitle}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-danger">
              {submitError}
            </p>
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-4 border-t border-border-subtle pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-pretty text-muted">
            {page.form.requiredNotice}
          </p>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className={buttonFullMobile}
          >
            {isSubmitting ? page.form.submitting : intentContent.submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
