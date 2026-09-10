import assert from "node:assert/strict";
import { test } from "node:test";

import {
  clearEmailJournal,
  getEmailJournal,
  sendEmail,
} from "@/lib/email/send";
import {
  createFailingEmailProvider,
  createMemoryEmailProvider,
} from "@/lib/email/providers";
import { initiativeEmailTemplate } from "@/lib/email/templates";

test("sendEmail retries transient provider failures", async () => {
  clearEmailJournal();
  const provider = createFailingEmailProvider(2);
  const result = await sendEmail(
    {
      to: [{ email: "ops@example.invalid" }],
      subject: "retry",
      text: "body",
    },
    { provider, maxAttempts: 3, retryDelayMs: 0 },
  );
  assert.equal(result.ok, true);
  assert.equal(result.attempts, 3);
  assert.equal(getEmailJournal().length, 3);
  assert.equal(getEmailJournal().filter((row) => !row.ok).length, 2);
});

test("memory provider records outbox without secrets", async () => {
  const store = createMemoryEmailProvider();
  const result = await sendEmail(
    {
      to: [{ email: "a@example.invalid" }],
      subject: "hello",
      text: "world",
      locale: "fr",
    },
    { provider: store },
  );
  assert.equal(result.ok, true);
  assert.equal(store.outbox.length, 1);
  assert.equal(store.outbox[0]?.locale, "fr");
});

test("initiative template is bilingual-ready", () => {
  const message = initiativeEmailTemplate(
    {
      subject: "Structured initiative submission — Demo",
      replyTo: "person@example.invalid",
      sections: [{ heading: "Organization", body: "Org" }],
    },
    "fr",
  );
  assert.match(message.text, /Nouvelle soumission/);
  assert.equal(message.locale, "fr");
  assert.equal(message.headers?.["X-Clevones-Locale"], "fr");
});
