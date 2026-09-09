# PROJECT_CONTEXT — Clevones.com

Point de reprise versionné. Classer tout fait : **CONFIRMÉ**, **INDIQUÉ**, **PROPOSÉ**, **INCONNU**, **NON_ACCESSIBLE**. Un état historique n’est pas un état revérifié.

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
| Production HEAD / PM2 | valeurs T005 dans `DEPLOYMENT.md` | INDIQUÉ historique — NON_ACCESSIBLE ici |

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
| T012 | CI run 34242618994 **success** ; clôturée avec T017 | CONFIRMÉ |
| T017 | `TERMINÉE` après CI run #18 puis #19 SUCCESS sur `4345b39` | CONFIRMÉ |
| T010 | `TERMINÉE` après CI run #20/#21 ; `requiresHuman: true` conservé | CONFIRMÉ |
| T011 | `EN_CONTRÔLE` après `[X200-OWNER-AUTH]` (5594283429) ; templates/docs/tests hors prod ; timer production non activé | CONFIRMÉ cette session |
| T014 | `TERMINÉE` inventaire CMS (`docs/CMS_AND_DOCUMENTS.md`) | CONFIRMÉ |
| T015 | `TERMINÉE` analytics/paiements (`docs/ANALYTICS_AND_PAYMENTS.md`) | CONFIRMÉ |
| Relais ChatGPT | absent | CONFIRMÉ non configuré (aucun webhook, aucune API) |
| Production | non accédée cette session | NON_ACCESSIBLE |

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
| Local | commandes `x100:*` (contrat) + alias `x200:*` |
| CI GitHub | workflow `.github/workflows/ci.yml` (nom historique X100 CI), commentaire `[X100-CI]` |
| Relais ChatGPT | NON CONFIGURÉ — un événement GitHub ne réveille pas une conversation |
| Gouvernance | `docs/X200_GOVERNANCE.md` |
| Production | hors périmètre automatique |

## Interdit

Secrets dans Git, push `main`, merge automatique, déploiement automatique, API payante, reset destructeur, 200 tâches artificielles, rejeu d’une `TERMINÉE` encore valable.
