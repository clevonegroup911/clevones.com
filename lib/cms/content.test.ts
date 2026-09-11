import assert from "node:assert/strict";
import { test } from "node:test";

import { slugifyTitle } from "./content";
import {
  createContentPageSchema,
  upsertContentEntrySchema,
} from "@/lib/validation/cms";

test("slugifyTitle normalizes accents and punctuation", () => {
  assert.equal(slugifyTitle("  Gouvernance — Côte d'Ivoire  "), "gouvernance-cote-d-ivoire");
});

test("createContentPageSchema derives slug from title", () => {
  const parsed = createContentPageSchema.safeParse({
    title: "Notre mission",
    description: "Intro",
  });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.slug, "notre-mission");
  }
});

test("createContentPageSchema rejects invalid explicit slug", () => {
  const parsed = createContentPageSchema.safeParse({
    title: "Mission",
    slug: "Invalid Slug!",
  });
  assert.equal(parsed.success, false);
});

test("upsertContentEntrySchema accepts fr and en", () => {
  const parsed = upsertContentEntrySchema.safeParse({
    pageId: "page_1",
    locale: "fr",
    title: "Accueil",
    summary: "Résumé",
    body: "Corps",
  });
  assert.equal(parsed.success, true);
});
