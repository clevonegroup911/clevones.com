# PROJECT_CONTEXT — Clevones.com

Point de reprise versionné. Classer tout fait : **CONFIRMÉ**, **INDIQUÉ**, **PROPOSÉ**, **INCONNU**, **NON ACCESSIBLE**. Un état historique n’est pas un état revérifié.

## Identité

| Champ | Valeur | Classe |
|---|---|---|
| Projet | clevones.com | CONFIRMÉ |
| Dépôt GitHub | clevonegroup911/clevones.com | CONFIRMÉ |
| Workspace local | branche `admin-mfa`, remote `origin` | CONFIRMÉ (session 2026-09-09) |
| Produit | site institutionnel Next.js + back-office `/admin` + MFA TOTP | CONFIRMÉ |
| Gouvernance | X200 v2.0 (alias commandes X100) | CONFIRMÉ |
| Langues | FR / EN dans le site public | INDIQUÉ par le dépôt (routes et copies) |
| Hébergement | VM Google Cloud Compute Engine `clevones-serveur` (`europe-west1-b`), projet GCP `clevonegroup` | INDIQUÉ (`DEPLOYMENT.md`, T004/T005) — non revérifié cette session |
| Production HEAD / PM2 | valeurs T005 dans `DEPLOYMENT.md` | INDIQUÉ historique — NON ACCESSIBLE ici |

## Objectif courant

Poursuivre le durcissement admin et la gouvernance sans rejouer T001–T016, sans fusion `main` et sans déploiement automatique.

## Stack (CONFIRMÉ dans le dépôt)

- Next.js 15, React 19, TypeScript 5.8, Tailwind 4, Prisma 6, PostgreSQL, Zod, Playwright
- Node `>=20.9.0`, npm, pas de dépendance Codex
- Scripts gouvernance : `scripts/*.mjs` et `scripts/lib/`

## Authentification et rôles (CONFIRMÉ dans le code)

- Rôles Prisma : `SUPER_ADMIN`, `ADMIN`, `USER`
- MFA TOTP + recovery, cookie challenge distinct de la session
- Matrice : `docs/ROLES_AND_PERMISSIONS.md`

## Gouvernance — état au 2026-09-09

| ID | État | Classe |
|---|---|---|
| T001–T009, T013, T016 | `TERMINÉE` avec preuves dans `backlog.json` | CONFIRMÉ dans le registre |
| T012 | CI run 34242618994 **success** sur `4ea9f74277318bc41c7817c3cab405e4ee7f0043`, commentaire `[X100-CI]` | CONFIRMÉ via `gh` cette session ; clôture registre = T017 |
| T010, T011 | `À_FAIRE`, `requiresHuman: true` | CONFIRMÉ |
| T014, T015 | `À_FAIRE` (dépendances T013 `TERMINÉE`) | CONFIRMÉ ; non promues `PRÊTE` |
| T017 | `EN_CONTRÔLE` après quality-gate local ; attente `[X100-CI]` | CONFIRMÉ cette session |
| Relais ChatGPT | absent | CONFIRMÉ non configuré (aucun webhook, aucune API) |
| Production | non accédée cette session | NON ACCESSIBLE |

## Reprise

```bash
git status
npm run x200:doctor
npm run x200:validate
npm run x200:resume -- --json
npm run x200:next -- --json
```

Si `IN_CONTROL_WAIT` : attendre `[X100-CI]`, ne pas démarrer une autre tâche.

Exécutant : **single-executor**. Un fichier JSON local ne coordonne pas plusieurs machines.

## Intégration

| Couche | État |
|---|---|
| Local | commandes `x200:*` / alias `x100:*` |
| CI GitHub | workflow `.github/workflows/ci.yml` (nom historique X100 CI), commentaire `[X100-CI]` |
| Relais ChatGPT | NON CONFIGURÉ — un événement GitHub ne réveille pas une conversation |
| Production | hors périmètre automatique |

## Interdit

Secrets dans Git, push `main`, merge automatique, déploiement automatique, API payante, reset destructeur, 200 tâches artificielles, rejeu d’une `TERMINÉE` encore valable.
