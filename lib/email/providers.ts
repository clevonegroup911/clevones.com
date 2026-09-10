import type { EmailMessage, EmailProvider, EmailSendResult } from "@/lib/email/types";

/** Dev/test provider: never talks to a network. */
export function createConsoleEmailProvider(): EmailProvider {
  return {
    name: "console",
    async send(message: EmailMessage): Promise<EmailSendResult> {
      const preview = {
        to: message.to.map((item) => item.email),
        subject: message.subject,
        locale: message.locale ?? "en",
        textBytes: message.text.length,
      };
      console.info("[email:console]", JSON.stringify(preview));
      return {
        ok: true,
        provider: "console",
        messageId: `console-${Date.now()}`,
        attempts: 1,
      };
    },
  };
}

export type MemoryEmailRecord = EmailMessage & {
  at: string;
  messageId: string;
};

/** In-memory provider for unit tests. */
export function createMemoryEmailProvider(store: MemoryEmailRecord[] = []) {
  const provider: EmailProvider & { outbox: MemoryEmailRecord[] } = {
    name: "memory",
    outbox: store,
    async send(message: EmailMessage): Promise<EmailSendResult> {
      const messageId = `memory-${store.length + 1}`;
      store.push({ ...message, at: new Date().toISOString(), messageId });
      return { ok: true, provider: "memory", messageId, attempts: 1 };
    },
  };
  return provider;
}

export function createFailingEmailProvider(failuresBeforeSuccess = 2): EmailProvider {
  let attempts = 0;
  return {
    name: "flaky",
    async send(): Promise<EmailSendResult> {
      attempts += 1;
      if (attempts <= failuresBeforeSuccess) {
        return {
          ok: false,
          provider: "flaky",
          error: `transient_failure_${attempts}`,
          attempts: 1,
        };
      }
      return {
        ok: true,
        provider: "flaky",
        messageId: `flaky-${attempts}`,
        attempts: 1,
      };
    },
  };
}
