# PROJECT_CONTEXT — Clevones.com

Point de reprise versionné. Classer tout fait : **CONFIRMÉ**, **INDIQUÉ**, **PROPOSÉ**, **INCONNU**, **NON_ACCESSIBLE**. Un état historique n’est pas un état revérifié.

## Identité

| Champ | Valeur | Classe |
|---|---|---|
| Projet | clevones.com | CONFIRMÉ |
| Dépôt GitHub | clevonegroup911/clevones.com | CONFIRMÉ |
| Workspace local | branche `feat/x200-agentic-core` (base `origin/feat/x200-boot-autostart` @ `8a203da`) | CONFIRMÉ (session 2026-09-15) |
| HEAD travail | T049 EN_CONTRÔLE — Agent Registry, quality-gate local PASS | CONFIRMÉ registre |
| Produit | site institutionnel Next.js + `/admin` MFA + portail USER + CMS/docs/analytics/paiements sandbox + `/health` + Control Center `/admin/x200` + fondation `lib/agentic` | CONFIRMÉ dans le dépôt |
| Gouvernance | X200 AUTOPLAN + FAST-LANE (alias `x100:*`) | CONFIRMÉ |
| Langues | FR / EN dans le site public | INDIQUÉ par le dépôt |
| Hébergement | VM GCP `clevones-serveur` (`europe-west1-b`), projet `clevonegroup` | INDIQUÉ (`DEPLOYMENT.md`) — non revérifié cette session |
| Production HEAD / PM2 | valeurs historiques `DEPLOYMENT.md` | NON_ACCESSIBLE ici |

## Objectif courant

Poser les fondations P0 de la **CLEVONE Agentic Business Platform** sans reconstruire l’existant. T048 est `TERMINÉE` (CI FULL). T049 = registre d’agents indépendant des fournisseurs (EN_CONTRÔLE). T050/T051 restent `À_FAIRE`. Les rails live, merge `main` et deploy restent des gates humaines.

## Stack (CONFIRMÉ dans le dépôt)

- Next.js 15, React 19, TypeScript 5.8, Tailwind 4, Prisma 6, PostgreSQL, Zod, Playwright
- Node `>=20.9.0`, npm
- Scripts gouvernance : `scripts/*.mjs` et `scripts/lib/`
- Control Center : `lib/x200/*`, `/admin/x200`, télémétrie Fedora `.x200/telemetry.json`
- Agentic core : `lib/agentic/*` (T049)

## Authentification et rôles (CONFIRMÉ dans le code)

- Rôles Prisma : `SUPER_ADMIN`, `ADMIN`, `USER`
- MFA TOTP + recovery admin ; cookie challenge distinct de `admin_session`
- Portail USER : `/sign-in` → `portal_session` ; `/sign-out` efface seulement le cookie portail (T033, T036)
- Gestion users + DocumentGrant admin (T034) ; e2e ACL (T037)
- Matrice : `docs/ROLES_AND_PERMISSIONS.md`

## Gouvernance — état au 2026-09-15

| ID | État | Classe |
|---|---|---|
| T001–T047 | `TERMINÉE` | CONFIRMÉ registre |
| T048 | `TERMINÉE` Boot Orchestrator — CI FULL run 34962261158 / `206cd31` | CONFIRMÉ registre |
| T049 | `EN_CONTRÔLE` Agent Registry — quality-gate local PASS ; attendre `quality` CI | CONFIRMÉ registre |
| T050 | `À_FAIRE` Domain event envelope | CONFIRMÉ registre |
| T051 | `À_FAIRE` Agent audit + policy reuse | CONFIRMÉ registre |
| Relais ChatGPT | absent | CONFIRMÉ |
| Production | non accédée cette session | NON_ACCESSIBLE |

Gap analysis : `docs/architecture/CLEVONE-AGENTIC-GAP-ANALYSIS.md`.

Preuves CI récentes (CONFIRMÉ) :

- T045 FULL quality SUCCESS `42fecbe` / run [34771780343](https://github.com/clevonegroup911/clevones.com/actions/runs/34771780343)
- T046 FULL quality SUCCESS `49d0c36` / run [34775412790](https://github.com/clevonegroup911/clevones.com/actions/runs/34775412790) ; draft PR [#10](https://github.com/clevonegroup911/clevones.com/pull/10)
- T047 FULL quality SUCCESS `7de8fd1` / run [34782004736](https://github.com/clevonegroup911/clevones.com/actions/runs/34782004736) ; recovery tip `8c873db` / run [34782911788](https://github.com/clevonegroup911/clevones.com/actions/runs/34782911788) ; draft PR [#11](https://github.com/clevonegroup911/clevones.com/pull/11)
- T048 FULL quality SUCCESS `206cd31` / run [34962261158](https://github.com/clevonegroup911/clevones.com/actions/runs/34962261158) ; draft PR [#12](https://github.com/clevonegroup911/clevones.com/pull/12)

## Écarts restants vs PRODUCT_GOAL

Critères 1–20 : écarts restants = **gates humaines / externes** (inchangé).
Critères 21–25 (agentic) : T049 EN_CONTRÔLE ; T050/T051 ensuite ; P2 agents métier plus tard.

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
| Agentic | `lib/agentic` (T049) — pas d’appel provider |
| Production | hors périmètre automatique |

## Interdit

Secrets dans Git, push `main`, merge automatique, déploiement automatique, API payante, reset destructeur, tâches de remplissage, rejeu d’une `TERMINÉE` encore valable, `PRODUCT_COMPLETE` prématuré (head/goalHash non alignés, preuves vides, ou claim merge/deploy/PSP live).
