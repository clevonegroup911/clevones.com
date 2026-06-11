import { NextResponse } from "next/server";

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
    void preparedEmail;

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
