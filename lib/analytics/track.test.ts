import assert from "node:assert/strict";
import { test } from "node:test";

import { getAnalyticsDashboardSnapshot } from "./aggregate";
import { createMemoryAnalyticsStore } from "./memory-store";
import {
  actorKindFromRole,
  assertPrivacySafePayload,
  sanitizePath,
} from "./sanitize";
import { setAnalyticsStoreForTests } from "./store";
import { normalizeTrackEvent, trackEvent } from "./track";

test("sanitizePath strips query, emails and ids", () => {
  assert.equal(
    sanitizePath("/portal?q=secret@example.com"),
    "/portal",
  );
  assert.equal(
    sanitizePath("/api/portal/documents/clxxxxxxxxxxxxxxxxxxx12"),
    "/api/portal/documents/:id",
  );
  assert.equal(
    sanitizePath("https://clevones.com/contact?intent=initiative#top"),
    "/contact",
  );
});

test("actorKindFromRole never returns an identifier", () => {
  assert.equal(actorKindFromRole("SUPER_ADMIN"), "SUPER_ADMIN");
  assert.equal(actorKindFromRole("ADMIN"), "ADMIN");
  assert.equal(actorKindFromRole(undefined), "ANONYMOUS");
});

test("normalizeTrackEvent keeps a privacy-safe payload", () => {
  const event = normalizeTrackEvent({
    name: "form_submit",
    category: "FORM",
    path: "/contact?email=a@b.c",
    locale: "fr",
    actorKind: "ANONYMOUS",
  });
  assert.equal(event.path, "/contact");
  assert.equal(event.locale, "fr");
  assert.equal(event.name, "form_submit");
  assert.doesNotMatch(JSON.stringify(event), /@/);
  assertPrivacySafePayload({ ...event, day: event.day.toISOString() });
});

test("trackEvent records page, form, admin and document events", async () => {
  const store = createMemoryAnalyticsStore();
  setAnalyticsStoreForTests(store);
  try {
    await trackEvent({ name: "page_view", category: "PAGE", path: "/mission" });
    await trackEvent({ name: "form_submit", category: "FORM", path: "/contact" });
    await trackEvent({
      name: "admin_view",
      category: "ADMIN",
      path: "/admin/dashboard",
      actorKind: "ADMIN",
    });
    await trackEvent({
      name: "document_upload",
      category: "DOCUMENT",
      path: "/api/portal/documents",
      actorKind: "ADMIN",
    });
    assert.equal(store.records.length, 4);
    const snapshot = await getAnalyticsDashboardSnapshot(7);
    assert.equal(snapshot.total, 4);
    assert.equal(snapshot.byCategory.find((row) => row.key === "PAGE")?.count, 1);
    assert.equal(snapshot.byCategory.find((row) => row.key === "FORM")?.count, 1);
    assert.equal(snapshot.byCategory.find((row) => row.key === "ADMIN")?.count, 1);
    assert.equal(snapshot.byCategory.find((row) => row.key === "DOCUMENT")?.count, 1);
    assert.ok(!JSON.stringify(snapshot).includes("ipAddress"));
    assert.ok(!JSON.stringify(snapshot).includes("userId"));
  } finally {
    setAnalyticsStoreForTests(null);
  }
});

test("trackEvent swallows store failures", async () => {
  setAnalyticsStoreForTests({
    async create() {
      throw new Error("db down");
    },
    async listSince() {
      return [];
    },
  });
  try {
    await trackEvent({ name: "page_view", category: "PAGE", path: "/" });
  } finally {
    setAnalyticsStoreForTests(null);
  }
});
