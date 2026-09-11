# Rôles et permissions administrateur

Audit T013 (2026-09-07). Revue du code dans `lib/auth` et `app/admin`. Aucun accès production, aucun compte modifié, aucun rôle réel changé.

Source de vérité : enum Prisma `UserRole` (`SUPER_ADMIN`, `ADMIN`, `USER`) et `UserStatus` (`ACTIVE`, `DISABLED`, `PENDING`). Le type `UserRole` de `types/user.ts` (`owner` / `admin` / `member` / `viewer`) est un modèle SaaS futur, **non persisté** ; il ne gouverne pas `/admin`.

## Matrice des rôles

Légende : **Allow** = autorisé par un contrôle serveur ; **Deny** = refusé par un contrôle serveur ; **UI deny** = masqué ou message d'interdiction côté interface, avec refus serveur sur mutation ; **N/A** = aucune API applicative.

| Action / ressource | SUPER_ADMIN ACTIVE | ADMIN ACTIVE | USER / anonyme | DISABLED ou PENDING |
| --- | --- | --- | --- | --- |
| `POST` login (`loginAdmin`) | Allow (session ou challenge MFA) | Allow (idem) | Deny (erreur générique) | Deny (erreur générique) |
| `/admin/login`, `/admin/login/mfa` | Redirect si session | Redirect si session | Allow (public) | Allow (public, login refuse ensuite) |
| Middleware cookie JWT → `/admin/*` protégé | Allow si JWT admin | Allow si JWT admin | Redirect `/admin/login` | JWT éventuel : middleware peut laisser passer ; `requireAdmin` refuse |
| `GET /admin` → dashboard | Allow (`requireAdmin`) | Allow | Redirect login | Redirect login |
| `GET /admin/dashboard` | Allow | Allow | Redirect login | Redirect login |
| `GET /admin/security/mfa` | Allow | Allow page, **UI deny** | Redirect login | Redirect login |
| MFA enroll / confirm / disable | Allow **soi uniquement** | Deny serveur | Deny | Deny |
| Changer `User.role` / promouvoir | N/A (pas d'API) | N/A | N/A | N/A |
| Créer un utilisateur admin | CLI `scripts/create-admin.ts` seulement | Idem (hors HTTP) | N/A | N/A |
| `POST /api/initiative-submission` | Public (sans rôle) | Public | Public | Public |
| `/portal` | Middleware **inactif** | Inactif | Inactif | Inactif |

## Contrôles d'autorisation côté serveur

Défense en profondeur :

1. **Login** (`app/admin/actions.ts`) : mot de passe, puis `getAdminAccessDenialReason` + `canAccessAdminConsole` + `isAdminRole`. Un `USER` ACTIVE reçoit la même erreur générique qu'un mot de passe faux. Si `mfaEnabled`, aucun cookie de session n'est posé avant le second facteur.
2. **JWT de session** (`lib/auth/session-token.ts`) : `role` doit être `SUPER_ADMIN` ou `ADMIN`. Un jeton `USER` est rejeté à la vérification.
3. **Middleware** (`middleware.ts`) : sur les chemins `isAdminProtectedPath`, exige un JWT admin (ou redirige vers MFA verify si un challenge est présent). Ne relit pas la base. Ne distingue pas SUPER_ADMIN et ADMIN.
4. **Pages et actions** (`requireAdmin` dans `lib/auth/require-admin.ts`) : relit l'utilisateur par `claims.sub` en base. L'autorisation utilise le **rôle et le statut DB**, pas la claim cookie. Échec → cookie effacé + redirect login.
5. **Mutations MFA** (`app/admin/security/mfa/actions.ts`) : `requireAdmin` puis `actor.role !== "SUPER_ADMIN"` → forbidden ; second contrôle `user.role !== "SUPER_ADMIN" || user.id !== actor.id`. Aucun identifiant client n'est accepté.

Il n'existe pas de helper `requireSuperAdmin`. Les contrôles SUPER_ADMIN sont inline sur les trois actions MFA.

`canAccessAdminConsole` n'exige pas la MFA. La MFA est imposée à la **connexion** lorsque `User.mfaEnabled` est vrai. Un ADMIN sans MFA peut accéder à la console si son compte n'est pas enrôlé.

## Accès aux routes `/admin`

Chemins publics : `/admin/login`, `/admin/login/*` (dont `/admin/login/mfa`).

Chemins protégés : `/admin` et tout autre `/admin/*`.

Pages actuelles :

- `/admin` redirige vers `/admin/dashboard` (protection middleware + `requireAdmin` sur le dashboard).
- `/admin/dashboard` : `requireAdmin`.
- `/admin/security/mfa` : `requireAdmin` seulement ; le panneau masque les formulaires si `actor.role !== "SUPER_ADMIN"`.

Aucun handler `app/api` n'est lié à l'admin. La seule route API est le formulaire public de contact.

## Élévation de privilèges

Recherche d'une élévation évidente : **aucune voie applicative trouvée**.

- Pas d'endpoint HTTP ni d'action serveur qui écrit `User.role` ou `User.status`.
- Les schémas Zod de login/MFA n'acceptent pas `role`.
- Les mises à jour Prisma applicatives touchent `lastLoginAt` et les champs MFA du compte session, jamais `role`.
- `scripts/create-admin.ts` crée un `SUPER_ADMIN` en CLI opérateur, hors web.
- Un ADMIN qui ouvre `/admin/security/mfa` voit un message d'interdiction ; les actions refusent côté serveur.
- Un USER ne peut pas obtenir un JWT admin (login + vérificateur JWT).

Risques résiduels (pas une élévation actuelle) :

- Le middleware ne revalide pas le statut DB. Un JWT encore valide après désactivation/démotion peut franchir le middleware jusqu'à `requireAdmin`, qui refuse et efface le cookie.
- La page MFA reste joignable par URL pour un ADMIN (lecture d'un message, pas de mutation).
- `/portal` n'est pas encore protégé (préparé, commenté).
- `types/user.ts` réutilise le nom `UserRole` pour un modèle non persisté : ne pas le confondre avec Prisma.

## Fichiers de contrôle

| Fichier | Rôle |
| --- | --- |
| `prisma/schema.prisma` | Enums `UserRole`, `UserStatus` |
| `lib/auth/admin-access.ts` | `isAdminRole`, `canAccessAdminConsole`, `getAdminAccessDenialReason` |
| `lib/auth/require-admin.ts` | Revalidation DB + redirect |
| `lib/auth/session-token.ts` | JWT admin HS256 |
| `lib/auth/routes.ts` | Classification public / protégé |
| `middleware.ts` | Gate cookie `/admin` |
| `app/admin/actions.ts` | Login / logout |
| `app/admin/security/mfa/actions.ts` | Mutations SUPER_ADMIN soi-même |
| `lib/admin/role-labels.ts` | Libellés FR SUPER_ADMIN / ADMIN |

Voir aussi `docs/ADMIN_MFA.md` pour le flux TOTP.
