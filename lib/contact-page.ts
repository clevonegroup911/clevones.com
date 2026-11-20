import {
  contactIntents,
  type ContactIntentValue,
} from "@/lib/constants/contact-form-options";

export type ContactIntent = ContactIntentValue;

/**
 * Resolves `?intent=` on /contact and /collaboration.
 * Returns `undefined` when absent or unknown: the page then shows the
 * two-audience header and the default (governance) form.
 */
export function resolveContactIntent(
  value: string | undefined,
): ContactIntent | undefined {
  return contactIntents.find((intent) => intent === value);
}
