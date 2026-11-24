import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

import { POST } from "@/app/api/initiative-submission/route";
import {
  CONTACT_RATE_LIMIT_MAX,
  CONTACT_RATE_LIMIT_WINDOW_MS,
  consumeContactSubmission,
  getContactClientIp,
  resetContactRateLimit,
} from "@/lib/contact-rate-limit";

const ORIGIN = "https://www.clevones.com";
process.env.APP_ORIGIN = ORIGIN;

function contactRequest(headers: Record<string, string>, body = "{not json") {
  return new Request(`${ORIGIN}/api/initiative-submission`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

beforeEach(() => {
  resetContactRateLimit();
});

test("contact rate limit allows 5 submissions per IP then refuses until the window ends", () => {
  const now = 1_000_000;
  for (let index = 0; index < CONTACT_RATE_LIMIT_MAX; index += 1) {
    assert.equal(consumeContactSubmission("203.0.113.7", now).limited, false);
  }
  const refused = consumeContactSubmission("203.0.113.7", now + 1000);
  assert.equal(refused.limited, true);
  assert.ok(refused.limited && refused.retryAfterSeconds > 0);

  assert.equal(consumeContactSubmission("203.0.113.8", now).limited, false);
  assert.equal(
    consumeContactSubmission("203.0.113.7", now + CONTACT_RATE_LIMIT_WINDOW_MS).limited,
    false,
  );
});

test("contact client IP uses the first forwarded hop, then x-real-ip", () => {
  assert.equal(
    getContactClientIp(contactRequest({ "x-forwarded-for": "198.51.100.4, 10.0.0.1" })),
    "198.51.100.4",
  );
  assert.equal(getContactClientIp(contactRequest({ "x-real-ip": "198.51.100.5" })), "198.51.100.5");
  assert.equal(getContactClientIp(contactRequest({})), "unknown");
});

test("contact route refuses cross-origin and header-less posts with a clean 403", async () => {
  const cases: Record<string, string>[] = [{ origin: "https://evil.example" }, {}];
  for (const headers of cases) {
    const response = await POST(contactRequest(headers));
    assert.equal(response.status, 403);
    const body = (await response.json()) as Record<string, unknown>;
    assert.equal(body.success, false);
    assert.equal(typeof body.error, "string");
    assert.equal(body.code, undefined);
    assert.doesNotMatch(String(body.error), /csrf|origin|referer/i);
  }
});

test("contact route answers 429 with Retry-After after 5 posts from one IP", async () => {
  const headers = { origin: ORIGIN, "x-forwarded-for": "192.0.2.10" };
  for (let index = 0; index < CONTACT_RATE_LIMIT_MAX; index += 1) {
    const response = await POST(contactRequest(headers));
    assert.equal(response.status, 400);
  }
  const limited = await POST(contactRequest(headers));
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
  const body = (await limited.json()) as Record<string, unknown>;
  assert.equal(body.success, false);
  assert.match(String(body.error), /too many submissions/i);

  const otherIp = await POST(
    contactRequest({ origin: ORIGIN, "x-forwarded-for": "192.0.2.11" }),
  );
  assert.equal(otherIp.status, 400);
});
