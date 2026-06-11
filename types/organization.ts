/** Future multi-tenant organization model — not yet persisted. */
export type OrganizationPlan = "trial" | "standard" | "enterprise";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: OrganizationPlan;
  createdAt: string;
  updatedAt: string;
};
