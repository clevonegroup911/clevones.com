# PROJECT_CONTEXT — Clevones.com

Point de reprise versionné. Classer tout fait : **CONFIRMÉ**, **INDIQUÉ**, **PROPOSÉ**, **INCONNU**, **NON_ACCESSIBLE**. Un état historique n’est pas un état revérifié.

## Identité

| Champ | Valeur | Classe |
|---|---|---|
| Projet | clevones.com | CONFIRMÉ |
| Dépôt GitHub | clevonegroup911/clevones.com | CONFIRMÉ |
| Workspace local | branche `autoplan/payments-recovery-20260912`, remote `origin` | CONFIRMÉ (session 2026-09-12) |
| HEAD travail T033 | `e363418dde59f5a52fcebe4bcd1509bb2e7574c0` (auth portail USER) | CONFIRMÉ |
| Produit | site institutionnel Next.js + `/admin` MFA + portail USER + CMS/docs/analytics/paiements sandbox | CONFIRMÉ dans le dépôt |
| Gouvernance | X200 AUTOPLAN + FAST-LANE (alias `x100:*`) | CONFIRMÉ |
| Langues | FR / EN dans le site public | INDIQUÉ par le dépôt |
| Hébergement | VM GCP `clevones-serveur` (`europe-west1-b`), projet `clevonegroup` | INDIQUÉ (`DEPLOYMENT.md`) — non revérifié cette session |
| Production HEAD / PM2 | valeurs historiques `DEPLOYMENT.md` | NON_ACCESSIBLE ici |

## Objectif courant

Poursuivre le produit vers `PRODUCT_GOAL.md` sans rejouer les tâches `TERMINÉE` encore valides, sans fusion `main` automatique et sans déploiement automatique.

## Stack (CONFIRMÉ dans le dépôt)

- Next.js 15, React 19, TypeScript 5.8, Tailwind 4, Prisma 6, PostgreSQL, Zod, Playwright
- Node `>=20.9.0`, npm
- Scripts gouvernance : `scripts/*.mjs` et `scripts/lib/`

## Authentification et rôles (CONFIRMÉ dans le code)

- Rôles Prisma : `SUPER_ADMIN`, `ADMIN`, `USER`
- MFA TOTP + recovery admin ; cookie challenge distinct de `admin_session`
- Portail USER : `/sign-in` → `portal_session` (T033, CI en contrôle)
- Matrice : `docs/ROLES_AND_PERMISSIONS.md`

## Gouvernance — état au 2026-09-12

| ID | État | Classe |
|---|---|---|
| T001–T010, T012–T032 | `TERMINÉE` avec preuves dans `backlog.json` (sauf notes humaines) | CONFIRMÉ registre |
| T011 | backups préparés ; timer prod **non activé** (gate) | CONFIRMÉ docs |
| T033 | `TERMINÉE` — auth USER portail ; quality SUCCESS `e363418` / run 34715775346 | CONFIRMÉ |
| T034 | `PRÊTE` — users + DocumentGrant admin (dépend T033 satisfaite) | CONFIRMÉ |
| T035 | `EN_CONTRÔLE` — resync inventaires docs | CONFIRMÉ cette session |
| Relais ChatGPT | absent | CONFIRMÉ |
| Production | non accédée cette session | NON_ACCESSIBLE |
| PRODUCT_COMPLETE | **absent / invalide** tant que T033/T034 ou gates restent | CONFIRMÉ règle X200 |

## Écarts restants vs PRODUCT_GOAL

- T033/T034 : rôles USER opérationnels bout-en-bout (auth faite ; mgmt/grants à faire)
- Gates humaines : SMTP réel, PSP live, alertes GCP, merge/deploy, migrations prod, MFA prod
- Inventaires T014/T015 historiques → resync T035

## Reprise

```bash
git status
npm run x200:doctor
npm run x200:validate
npm run x200:resume -- --json
npm run x200:next -- --json
```

Exécutant : **single-executor**. Un fichier JSON local ne coordonne pas plusieurs machines.

## Intégration

| Couche | État |
|---|---|
| Local | commandes `x200:*` (préférées) + `x100:*` (compat) |
| CI GitHub | workflow `.github/workflows/ci.yml`, job requis `quality` |
| Relais ChatGPT | NON CONFIGURÉ |
| Gouvernance | `docs/X200_GOVERNANCE.md` / `docs/X200_AUTOPILOT.md` |
| Production | hors périmètre automatique |

## Interdit

Secrets dans Git, push `main`, merge automatique, déploiement automatique, API payante, reset destructeur, tâches de remplissage, rejeu d’une `TERMINÉE` encore valable, `PRODUCT_COMPLETE` prématuré.
