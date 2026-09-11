import assert from "node:assert/strict";
import { test } from "node:test";

import { buildAutoplanPrompt, completionMarkerMatches, sha256Text } from "./lib/x200-autoplan.mjs";

test("completion marker is valid only for current HEAD and goal hash", () => {
  const marker = {
    version: 1,
    head: "abc123",
    goalHash: "goal456",
    generatedAt: "2026-09-12T00:00:00.000Z",
    summary: "done",
    evidence: ["quality=SUCCESS", "tests pass"],
  };
  assert.equal(completionMarkerMatches(marker, { head: "abc123", goalHash: "goal456" }), true);
  assert.equal(completionMarkerMatches(marker, { head: "changed", goalHash: "goal456" }), false);
  assert.equal(completionMarkerMatches(marker, { head: "abc123", goalHash: "changed" }), false);
});

test("completion marker requires concrete evidence", () => {
  const marker = { version: 1, head: "abc", goalHash: "goal", evidence: [] };
  assert.equal(completionMarkerMatches(marker, { head: "abc", goalHash: "goal" }), false);
});

test("autoplan prompt contains zero-duplication, three-task cap and sensitive gates", () => {
  const prompt = buildAutoplanPrompt({
    head: "abc",
    goalHash: sha256Text("goal"),
    humanReadyTasks: [{ id: "T099", title: "Prod deploy", priority: "P0", nextAction: "owner gate" }],
  });
  assert.match(prompt, /Zéro doublon/);
  assert.match(prompt, /au maximum 3 nouvelles tâches/);
  assert.match(prompt, /requiresHuman=true uniquement/);
  assert.match(prompt, /PRODUCT_COMPLETE\.json/);
  assert.match(prompt, /T099/);
});
