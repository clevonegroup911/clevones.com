import assert from "node:assert/strict";
import test from "node:test";

import {
  formatInitiativeSubmissionErrors,
  initiativeSubmissionSchema,
} from "@/lib/validation/initiative-submission";

const validProduct = {
  intent: "product",
  organizationName: "Fixture SARL",
  contactPerson: "Fixture Contact",
  professionalEmail: "contact@example.test",
  phone: "",
  location: "Kisangani, RDC",
  product: "clevone-dms",
  estimatedUsers: "12",
  need: "Suivi des ventes et des stocks pour deux boutiques.",
  privacyConsent: true,
};

const validInitiative = {
  organizationName: "Fixture Org",
  legalStatus: "ASBL",
  country: "CD",
  contactPerson: "Fixture Reviewer",
  professionalEmail: "reviewer@example.test",
  actorType: "institution",
  initiativeTitle: "Fixture initiative",
  initiativeStage: "documented-initiative",
  shortDescription:
    "Fixture submission used only in unit tests. Not production data at all.",
  territoryConcerned: "Tshopo",
  complianceStatus: "Documented for fixture review only.",
  expectedCollaborationType: "Institutional review",
  complianceConfirmation: true,
};

test("product inquiry: valid payload parses", () => {
  const parsed = initiativeSubmissionSchema.safeParse(validProduct);
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.intent, "product");
  }
});

test("product inquiry: missing required field is reported", () => {
  const { need: _need, ...withoutNeed } = validProduct;
  const parsed = initiativeSubmissionSchema.safeParse(withoutNeed);
  assert.equal(parsed.success, false);
  if (!parsed.success) {
    const errors = formatInitiativeSubmissionErrors(parsed.error);
    assert.ok(errors.need);
  }
});

test("product inquiry: privacy consent is required", () => {
  const parsed = initiativeSubmissionSchema.safeParse({
    ...validProduct,
    privacyConsent: false,
  });
  assert.equal(parsed.success, false);
  if (!parsed.success) {
    assert.ok(formatInitiativeSubmissionErrors(parsed.error).privacyConsent);
  }
});

test("product inquiry: estimated users must be a whole number", () => {
  const parsed = initiativeSubmissionSchema.safeParse({
    ...validProduct,
    estimatedUsers: "dix",
  });
  assert.equal(parsed.success, false);
});

test("product inquiry: governance fields are ignored", () => {
  const parsed = initiativeSubmissionSchema.safeParse({
    ...validProduct,
    availableDocumentation: "étude",
    complianceStatus: "n/a",
    territoryConcerned: "Tshopo",
    complianceConfirmation: false,
  });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    const data = parsed.data as Record<string, unknown>;
    assert.equal("availableDocumentation" in data, false);
    assert.equal("complianceStatus" in data, false);
    assert.equal("territoryConcerned" in data, false);
    assert.equal("complianceConfirmation" in data, false);
  }
});

test("unknown intent is rejected", () => {
  const parsed = initiativeSubmissionSchema.safeParse({
    ...validProduct,
    intent: "purchase-order",
  });
  assert.equal(parsed.success, false);
  if (!parsed.success) {
    assert.ok(formatInitiativeSubmissionErrors(parsed.error).intent);
  }
});

test("governance initiative without intent defaults to collaboration", () => {
  const parsed = initiativeSubmissionSchema.safeParse(validInitiative);
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.intent, "collaboration");
  }
});

test("governance initiative still requires its governance fields", () => {
  const parsed = initiativeSubmissionSchema.safeParse({
    ...validInitiative,
    intent: "eligibility",
    complianceStatus: "",
    complianceConfirmation: false,
  });
  assert.equal(parsed.success, false);
  if (!parsed.success) {
    const errors = formatInitiativeSubmissionErrors(parsed.error);
    assert.ok(errors.complianceStatus);
    assert.ok(errors.complianceConfirmation);
  }
});

test("business customer is an accepted actor type", () => {
  const parsed = initiativeSubmissionSchema.safeParse({
    ...validInitiative,
    intent: "initiative",
    actorType: "business-customer",
  });
  assert.equal(parsed.success, true);
});
