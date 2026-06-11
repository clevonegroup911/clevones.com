import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  cloneElement,
  isValidElement,
} from "react";

import { formControlResponsive } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

export const formControlClassName = cn(
  "w-full min-w-0 rounded-sm border border-border-subtle bg-surface px-4 text-white outline-none transition-colors placeholder:text-gray-muted/60 focus:border-gold/40 focus:ring-2 focus:ring-gold/20 disabled:cursor-not-allowed disabled:opacity-50",
  formControlResponsive,
);

export const formControlErrorClassName =
  "border-red-500/60 focus:border-red-500/60 focus:ring-red-500/20";

function buildDescribedBy(errorId?: string, hintId?: string) {
  return [errorId, hintId].filter(Boolean).join(" ") || undefined;
}

function applyFieldA11y(
  children: ReactNode,
  describedBy?: string,
  required?: boolean,
): ReactNode {
  if (!isValidElement<{ id?: string; "aria-describedby"?: string; "aria-required"?: boolean }>(children)) {
    return children;
  }

  return cloneElement(children, {
    "aria-describedby": describedBy,
    "aria-required": required || undefined,
  });
}

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function FormField({
  id,
  label,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const describedBy = buildDescribedBy(errorId, hintId);

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-soft-white"
      >
        {label}
        {required ? (
          <span className="ml-1 text-gold-muted" aria-hidden>
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </label>
      {applyFieldA11y(children, describedBy, required)}
      {hint && !error ? (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type FormFieldsetProps = {
  legend: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  id?: string;
};

export function FormFieldset({
  legend,
  description,
  error,
  required,
  children,
  className,
  id,
}: FormFieldsetProps) {
  const errorId = error ? `${id ?? legend}-error` : undefined;

  return (
    <fieldset
      id={id}
      className={cn("min-w-0 border-0 p-0", className)}
      aria-describedby={errorId}
      aria-invalid={error ? true : undefined}
    >
      <legend className="mb-1.5 block text-sm font-medium text-soft-white">
        {legend}
        {required ? (
          <span className="ml-1 text-gold-muted" aria-hidden>
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </legend>
      {description ? (
        <p className="mb-4 text-xs text-muted">{description}</p>
      ) : null}
      {children}
      {error ? (
        <p id={errorId} className="mt-3 text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

type InputProps = ComponentPropsWithoutRef<"input"> & {
  hasError?: boolean;
};

export function Input({ className, hasError, ...props }: InputProps) {
  return (
    <input
      className={cn(
        formControlClassName,
        hasError && formControlErrorClassName,
        className,
      )}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}

type TextareaProps = ComponentPropsWithoutRef<"textarea"> & {
  hasError?: boolean;
};

export function Textarea({ className, hasError, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        formControlClassName,
        "min-h-[120px] resize-y",
        hasError && formControlErrorClassName,
        className,
      )}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}

type SelectProps = ComponentPropsWithoutRef<"select"> & {
  hasError?: boolean;
};

export function Select({ className, hasError, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        formControlClassName,
        hasError && formControlErrorClassName,
        className,
      )}
      aria-invalid={hasError || undefined}
      {...props}
    >
      {children}
    </select>
  );
}
