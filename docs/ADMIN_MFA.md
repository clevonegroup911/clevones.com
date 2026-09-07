# Authentification multifacteur administrateur

Ce document décrit l'exploitation de la MFA TOTP pour la console `/admin`. Il ne contient aucun secret, aucune clé et aucune commande destructive.

## Architecture

La connexion mot de passe ne crée **pas** de session administrateur lorsque `User.mfaEnabled` est vrai. Le serveur :

1. vérifie e-mail, mot de passe, rôle et statut `ACTIVE` ;
2. refuse toute session tant que le secret MFA est absent ou encore `pending` ;
3. révoque les challenges précédents, crée un enregistrement `MfaChallenge` (cinq minutes, `failureCount` côté base) ;
4. pose un cookie HttpOnly `admin_mfa_challenge` contenant un JWT HS256 (`sub`, `jti`, `iat`, `exp`, `purpose`, `iss`, `aud`, `typ`). Le JWT ne transporte pas `failureCount`.

La page `/admin/login/mfa` relit le cookie, vérifie le JWT, puis recharge le challenge **et** le compte en base. Un JWT encore valide ne restaure pas un challenge consommé, révoqué, expiré ou bloqué.

La validation TOTP ou recovery :

- revérifie rôle, statut et MFA active côté serveur ;
- consomme atomiquement le step TOTP (`lastUsedStep < step`) ou le recovery code (`id + secretId + usedAt null`) ;
- consomme le challenge dans la même transaction ;
- pose ensuite seulement le cookie de session administrateur.

L'enrôlement et la désactivation sont réservés au `SUPER_ADMIN` sur **son propre** compte. Les server actions ignorent tout identifiant client : elles utilisent la session serveur.

## Variables requises

| Variable | Rôle |
| --- | --- |
| `AUTH_SECRET` | HMAC des JWT de session et de challenge, et empreinte des sujets de rate limit. Minimum 32 caractères. |
| `MFA_ENCRYPTION_KEY` | Clé AES-256-GCM / HMAC recovery, 32 octets en Base64 canonique. Obligatoire en production (fail-closed au démarrage Node). |
| `MFA_ISSUER` | Libellé TOTP affiché dans l'application d'authentification. Défaut : `CLEVONES`. |
| `APP_ORIGIN` | Origine canonique des redirections. HTTPS obligatoire en production. |
| `DATABASE_URL` | PostgreSQL applicatif. Ne jamais l'utiliser pour les tests MFA. |
| `TEST_DATABASE_URL` | Uniquement `npm run test:mfa:postgres`. Base locale ou éphémère dont le nom contient `test`, `tmp`, `mfa` ou `t00`. |

Les valeurs réelles restent hors dépôt. `.env.example` ne contient que des valeurs vides ou fictives.

## Génération de `MFA_ENCRYPTION_KEY` hors dépôt

Générer la clé sur un poste d'exploitation, hors Git :

```bash
openssl rand -base64 32
```

Contrôler que la sortie fait 44 caractères, se termine par `=` et ne contient pas d'espace. La coller uniquement dans le secret d'environnement du runtime. Ne jamais la journaliser, la coller dans un ticket ou la committer.

## Enrôlement du SUPER_ADMIN

1. Se connecter avec mot de passe (sans MFA tant que `mfaEnabled` est faux).
2. Ouvrir `/admin/security/mfa`.
3. Confirmer le mot de passe du compte courant.
4. Scanner le QR ou saisir la clé manuelle dans une application TOTP (Google Authenticator, Microsoft Authenticator, ou compatible).
5. Valider un premier code à 6 chiffres **dans les dix minutes**.
6. Enregistrer les codes de récupération affichés : ils ne seront plus renvoyés par le serveur.

Un enrôlement pending expiré ne peut pas être confirmé. Un nouvel enrôlement le remplace transactionnellement. Un secret déjà actif ne peut pas être écrasé par un pending.

Le code TOTP utilisé pour activer la MFA est mémorisé dans `lastUsedStep` et ne peut pas servir ensuite à une connexion.

## Connexion TOTP et recovery

1. E-mail et mot de passe sur `/admin/login`.
2. Redirection vers `/admin/login/mfa` (cookie de challenge, pas de session).
3. Saisir un code TOTP à 6 chiffres **ou** un code de récupération.
4. En cas de succès : session administrateur, cookie de challenge effacé (mêmes attributs).
5. Cinq échecs sur le challenge, ou le plafond persistant user/IP, bloquent les nouvelles tentatives.

Les messages d'erreur restent génériques. Ils ne confirment pas l'existence d'un compte.

## Migration Prisma

Fichier : `prisma/migrations/20260904191500_add_admin_mfa/migration.sql`.

La migration est **additive** : tables `UserMfaSecret`, `MfaChallenge`, `MfaRateLimit`, `MfaRecoveryCode`, index, uniques et cascades. Elle ne supprime ni ne réinitialise les utilisateurs existants. `User.mfaEnabled` reste `false` par défaut.

