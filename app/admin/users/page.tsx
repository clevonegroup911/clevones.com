import { createPageMetadata } from "@/lib/metadata";

import {
  CreateGrantForm,
  CreateUserForm,
  DisableUserButton,
  RevokeGrantButton,
} from "@/app/admin/users/forms";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listManagedUsers } from "@/lib/auth/managed-users";
import { listDocumentGrants } from "@/lib/documents/grants";

export const metadata = createPageMetadata({
  title: "Utilisateurs",
  description: "Gestion des comptes USER/ADMIN et des DocumentGrant.",
  path: "/admin/users",
  robots: { index: false, follow: false },
});

export default async function AdminUsersPage() {
  await requireAdmin();
  const [users, grants] = await Promise.all([
    listManagedUsers(),
    listDocumentGrants(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-white">
          Utilisateurs
        </h1>
        <p className="mt-2 text-sm text-gray-muted">
          Création / désactivation hors SUPER_ADMIN, et grants documents. Pas
          de production migrate.
        </p>
      </div>

      <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
        <h2 className="text-sm font-semibold text-white">Créer un compte</h2>
        <CreateUserForm />
      </section>

      <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
        <h2 className="text-sm font-semibold text-white">Comptes</h2>
        <ul className="mt-4 divide-y divide-border-subtle">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="text-sm text-white">
                  {user.email}{" "}
                  <span className="text-xs text-gray-muted">
                    {user.role} · {user.status}
                  </span>
                </p>
                <p className="text-xs text-gray-muted">
                  {user.firstName} {user.lastName} · {user.id}
                </p>
              </div>
              {user.role !== "SUPER_ADMIN" && user.status !== "DISABLED" ? (
                <DisableUserButton userId={user.id} />
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-sm border border-border-subtle bg-surface-elevated p-5">
        <h2 className="text-sm font-semibold text-white">DocumentGrant</h2>
        <CreateGrantForm />
        <ul className="mt-6 divide-y divide-border-subtle">
          {grants.length === 0 ? (
            <li className="py-3 text-sm text-gray-muted">Aucun grant.</li>
          ) : (
            grants.map((grant) => (
              <li
                key={grant.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="text-sm text-white">
                    {grant.document.title} → {grant.user.email}
                  </p>
                  <p className="text-xs text-gray-muted">
                    read={String(grant.canRead)} write={String(grant.canWrite)} ·{" "}
                    {grant.documentId} / {grant.userId}
                  </p>
                </div>
                <RevokeGrantButton
                  documentId={grant.documentId}
                  userId={grant.userId}
                />
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
