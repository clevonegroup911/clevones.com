import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import type { Page } from "@playwright/test";

const FORBIDDEN = [
  /otpauth:\/\//i,
  /data:image\/png;base64,/i,
  /MFA_ENCRYPTION_KEY/i,
  /AUTH_SECRET/i,
  /DATABASE_URL/i,
  /recovery code/i,
];

export async function captureSafeEvidence(
  page: Page,
  fileName: string,
): Promise<string> {
  const url = page.url();
  assert.match(
    url,
    /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?\//i,
    `Refusing screenshot ${fileName}: URL is not loopback`,
  );
  assert.equal(
    /\/admin\/security\/mfa/i.test(url),
    false,
    `Refusing screenshot ${fileName}: enrollment page is not captured`,
  );

  const html = await page.content();
  for (const pattern of FORBIDDEN) {
    assert.equal(
      pattern.test(html),
      false,
      `Refusing screenshot ${fileName}: page HTML matched ${pattern}`,
    );
  }

  const code = page.locator("#code");
  if ((await code.count()) > 0) {
    const value = await code.inputValue();
    assert.equal(value, "", "MFA code field must be empty before capture");
  }

  const password = page.locator('input[name="password"]');
  if ((await password.count()) > 0) {
    const value = await password.inputValue();
    assert.equal(value, "", "Password field must be empty before capture");
  }

  const dir = join(process.cwd(), "tests/e2e/evidence");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, fileName);
  await page.screenshot({ path, fullPage: true, animations: "disabled" });
  return path;
}
