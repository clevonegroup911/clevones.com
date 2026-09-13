# Rôles et permissions

Audit initial T013 (2026-09-07). Mise à jour T033 (2026-09-12) : authentification portail USER **implémentée et testée localement / e2e**, pas live production.

Source de vérité : enum Prisma `UserRole` (`SUPER_ADMIN`, `ADMIN`, `USER`) et `UserStatus` (`ACTIVE`, `DISABLED`, `PENDING`). Le type `UserRole` de `types/user.ts` (`owner` / `admin` / `member` / `viewer`) est un modèle SaaS futur, **non persisté** ; il ne gouverne pas `/admin` ni `/portal`.

## Matrice des rôles

Légende : **Allow** = autorisé par un contrôle serveur ; **Deny** = refusé par un contrôle serveur ; **UI deny** = masqué ou message d'interdiction côté interface, avec refus serveur sur mutation ; **N/A** = aucune API applicative.

| Action / ressource | SUPER_ADMIN ACTIVE | ADMIN ACTIVE | USER ACTIVE | DISABLED ou PENDING |
| --- | --- | --- | --- | --- |
| `POST` login admin (`loginAdmin`) | Allow (session ou challenge MFA) | Allow (idem) | Deny (erreur générique) | Deny |
| `POST` login portail (`loginPortalUser` / `/sign-in`) | Deny (erreur générique) | Deny | Allow (`portal_session`) | Deny |
| Déconnexion portail (`/sign-out`) | N/A (cookie portail seulement) | N/A | Allow (efface `portal_session`) | Allow (no-op cookie) |
| `/admin/login`, `/admin/login/mfa` | Redirect si session admin | Redirect si session admin | Allow (public) | Allow (public, login refuse ensuite) |
| Middleware cookie JWT → `/admin/*` protégé | Allow si `admin_session` | Allow si `admin_session` | Redirect `/admin/login` (`portal_session` ignoré) | JWT admin éventuel : middleware peut laisser passer ; `requireAdmin` refuse |
| `GET /admin` → dashboard | Allow (`requireAdmin`) | Allow | Redirect login | Redirect login |
| MFA enroll / confirm / disable | Allow **soi uniquement** | Deny serveur | Deny | Deny |
| `/portal` + API `/api/portal/*` | Allow via `admin_session` + `requirePortalActor` | Allow idem | Allow via `portal_session` + `requirePortalActor` | Deny |
| `/admin/users` + API users/grants | Allow (créer USER/ADMIN, désactiver hors SUPER_ADMIN, grants) | Allow | Deny | Deny |
| Changer `User.role` / promouvoir SUPER_ADMIN | N/A (pas d'API) | N/A | N/A | N/A |

## Contrôles d'autorisation côté serveur

Défense en profondeur :

1. **Login admin** (`app/admin/actions.ts`) : mot de passe, puis `getAdminAccessDenialReason` + `canAccessAdminConsole` + `isAdminRole`. Un `USER` ACTIVE reçoit la même erreur générique qu'un mot de passe faux. Si `mfaEnabled`, aucun cookie de session n'est posé avant le second facteur.
2. **Login portail** (`app/(auth)/actions.ts`) : mot de passe, puis `canSignInAsPortalUser` (rôle `USER` + `ACTIVE` uniquement). Pose `portal_session` (JWT audience `clevones-portal`). Pas de MFA portail.
3. **JWT admin** (`lib/auth/session-token.ts`) : `role` doit être `SUPER_ADMIN` ou `ADMIN`. Un jeton `USER` / portail est rejeté.
4. **JWT portail** (`lib/auth/portal-session-token.ts`) : `role` doit être `USER`. Un jeton admin est rejeté (audience distincte).
5. **Middleware** (`middleware.ts`) : `/admin/*` protégé exige `admin_session` (ou challenge MFA). `/portal*` exige `portal_session` **ou** `admin_session` ; sinon redirect `/sign-in`. Ne relit pas la base.
6. **Pages admin** (`requireAdmin`) : relit l'utilisateur DB ; refuse USER ; efface `admin_session` si invalide.
7. **Pages / API portail** (`requirePortalActor` / `getOptionalPortalActor`) : USER ACTIVE via `portal_session`, ou ADMIN/SUPER_ADMIN ACTIVE via `admin_session`. `requireAdmin()` n'est plus le garde portail.
8. **Gestion users / grants (T034)** : `requireAdmin` + helpers `lib/auth/managed-users.ts` / `lib/documents/grants.ts`. Pas de création/désactivation SUPER_ADMIN via HTTP.

## Accès `/admin` vs `/portal`

- Console `/admin` : MFA admin inchangée ; cookie `admin_session` uniquement.
- Portail `/sign-in` → `/portal` : comptes USER ; cookie `portal_session`.
- Déconnexion `/sign-out` : efface uniquement `portal_session` (admin MFA intact).
- Un USER authentifié qui ouvre `/admin/dashboard` est renvoyé vers `/admin/login` (pas d'élévation).
- Un admin authentifié peut ouvrir `/portal` avec sa session admin (compatibilité e2e / ops).
- `/admin/users` : liste/création USER|ADMIN, désactivation hors SUPER_ADMIN, create/revoke DocumentGrant.

## Niveau de vérité (T033 + T034)

| État | Statut |
| --- | --- |
| Conçu | oui |
| Implémenté | oui (branche de travail) |
| Testé localement | oui (unitaires + e2e USER portail) |
| Validé CI | selon job `quality` sur le SHA de livraison |
| Fusionné / déployé / live prod | **non** — hors périmètre automatique |

## Fichiers de contrôle

| Fichier | Rôle |
| --- | --- |
| `lib/auth/admin-access.ts` | Accès console admin |
| `lib/auth/portal-access.ts` | Accès / sign-in portail USER |
| `lib/auth/require-admin.ts` | Garde admin + revalidation DB |
| `lib/auth/require-portal.ts` | Garde portail (USER ou admin) |
| `lib/auth/session-token.ts` | JWT admin |
| `lib/auth/portal-session-token.ts` | JWT portail |
| `middleware.ts` | Gate cookies |
| `app/admin/actions.ts` | Login / logout admin |
| `app/(auth)/actions.ts` | Login / logout portail |

Voir aussi `docs/ADMIN_MFA.md` et `docs/PRIVATE_DOCUMENTS.md`.
