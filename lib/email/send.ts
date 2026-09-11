import type { EmailMessage, EmailProvider, EmailSendResult } from "@/lib/email/types";
import { createConsoleEmailProvider } from "@/lib/email/providers";

export type EmailJournalEntry = {
  at: string;
  provider: string;
  subject: string;
  to: string[];
  ok: boolean;
  error?: string;
  messageId?: string;
  attempt: number;
};

const journal: EmailJournalEntry[] = [];

export function getEmailJournal(): readonly EmailJournalEntry[] {
  return journal;
}

export function clearEmailJournal(): void {
  journal.length = 0;
}

export type SendEmailOptions = {
  provider?: EmailProvider;
  maxAttempts?: number;
  retryDelayMs?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends email via an abstracted provider with retries and an in-process journal.
 * No real secrets. Default provider is console (dev/test).
 */
export async function sendEmail(
  message: EmailMessage,
  options: SendEmailOptions = {},
): Promise<EmailSendResult> {
  const provider = options.provider ?? createConsoleEmailProvider();
  const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
  const retryDelayMs = Math.max(0, options.retryDelayMs ?? 0);

  let last: EmailSendResult = {
    ok: false,
    provider: provider.name,
    error: "not_attempted",
    attempts: 0,
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    last = await provider.send(message);
    last = { ...last, attempts: attempt };
    journal.push({
      at: new Date().toISOString(),
      provider: provider.name,
      subject: message.subject,
      to: message.to.map((item) => item.email),
      ok: last.ok,
      error: last.error,
      messageId: last.messageId,
      attempt,
    });
    if (last.ok) {
      return last;
    }
    if (attempt < maxAttempts && retryDelayMs > 0) {
      await sleep(retryDelayMs);
    }
  }

  return last;
}

export function resolveEmailProviderFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): EmailProvider {
  const mode = (env.EMAIL_PROVIDER || "console").toLowerCase();
  if (mode === "console" || mode === "test" || mode === "memory") {
    return createConsoleEmailProvider();
  }
  // Future SMTP/API providers require secrets outside Git (T026/human).
  return createConsoleEmailProvider();
}