Cette migration n'a pas été déployée. Elle peut encore être corrigée en place avant le premier `migrate deploy`.

## Sauvegarde obligatoire avant migration

Avant toute application sur un environnement partagé :

1. Prendre une sauvegarde PostgreSQL complète (dump logique ou snapshot disque selon le runbook d'exploitation).
2. Vérifier que la restauration a été testée récemment.
3. Appliquer la migration uniquement après cette sauvegarde.
4. Ne pas exécuter la migration depuis ce dépôt vers la production dans le cadre de cette tâche.

## Tests

Tests unitaires (base mémoire, sans PostgreSQL) :

```bash
npm test
```

Tests PostgreSQL de concurrence, **uniquement** contre `TEST_DATABASE_URL` ou `MFA_TEST_DATABASE_URL` :

```bash
npm run test:mfa:postgres
```

Le runner refuse toute URL absente, distante, ou dont le nom de base ne ressemble pas à un environnement temporaire. Il n'utilise jamais `DATABASE_URL`.

Preuve T002 : les tests de concurrence ont été exécutés sur un PostgreSQL 16 éphémère local (`postgres:16-alpine`, base `t002mfa`, écoute loopback). T003 a constaté que l'image Docker `postgres:16-alpine` est toujours présente (aucun pull), mais que Docker rootless n'expose plus les ports du conteneur vers l'hôte. Les tests PostgreSQL n'ont donc pas été rejoués ici ; la preuve T002 reste valable. Relancer `npm run test:mfa:postgres` dès qu'une `TEST_DATABASE_URL` loopback éphémère est joignable.

## Comportement fail-closed

- Production : absence ou format invalide de `MFA_ENCRYPTION_KEY` → refus au démarrage Node (`instrumentation.ts`).
- JWT challenge : algorithme, `typ`, issuer, audience, `purpose`, `sub`, `jti`, `iat`, `exp` et durée maximale de cinq minutes contrôlés. Échec → pas de challenge.
- Challenge consommé / révoqué / expiré / saturé → pas de session.
- Compte non admin, non `ACTIVE`, ou MFA pending/incohérente → erreur générique.
- `keyVersion` autre que `1` → refus de chiffrement et de déchiffrement.

## Cookies

Cookie `admin_mfa_challenge` :

- HttpOnly
- SameSite=Strict
- Secure en production
- `path=/admin`
- durée alignée sur le TTL restant (max. cinq minutes)

La suppression réécrit le cookie avec les **mêmes** attributs et `maxAge=0`.

## Rotation future de clé

Aujourd'hui seule `keyVersion = 1` est acceptée. Une rotation exigera :

1. une nouvelle clé et un champ de version supplémentaire ;
2. un outil de re-chiffrement hors ligne, hors dépôt public ;
3. une fenêtre de maintenance et un test de restauration.

Jusqu'à cet outil, changer `MFA_ENCRYPTION_KEY` rend illisibles les secrets TOTP existants. Prévoir un ré-enrôlement contrôlé plutôt qu'une rotation improvisée.

## Limites et risques résiduels

- Rate limit en mémoire (processus) en complément du rate limit persistant PostgreSQL : un redémarrage multi-instance s'appuie sur la table `MfaRateLimit`.
- Les codes de récupération et la clé manuelle transitent une fois vers le navigateur du `SUPER_ADMIN` pendant l'enrôlement. Ils ne sont pas journalisés.
- `lib/auth/mfa-memory-db.ts` est un helper de test. Il est interdit en production et refuse de s'importer si `NODE_ENV=production`.
- **P2 — `AuditLog.ipAddress`** : le champ existant continue d'enregistrer l'adresse IP des événements d'audit (connexion, MFA, logout). Accès : lecture réservée aux opérateurs déjà habilités sur la base ou une console d'audit future. Politique de rétention à définir (purge ou anonymisation après une durée limitée). Ce n'est pas un secret MFA, mais une donnée personnelle à minimiser.
- **P2 — `npm audit --omit=dev --audit-level=high`** : des avis high existent sur des dépendances transitives (`nanoid`/`postcss`/`sharp` via `next`, `deepmerge-ts` via Prisma). Aucun `npm audit fix` n'a été appliqué : les correctifs proposés forcent des majeures (`next@16`, `prisma@6.12`) hors périmètre MFA.

## Procédure de désactivation d'urgence

La voie nominale est `/admin/security/mfa` : mot de passe **et** TOTP ou recovery du compte concerné.

Une désactivation hors application (perte totale des facteurs) n'est **pas** documentée ici sous forme de commande. Elle nécessiterait un accès opérateur déjà autorisé, une sauvegarde préalable, et un runbook hors dépôt. Après une telle opération : révoquer les sessions, tourner `AUTH_SECRET` si un cookie a pu fuir, et ré-enrôler le `SUPER_ADMIN` dès que possible.

Ne pas coller de `UPDATE` SQL dans des tickets ou des transcripts.
