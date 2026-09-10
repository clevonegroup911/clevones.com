import assert from "node:assert/strict";
import { test } from "node:test";

import { analyticsEventNames, summarizeTotals } from "./track";

test("analytics event catalogue is stable", () => {
  assert.deepEqual(analyticsEventNames, [
    "PAGE_VIEW",
    "FORM_SUBMIT",
    "ADMIN_LOGIN",
    "DOCUMENT_UPLOAD",
    "DOCUMENT_DOWNLOAD",
    "COMMERCIAL_ACTION",
  ]);
});

test("summarizeTotals aggregates privacy-safe counters", () => {
  const summary = summarizeTotals({
    PAGE_VIEW: 10,
    FORM_SUBMIT: 2,
    ADMIN_LOGIN: 3,
    DOCUMENT_UPLOAD: 4,
    DOCUMENT_DOWNLOAD: 1,
    COMMERCIAL_ACTION: 0,
  });
  assert.deepEqual(summary, {
    visitorsProxy: 10,
    forms: 2,
    adminLogins: 3,
    documents: 5,
  });
});
