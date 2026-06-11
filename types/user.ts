/** Future SaaS user model — not yet persisted. */
export type UserRole = "owner" | "admin" | "member" | "viewer";

export type User = {
  id: string;
  email: string;
  name: string;
  organizationId: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};
