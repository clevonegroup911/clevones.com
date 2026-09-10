import { NextResponse } from "next/server";

import { trackAnalyticsEvent } from "@/lib/analytics/track";
import { resolveEmailProviderFromEnv, sendEmail } from "@/lib/email/send";
import { initiativeEmailTemplate } from "@/lib/email/templates";
import { prepareInitiativeSubmissionEmail } from "@/lib/initiative-submission-email";
import { logInitiativeSubmissionInDevelopment } from "@/lib/initiative-submission-log";
import {
  formatInitiativeSubmissionErrors,
  initiativeSubmissionSchema,
} from "@/lib/validation/initiative-submission";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error:
          "The submission could not be processed. Please verify the form and try again.",
      },
      { status: 400 },
    );
  }

  const parsed = initiativeSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        errors: formatInitiativeSubmissionErrors(parsed.error),
      },
      { status: 400 },
    );
  }

  try {
    const submission = parsed.data;

    logInitiativeSubmissionInDevelopment(submission);

    const preparedEmail = prepareInitiativeSubmissionEmail(submission);
    const message = initiativeEmailTemplate(preparedEmail, "en");
    await sendEmail(message, {
      provider: resolveEmailProviderFromEnv(),
      maxAttempts: 3,
      retryDelayMs: 0,
    });

    await trackAnalyticsEvent({
      name: "FORM_SUBMIT",
      path: "/api/initiative-submission",
      label: "initiative",
    });
    await trackAnalyticsEvent({
      name: "COMMERCIAL_ACTION",
      path: "/api/initiative-submission",
      label: submission.expectedCollaborationType.slice(0, 80),
    });

    return NextResponse.json({
      success: true,
      message:
        "Your structured initiative has been received for institutional review.",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error:
          "The submission could not be recorded at this time. Please try again later or contact the governance team through official channels.",
      },
      { status: 500 },
    );
  }
}
