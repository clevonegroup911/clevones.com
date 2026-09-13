# PROJECT_CONTEXT — Clevones.com

Point de reprise versionné. Classer tout fait : **CONFIRMÉ**, **INDIQUÉ**, **PROPOSÉ**, **INCONNU**, **NON_ACCESSIBLE**. Un état historique n’est pas un état revérifié.

## Identité

| Champ | Valeur | Classe |
|---|---|---|
| Projet | clevones.com | CONFIRMÉ |
| Dépôt GitHub | clevonegroup911/clevones.com | CONFIRMÉ |
| Workspace local | branche `feat/x200-control-center`, remote `origin` | CONFIRMÉ (session 2026-09-13) |
| HEAD travail | `d68ddf8a731ebfee6086fc83c0c9f8e2f691ab1d` (T044 TERMINÉE + PRODUCT_COMPLETE) | CONFIRMÉ |
| Produit | site institutionnel Next.js + `/admin` MFA + portail USER + CMS/docs/analytics/paiements sandbox + `/health` + Control Center `/admin/x200` | CONFIRMÉ dans le dépôt |
| Gouvernance | X200 AUTOPLAN + FAST-LANE (alias `x100:*`) | CONFIRMÉ |
| Langues | FR / EN dans le site public | INDIQUÉ par le dépôt |
| Hébergement | VM GCP `clevones-serveur` (`europe-west1-b`), projet `clevonegroup` | INDIQUÉ (`DEPLOYMENT.md`) — non revérifié cette session |
| Production HEAD / PM2 | valeurs historiques `DEPLOYMENT.md` | NON_ACCESSIBLE ici |

## Objectif courant

Maintenir un marqueur `.x200/PRODUCT_COMPLETE.json` **niveau dépôt** (implémenté / testé / CI) aligné sur le HEAD et le hash de `PRODUCT_GOAL.md`, sans fusion `main` automatique ni déploiement automatique. Les rails live et ops production restent des gates humaines.

## Stack (CONFIRMÉ dans le dépôt)

- Next.js 15, React 19, TypeScript 5.8, Tailwind 4, Prisma 6, PostgreSQL, Zod, Playwright
- Node `>=20.9.0`, npm
- Scripts gouvernance : `scripts/*.mjs` et `scripts/lib/`
- Control Center : `lib/x200/*`, `/admin/x200`, télémétrie Fedora `.x200/telemetry.json`

## Authentification et rôles (CONFIRMÉ dans le code)

- Rôles Prisma : `SUPER_ADMIN`, `ADMIN`, `USER`
- MFA TOTP + recovery admin ; cookie challenge distinct de `admin_session`
- Portail USER : `/sign-in` → `portal_session` ; `/sign-out` efface seulement le cookie portail (T033, T036)
- Gestion users + DocumentGrant admin (T034) ; e2e ACL (T037)
- Matrice : `docs/ROLES_AND_PERMISSIONS.md`

## Gouvernance — état au 2026-09-13

| ID | État | Classe |
|---|---|---|
| T001–T044 | `TERMINÉE` avec preuves dans `backlog.json` | CONFIRMÉ registre |
| Relais ChatGPT | absent | CONFIRMÉ |
| Production | non accédée cette session | NON_ACCESSIBLE |
| Control Center | `/admin/x200` lecture seule + télémétrie Fedora réelle (T042/T043) | CONFIRMÉ dépôt |
| PRODUCT_COMPLETE | local `.x200/` ; valide seulement si `head` + `goalHash` courants | CONFIRMÉ règle X200 |

Preuves CI récentes (CONFIRMÉ) :

- T042 FULL quality SUCCESS `31af13b` / run [34759082358](https://github.com/clevonegroup911/clevones.com/actions/runs/34759082358)
- T043 FULL quality SUCCESS `9317276` / run [34763250287](https://github.com/clevonegroup911/clevones.com/actions/runs/34763250287)
- T044 FAST quality SUCCESS `424a842` / run [34763905161](https://github.com/clevonegroup911/clevones.com/actions/runs/34763905161)

## Écarts restants vs PRODUCT_GOAL

Aucun écart **automatique** restant au registre. Les écarts restants sont des **gates humaines / externes**.

### Gates humaines / externes (obligatoires hors auto)

| Gate | Note |
|---|---|
| SMTP réel | Console/mémoire seulement ; pas de provider SMTP dans le dépôt |
| PSP live (M-PESA / RAWBANK / Stripe) | Gateway sandbox complète ; pas de webhooks/clés réseau |
| Alertes GCP / uptime | Documentées ; non provisionnées |
| Timer backup production | Unités `ops/systemd/` préparées ; **non activées** |
| Merge `main` / PR ready | PR draft #8 ; pas de merge auto |
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
| Production | hors périmètre automatique |

## Interdit

Secrets dans Git, push `main`, merge automatique, déploiement automatique, API payante, reset destructeur, tâches de remplissage, rejeu d’une `TERMINÉE` encore valable, `PRODUCT_COMPLETE` prématuré (head/goalHash non alignés, preuves vides, ou claim merge/deploy/PSP live).
