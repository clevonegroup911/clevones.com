# Secrets — inventaire et architecture (T010)

Aucun secret réel n’est écrit dans ce fichier. Uniquement des **noms**, des **types d’emplacement** et une architecture cible.

Classe de vérité : **CONFIRMÉ** = observé dans le dépôt cette session ; **INDIQUÉ** = documenté ailleurs, non revérifié ; **PROPOSÉ** = cible ; **NON_ACCESSIBLE** = production / valeurs.

## Inventaire (noms seulement)

| SECRET_NAME | LOCATION_TYPE | USED_BY | ENVIRONMENT | ROTATION_REQUIRED | TARGET_STORAGE |
|---|---|---|---|---|---|
| DATABASE_URL | gitignored local `.env` (absent ici) ; production VM `.env` (INDIQUÉ, T004/T005) | Next.js, Prisma | local / production | à déterminer (nouvelle autorisation) | Secret Manager |
| AUTH_SECRET | gitignored `.env` ; VM `.env` (INDIQUÉ) | session JWT, challenge MFA, rate-limit | local / production | à déterminer (invalide les sessions) | Secret Manager |
| MFA_ENCRYPTION_KEY | gitignored `.env` ; VM `.env` (INDIQUÉ) | TOTP at rest, recovery HMAC | local / production | à déterminer (ré-enrôlement, pas de dual-key) | Secret Manager |
| MFA_ISSUER | `.env.example` + env optionnel | libellé TOTP | tous | non (pas un secret) | config, pas Secret Manager |
| APP_ORIGIN | `.env.example` | middleware redirects | production requis | non (URL publique) | config, pas Secret Manager |
| AUTH_SESSION_TTL_SECONDS | optionnel, pas un secret | cookie session | tous | non | config |
| TEST_DATABASE_URL | gitignored `.env` local / CI service Postgres | tests MFA PostgreSQL | test seulement | n/a | jamais Secret Manager prod |
| MFA_TEST_DATABASE_URL | alias de test | tests MFA PostgreSQL | test seulement | n/a | jamais Secret Manager prod |
| PLAYWRIGHT_DATABASE_URL | env e2e / Docker éphémère | Playwright | test seulement | n/a | jamais Secret Manager prod |
| ALLOW_ADMIN_CREATE_IN_PRODUCTION | drapeau, pas un secret | `scripts/create-admin.ts` | production seulement si owner | n/a | config |
| GITHUB_TOKEN | GitHub Actions `github.token` par défaut | commentaire `[X100-CI]` | CI | géré par GitHub | pas applicatif |
| X200_CLAIM_TOKEN / X200_WORKER_ID | env local exécutant | réservation backlog | local | n/a | hors Git, pas Secret Manager prod |

### Absents du dépôt (CONFIRMÉ : aucun usage applicatif)

SMTP credentials, email provider keys, API keys payantes, webhooks, clés de paiement, `GOOGLE_APPLICATION_CREDENTIALS`, `OPENAI_API_KEY`.

Sauvegardes PostgreSQL (T004) : compte système `postgres` sur la VM, **sans** lecture de `.env` applicatif. Hors périmètre Secret Manager applicatif.

## Fixtures suivies par Git (pas des secrets d’exploitation)

Le workflow CI et les tests e2e portent des **valeurs factices** documentées (`ci_user` / `ci_pass` / secrets `ci-only-*`). Elles ne sont pas la production. `npm run x200:scan-secrets` les classe en `FIXTURE`, jamais en HIT bloquant.

## État Git (CONFIRMÉ cette session)

- `.env` : gitignoré, **non suivi**, **absent** du workspace local
- `.env.example` : suivi, placeholders seulement
- aucun `.pem`, `credentials.json`, `service-account*.json`, Dockerfile/image
- dumps `*.dump` gitignorés

`SECRETS_IN_GIT` (valeurs d’exploitation) : **NO**

## Architecture actuelle (INDIQUÉ)

```
opérateur humain
  → fichier `.env` gitignoré sur la VM `/home/clevones/apps/clevones.com`
  → process PM2 `clevones-com` (Node / Next.js)
```

La production n’a pas été accédée pour T010. Les chemins VM viennent de `DEPLOYMENT.md` (T004/T005).

## Architecture cible (PROPOSÉ)

Projet GCP `clevonegroup` (INDIQUÉ). Stockage central : **Google Cloud Secret Manager**.

```
Secret Manager (secrets nommés, versions)
  → compte de service de la VM seulement (secretAccessor)
  → récupération contrôlée au démarrage (tmpfs ou injection)
  → processus applicatif
```

Secrets à créer **plus tard**, une fois une autorisation de mutation runtime obtenue :

- `clevones-database-url`
- `clevones-auth-secret`
- `clevones-mfa-encryption-key`

Non candidates Secret Manager : `APP_ORIGIN`, `MFA_ISSUER`, TTL, drapeaux, URLs de test.

## Moindre privilège (revue documentaire : PASS)

| Identité | Accès proposé | Interdit |
|---|---|---|
| SA runtime VM | `secretmanager.secretAccessor` sur les 3 secrets ci-dessus | `secretAdmin`, IAM étendu, autres secrets |
| CI GitHub Actions | `contents: read` ; job commentaire `pull-requests: write` | Secret Manager, secrets applicatifs, `GITHUB_TOKEN` élargi |
| Poste développeur | `.env` local gitignoré + `.env.example` | valeurs de production |
| Images / dépôt | aucun secret | `.env`, clés JSON, PEM |

T010 **n’applique pas** ces IAM. Revue de l’intention seulement. IAM live : **NON_ACCESSIBLE**.

## Rotation (NOT_READY)

Ordre documenté, **non exécuté** :

1. Sauvegarde PostgreSQL (T004 ; plan T011 dans `docs/BACKUPS.md`, timer non activé) avant toute rotation `DATABASE_URL`.
2. Nouvelle version Secret Manager ; ne pas détruire l’ancienne tant que le runtime n’a pas basculé.
3. `AUTH_SECRET` : toutes les sessions admin deviennent invalides.
4. `MFA_ENCRYPTION_KEY` : `MFA_SECRET_KEY_VERSION` est encore à `1` sans dual-key ; une rotation impose un ré-enrôlement contrôlé (`docs/ADMIN_MFA.md`).
5. Révoquer l’ancienne version seulement après preuve de santé.

Toute bascule runtime, `gcloud secrets`, redémarrage PM2 ou remplacement de `.env` VM exige une **nouvelle** autorisation propriétaire.

## Contrôle

```bash
npm run x200:scan-secrets
```

Sortie : `SCAN_SECRETS_OK` ou `HIT pattern=… file=… line=…` **sans** la valeur.

## Hors dépôt

Les **valeurs** restent hors Git (critère T010). Ce document décrit les types d’emplacement, pas le contenu.
