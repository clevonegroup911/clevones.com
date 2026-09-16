# PROJECT_CONTEXT — Clevones.com

Point de reprise versionné. Classer tout fait : **CONFIRMÉ**, **INDIQUÉ**, **PROPOSÉ**, **INCONNU**, **NON_ACCESSIBLE**. Un état historique n’est pas un état revérifié.

## Identité

| Champ | Valeur | Classe |
|---|---|---|
| Projet | clevones.com | CONFIRMÉ |
| Dépôt GitHub | clevonegroup911/clevones.com | CONFIRMÉ |
| Workspace local | branche `feat/x200-agentic-core` (intégrée sur `feat/x200-boot-autostart`) | CONFIRMÉ (session 2026-09-16) |
| HEAD travail | résolution conflits PR #13 — Control Center T049 + agentic T065–T080 `TERMINÉE` | CONFIRMÉ |
| Produit | site institutionnel Next.js + `/admin` MFA + portail USER + CMS/docs/analytics/paiements sandbox + `/health` + Control Center `/admin/x200` (interactif T049) + fondation `lib/agentic` (T065–T080) | CONFIRMÉ dans le dépôt |
| Gouvernance | X200 AUTOPLAN + FAST-LANE (alias `x100:*`) | CONFIRMÉ |
| Langues | FR / EN dans le site public | INDIQUÉ par le dépôt |
| Hébergement | VM GCP `clevones-serveur` (`europe-west1-b`), projet `clevonegroup` | INDIQUÉ (`DEPLOYMENT.md`) — non revérifié cette session |
| Production HEAD / PM2 | valeurs historiques `DEPLOYMENT.md` | NON_ACCESSIBLE ici |

## Objectif courant

T001–T049 (incl. Control Center interactif) et fondations agentiques T065–T080 `TERMINÉE` sur la branche de travail. Aucune tâche automatique `PRÊTE`. Rails live, merge `main` et deploy restent des gates humaines. Marqueur `.x200/PRODUCT_COMPLETE.json` éventuel doit être réaligné après le SHA post-rebase.

## Stack (CONFIRMÉ dans le dépôt)

- Next.js 15, React 19, TypeScript 5.8, Tailwind 4, Prisma 6, PostgreSQL, Zod, Playwright
- Node `>=20.9.0`, npm
- Scripts gouvernance : `scripts/*.mjs` et `scripts/lib/`
- Control Center : `lib/x200/*`, `/admin/x200`, télémétrie Fedora `.x200/telemetry.json`
- Agentic core : `lib/agentic/*` (registry, events, tools, audit, finance-slice, orchestrator)

## Authentification et rôles (CONFIRMÉ dans le code)

- Rôles Prisma : `SUPER_ADMIN`, `ADMIN`, `USER`
- MFA TOTP + recovery admin ; cookie challenge distinct de `admin_session`
- Portail USER : `/sign-in` → `portal_session` ; `/sign-out` efface seulement le cookie portail (T033, T036)
- Gestion users + DocumentGrant admin (T034) ; e2e ACL (T037)
- Matrice : `docs/ROLES_AND_PERMISSIONS.md`

## Gouvernance — état au 2026-09-16

| ID | État | Classe |
|---|---|---|
| T001–T048 | `TERMINÉE` | CONFIRMÉ registre |
| T049 | `TERMINÉE` Control Center fully interactive | CONFIRMÉ registre |
| T065–T080 | `TERMINÉE` fondations agentic (ex-T049–T064 renumérotées) | CONFIRMÉ registre |
| Relais ChatGPT | absent | CONFIRMÉ |
| Production | non accédée cette session | NON_ACCESSIBLE |
| Draft PR | [#13](https://github.com/clevonegroup911/clevones.com/pull/13) | CONFIRMÉ |

Gap analysis : `docs/architecture/CLEVONE-AGENTIC-GAP-ANALYSIS.md`.

Mapping IDs (CONFIRMÉ session conflit) :

| Ancien (agentic) | Nouveau |
|---|---|
| T049–T064 | T065–T080 |

Preuves CI historiques utiles (CONFIRMÉ) :

- T049 Control Center FULL `53e2ec7` / run [34989022886](https://github.com/clevonegroup911/clevones.com/actions/runs/34989022886)
- Agentic pre-rebase tip `469988a` FULL quality / run [35069306718](https://github.com/clevonegroup911/clevones.com/actions/runs/35069306718)
- Recovery : tag `recovery/pr13-pre-conflict-resolve-469988a`

## Écarts restants vs PRODUCT_GOAL

Critères 1–20 : écarts restants = **gates humaines / externes** (inchangé).
Critères 21–25 : fondations agentic présentes en dépôt (registry → gateway → orchestrator → agents → journal → outcomes → hook recommend-only).

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
| Observabilité | `/admin/x200` + télémétrie Fedora (T042/T043) + panels agentic |
| Agentic | `lib/agentic` T065–T080 — pas d’appel provider live |
| Production | hors périmètre automatique |

## Interdit

Secrets dans Git, push `main`, merge automatique, déploiement automatique, API payante, reset destructeur, tâches de remplissage, rejeu d’une `TERMINÉE` encore valable, `PRODUCT_COMPLETE` prématuré (head/goalHash non alignés, preuves vides, ou claim merge/deploy/PSP live).
