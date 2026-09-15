import assert from "node:assert/strict";
import { test } from "node:test";

import { readJsonBody } from "@/lib/http/read-json-body";

test("readJsonBody returns 400 for empty body", async () => {
  const result = await readJsonBody(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "",
    }),
  );
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.response.status, 400);
  const payload = (await result.response.json()) as { error?: string };
  assert.equal(payload.error, "Corps JSON manquant.");
});

test("readJsonBody returns 400 for malformed JSON", async () => {
  const result = await readJsonBody(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    }),
  );
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.response.status, 400);
  const payload = (await result.response.json()) as { error?: string };
  assert.equal(payload.error, "JSON malformé.");
});

test("readJsonBody parses valid JSON", async () => {
  const result = await readJsonBody(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: "pay_1", reference: "R1" }),
    }),
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.body, { paymentId: "pay_1", reference: "R1" });
});
