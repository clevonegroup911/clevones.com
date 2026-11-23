# Correctifs npm audit — 2026-11-23

Branche `chore/deps-audit`, créée depuis `main` @ `56ee6be`, séparée de la refonte du site (PR #16). **Non poussée.**

## Contexte

Le job CI `quality` de la PR #16 échouait sur `audit` à cause d'avis de sécurité publiés sur des dépendances existantes (le lockfile de la PR était identique à `main`).

## Correctifs (commit `362f497`)

| Paquet | Avant | Après | Moyen |
|---|---|---|---|
| next | 15.5.25 | 15.5.29 | `npm audit fix` (dans la plage `^15.5.25`) — avis critiques |
| zod | 4.4.3 | 4.6.7 | `npm audit fix` (dans la plage `^4.4.3`) |
| sharp | 0.35.4 | 0.35.5 | `overrides` |
| effect | 3.21.0 | 3.22.5 | `overrides` `^3.22.5` — GHSA-7589-6FVF-X4PW |
| transitifs | — | — | browserslist, brace-expansion, js-yaml, minimatch, source-map-js, @typescript-eslint/*, baseline-browser-mapping |

Pas de migration Prisma 7 (tâche séparée T085, non exécutée). **Aucun ajout à l'allowlist d'audit** : l'override `effect` suffit, `DECISIONS.md` inchangé. L'allowlist existante (GHSA-GGR8-5VV4-36MX, chaîne Prisma) est inchangée.

## `npm ls effect`

```
clevones-com@0.1.0
└─┬ prisma@6.19.3
  └─┬ @prisma/config@6.19.3
    └── effect@3.22.5 overridden
```

Aucune version ≤ 3.22.0 ne reste.

## effect à l'exécution ?

Non. `effect` n'est tiré que par `prisma` (CLI, `devDependencies`) → `@prisma/config`. `@prisma/client` n'a aucune dépendance, aucun code applicatif n'importe `effect` ni `@prisma/config`, et 0 des 85 fichiers de trace Next.js (`.next/**/*.nft.json`) ni aucun fichier de `.next/server` ne référence `effect`.

## Contrôles (après `npm ci` propre)

| Commande | Résultat |
|---|---|
| `npm ci` | exit 0 (462 paquets) |
| `npx prisma generate` | exit 0 |
| `npm run lint` | exit 0 — aucun avertissement |
| `npx tsc --noEmit` | exit 0 |
| `npm test` | exit 0 — 192/192 |
| `npm run build` | exit 0 |
| `npx playwright test tests/e2e/product-surfaces.spec.ts` | exit 0 — 6/6 (desktop + mobile, PostgreSQL 16 éphémère local) |
| `node scripts/ci-audit.mjs` | `AUDIT PASS allowlist=GHSA-GGR8-5VV4-36MX` |

## Second échec CI : `x100_tests` (corrigé, décision propriétaire du 2026-11-23)

Cause confirmée localement : le runner GitHub est passé à ubuntu-26.04 (clients PostgreSQL 18) alors que le service CI est `postgres:16-alpine`. `pg_dump` 18 écrit `SET transaction_timeout = 0;`, refusé par un serveur 16 à la restauration :

```
pg_restore: error: could not execute query: ERROR:  unrecognized configuration parameter "transaction_timeout"
```

Le test `scripts/backup-postgres.test.mjs` (« off-production dump, checksum, list and temporary restore ») échoue donc en CI ; il est ignoré en local faute de serveur. Décision du propriétaire : passer le service CI à `postgres:18-alpine` (`.github/workflows/ci.yml`), aligné sur les clients 18 du runner. Seule la base éphémère de CI change ; la version PostgreSQL de production n'est pas documentée dans le dépôt et n'est pas modifiée.

Vérification locale avec un serveur `postgres:18-alpine` éphémère (réseau hôte, port 55441, identifiants CI, arrêté ensuite) et `pg_dump` 18.6 :

| Commande | Résultat |
|---|---|
| `node --test scripts/backup-postgres.test.mjs` | 6/6, 0 ignoré (dump, checksum, liste et restauration temporaire réussis) |
| `npm run x100:test` | 75/75 |
| `npx prisma migrate deploy` | toutes les migrations appliquées (base CI éphémère) |
| `npm run test:mfa:postgres` | 8/8, 0 ignoré |

Non vérifié avant push : le job `quality` réel sur GitHub.
