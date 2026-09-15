# PROJECT_CONTEXT — Clevones.com

Point de reprise versionné. Classer tout fait : **CONFIRMÉ**, **INDIQUÉ**, **PROPOSÉ**, **INCONNU**, **NON_ACCESSIBLE**. Un état historique n’est pas un état revérifié.

## Identité

| Champ | Valeur | Classe |
|---|---|---|
| Projet | clevones.com | CONFIRMÉ |
| Dépôt GitHub | clevonegroup911/clevones.com | CONFIRMÉ |
| Workspace local | branche `feat/x200-agentic-core` | CONFIRMÉ (session 2026-09-15) |
| HEAD travail | T053 EN_CONTRÔLE — Finance vertical slice ; T052 TERMINÉE | CONFIRMÉ |
| Produit | site institutionnel Next.js + `/admin` MFA + portail USER + CMS/docs/analytics/paiements sandbox + `/health` + Control Center `/admin/x200` + fondation `lib/agentic` | CONFIRMÉ dans le dépôt |
| Gouvernance | X200 AUTOPLAN + FAST-LANE (alias `x100:*`) | CONFIRMÉ |
| Langues | FR / EN dans le site public | INDIQUÉ par le dépôt |
| Hébergement | VM GCP `clevones-serveur` (`europe-west1-b`), projet `clevonegroup` | INDIQUÉ (`DEPLOYMENT.md`) — non revérifié cette session |
| Production HEAD / PM2 | valeurs historiques `DEPLOYMENT.md` | NON_ACCESSIBLE ici |

## Objectif courant

Fondations agentic T049–T052 `TERMINÉE`. T053 Finance vertical slice `EN_CONTRÔLE`. Rails live, merge `main` et deploy restent des gates humaines.

## Stack (CONFIRMÉ dans le dépôt)

- Next.js 15, React 19, TypeScript 5.8, Tailwind 4, Prisma 6, PostgreSQL, Zod, Playwright
- Node `>=20.9.0`, npm
- Scripts gouvernance : `scripts/*.mjs` et `scripts/lib/`
- Control Center : `lib/x200/*`, `/admin/x200`, télémétrie Fedora `.x200/telemetry.json`
- Agentic core : `lib/agentic/*` (registry, events, tools, audit)

## Authentification et rôles (CONFIRMÉ dans le code)

- Rôles Prisma : `SUPER_ADMIN`, `ADMIN`, `USER`
- MFA TOTP + recovery admin ; cookie challenge distinct de `admin_session`
- Portail USER : `/sign-in` → `portal_session` ; `/sign-out` efface seulement le cookie portail (T033, T036)
- Gestion users + DocumentGrant admin (T034) ; e2e ACL (T037)
- Matrice : `docs/ROLES_AND_PERMISSIONS.md`

## Gouvernance — état au 2026-09-15

| ID | État | Classe |
|---|---|---|
| T001–T052 | `TERMINÉE` | CONFIRMÉ registre |
| T053 | `EN_CONTRÔLE` Finance vertical slice — quality-gate local PASS | CONFIRMÉ registre |
| Relais ChatGPT | absent | CONFIRMÉ |
| Production | non accédée cette session | NON_ACCESSIBLE |
| Draft PR | [#13](https://github.com/clevonegroup911/clevones.com/pull/13) | CONFIRMÉ |

Gap analysis : `docs/architecture/CLEVONE-AGENTIC-GAP-ANALYSIS.md`.

Preuves CI récentes (CONFIRMÉ) :

- T049 quality SUCCESS `2d5e38d` / run [34965983633](https://github.com/clevonegroup911/clevones.com/actions/runs/34965983633)
- T050 quality SUCCESS `280ccbc` / run [34967009299](https://github.com/clevonegroup911/clevones.com/actions/runs/34967009299)
- T051 FULL quality SUCCESS `3cd3d38` / run [34970081544](https://github.com/clevonegroup911/clevones.com/actions/runs/34970081544)

## Écarts restants vs PRODUCT_GOAL

Critères 1–20 : écarts restants = **gates humaines / externes** (inchangé).
Critères 21–22, 24 partiel, 25 : fondations registry/events/policy posées.
Écart automatique utile restant : exécuteur Tool Gateway in-process (LOW) + vertical slice finance recommendation (pas de payout).

### Gates humaines / externes (obligatoires hors auto)

| Gate | Note |
|---|---|
| SMTP réel | Console/mémoire seulement ; pas de provider SMTP dans le dépôt |
| PSP live (M-PESA / RAWBANK / Stripe) | Gateway sandbox complète ; pas de webhooks/clés réseau |
| Alertes GCP / uptime | Documentées ; non provisionnées |
| Timer backup production | Unités `ops/systemd/` préparées ; **non activées** |
| Merge `main` / PR ready | Pas de merge auto |
| Deploy + migrations production | Migrations CI/éphémères seulement |
| MFA / secrets production | Enrollment et `.env` VM = gate |
| SMS | Seulement si canal réel autorisé |

## Reprise

```bash
git status
npm run x200:doctor
npm run x200:validate
npm run x200:resume -- --json
npm run x200:next -- --json
```

Exécutant : **single-executor**. Un fichier JSON local ne coordonne pas plusieurs machines. Télémétrie Autopilot : `.x200/telemetry.json` (mode `0600`).

## Intégration

| Couche | État |
|---|---|
| Local | commandes `x200:*` (préférées) + `x100:*` (compat) |
| CI GitHub | workflow `.github/workflows/ci.yml`, job requis `quality` |
| Relais ChatGPT | NON CONFIGURÉ |
| Gouvernance | `docs/X200_GOVERNANCE.md` / `docs/X200_AUTOPILOT.md` |
| Observabilité | `/admin/x200` + télémétrie Fedora (T042/T043) |
| Agentic | `lib/agentic` T049–T051 — pas d’appel provider live |
| Production | hors périmètre automatique |

## Interdit

Secrets dans Git, push `main`, merge automatique, déploiement automatique, API payante, reset destructeur, tâches de remplissage, rejeu d’une `TERMINÉE` encore valable, `PRODUCT_COMPLETE` prématuré (head/goalHash non alignés, preuves vides, ou claim merge/deploy/PSP live).
