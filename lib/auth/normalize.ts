export function normalizeEmail(email: string): string {
  return email.trim().normalize("NFKC").toLowerCase();
}

export function normalizePersonName(value: string): string {
  return value.trim().normalize("NFKC").replace(/\s+/g, " ");
}
