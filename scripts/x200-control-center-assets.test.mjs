import assert from "node:assert/strict";
import { test } from "node:test";

import {
  assertControlCenterHtmlHasAssets,
  extractNextAssetUrls,
} from "./lib/x200-control-center-assets.mjs";

test("extractNextAssetUrls finds stylesheet and script references", () => {
  const html = `<!doctype html><html><head>
<link rel="stylesheet" href="/_next/static/css/app.css"/>
<script src="/_next/static/chunks/main.js"></script>
</head><body></body></html>`;
  const urls = extractNextAssetUrls(html);
  assert.ok(urls.some((url) => url.includes("/_next/static/css/")));
  assert.ok(urls.some((url) => url.includes("/_next/static/chunks/")));
  assert.equal(assertControlCenterHtmlHasAssets(html).ok, true);
});

test("assertControlCenterHtmlHasAssets fails when HTML has no _next assets", () => {
  assert.throws(
    () =>
      assertControlCenterHtmlHasAssets(
        "<!doctype html><html><head></head><body><h1>bare</h1></body></html>",
      ),
    /missing|without resolvable/i,
  );
});
