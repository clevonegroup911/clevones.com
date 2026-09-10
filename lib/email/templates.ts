import type { PreparedInitiativeEmail } from "@/lib/initiative-submission-email";
import type { EmailMessage } from "@/lib/email/types";

export function initiativeEmailTemplate(
  prepared: PreparedInitiativeEmail,
  locale: "fr" | "en" = "en",
): EmailMessage {
  const intro =
    locale === "fr"
      ? "Nouvelle soumission d'initiative structurée."
      : "New structured initiative submission.";

  const text = [
    intro,
    "",
    `Subject: ${prepared.subject}`,
    `Reply-To: ${prepared.replyTo}`,
    "",
    ...prepared.sections.flatMap((section) => [
      `## ${section.heading}`,
      section.body,
      "",
    ]),
  ].join("\n");

  return {
    to: [{ email: "operations@example.invalid", name: "Clevones Operations" }],
    subject: prepared.subject,
    text,
    locale,
    headers: {
      "X-Clevones-Template": "initiative-submission",
      "X-Clevones-Locale": locale,
    },
  };
}
