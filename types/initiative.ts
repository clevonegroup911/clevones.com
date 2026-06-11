/** Future territorial initiative tracking model — not yet persisted. */
export type InitiativeStatus =
  | "draft"
  | "active"
  | "on_hold"
  | "completed"
  | "archived";

export type Initiative = {
  id: string;
  organizationId: string;
  title: string;
  status: InitiativeStatus;
  territory: string | null;
  createdAt: string;
  updatedAt: string;
};
