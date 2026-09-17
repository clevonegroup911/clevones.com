import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  createProviderAdapter,
  listStubProviderIds,
} from "@/lib/agentic/providers";

const providersSource = join(
  dirname(fileURLToPath(import.meta.url)),
  "providers",
  "index.ts",
);

test("createProviderAdapter covers internal/grok/openai/cursor/future", async () => {
  const ids = listStubProviderIds();
  assert.deepEqual([...ids].sort(), ["cursor", "future", "grok", "internal", "openai"].sort());

  for (const id of ids) {
    const adapter = createProviderAdapter(id);
    assert.equal(adapter.id, id);
    const health = await adapter.healthCheck();
    assert.equal(health.ok, true);
    assert.equal(health.status, "available");
    assert.ok(Array.isArray(adapter.getCapabilities()));
    assert.ok(typeof adapter.estimateCost("classify") === "number");
    assert.ok(adapter.estimateCost("classify") >= 0);
  }
});

test("execute and stream refuse live calls without network", async () => {
  for (const id of listStubProviderIds()) {
    const adapter = createProviderAdapter(id);
    const exec = await adapter.execute("summarize", { text: "x" });
    const stream = await adapter.stream("summarize", { text: "x" });
    assert.equal(exec.ok, false);
    assert.equal(exec.code, "PROVIDER_LIVE_DISABLED");
    assert.equal(stream.ok, false);
    assert.equal(stream.code, "PROVIDER_LIVE_DISABLED");
  }
});

test("internal adapter exposes finance-related capabilities from catalog", () => {
  const caps = createProviderAdapter("internal").getCapabilities();
  assert.ok(caps.includes("reconcile") || caps.includes("extract"));
});

test("provider module source has no paid vendor SDK imports", () => {
  const src = readFileSync(providersSource, "utf8");
  assert.doesNotMatch(src, /from ["']openai["']/);
  assert.doesNotMatch(src, /from ["']@xai/);
  assert.doesNotMatch(src, /from ["']xai["']/);
  assert.doesNotMatch(src, /@cursor\/sdk/);
  assert.doesNotMatch(src, /cursor-sdk/);
  assert.doesNotMatch(src, /node:net|undici|node-fetch|https?:\/\//);
});
