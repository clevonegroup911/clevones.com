# PROJECT_CONTEXT — Clevones.com

Point de reprise versionné. Classer tout fait : **CONFIRMÉ**, **INDIQUÉ**, **PROPOSÉ**, **INCONNU**, **NON_ACCESSIBLE**. Un état historique n’est pas un état revérifié.

## Identité

| Champ | Valeur | Classe |
|---|---|---|
| Projet | clevones.com | CONFIRMÉ |
| Dépôt GitHub | clevonegroup911/clevones.com | CONFIRMÉ |
| Workspace local | branche `autoplan/payments-recovery-20260912`, remote `origin` | CONFIRMÉ (session 2026-09-12) |
| HEAD travail | `182c9f5ca62888cf991f9859ecdc8a16fe21b814` (T038 close + AUTOPLAN T039–T040) | CONFIRMÉ |
| Produit | site institutionnel Next.js + `/admin` MFA + portail USER + CMS/docs/analytics/paiements sandbox + `/health` | CONFIRMÉ dans le dépôt |
| Gouvernance | X200 AUTOPLAN + FAST-LANE (alias `x100:*`) | CONFIRMÉ |
| Langues | FR / EN dans le site public | INDIQUÉ par le dépôt |
| Hébergement | VM GCP `clevones-serveur` (`europe-west1-b`), projet `clevonegroup` | INDIQUÉ (`DEPLOYMENT.md`) — non revérifié cette session |
| Production HEAD / PM2 | valeurs historiques `DEPLOYMENT.md` | NON_ACCESSIBLE ici |

## Objectif courant

Atteindre un marqueur `.x200/PRODUCT_COMPLETE.json` **niveau dépôt** (implémenté / testé / CI) sans fusion `main` automatique ni déploiement automatique. Les rails live et ops production restent des gates humaines.

## Stack (CONFIRMÉ dans le dépôt)

- Next.js 15, React 19, TypeScript 5.8, Tailwind 4, Prisma 6, PostgreSQL, Zod, Playwright
- Node `>=20.9.0`, npm
- Scripts gouvernance : `scripts/*.mjs` et `scripts/lib/`

## Authentification et rôles (CONFIRMÉ dans le code)

- Rôles Prisma : `SUPER_ADMIN`, `ADMIN`, `USER`
- MFA TOTP + recovery admin ; cookie challenge distinct de `admin_session`
- Portail USER : `/sign-in` → `portal_session` ; `/sign-out` efface seulement le cookie portail (T033, T036)
- Gestion users + DocumentGrant admin (T034) ; e2e ACL (T037)
- Matrice : `docs/ROLES_AND_PERMISSIONS.md`

## Gouvernance — état au 2026-09-12

| ID | État | Classe |
|---|---|---|
| T001–T038 | `TERMINÉE` avec preuves dans `backlog.json` | CONFIRMÉ registre |
| T039 | `EN_CONTRÔLE` — resync docs reprise | CONFIRMÉ cette session |
| T040 | `À_FAIRE` — PRODUCT_COMPLETE (dépend T039) | CONFIRMÉ registre |
| Relais ChatGPT | absent | CONFIRMÉ |
| Production | non accédée cette session | NON_ACCESSIBLE |
| PRODUCT_COMPLETE | **absent** jusqu’à T040 ; ne revendique pas live prod | CONFIRMÉ règle X200 |

Preuves CI récentes (CONFIRMÉ) :

- T037 quality SUCCESS `b35b20e` / run [34717886942](https://github.com/clevonegroup911/clevones.com/actions/runs/34717886942)
- T038 quality SUCCESS `8cb9c14` / run [34718190353](https://github.com/clevonegroup911/clevones.com/actions/runs/34718190353)

## Écarts restants vs PRODUCT_GOAL

Écarts **automatiques** restants : T039 (docs) puis T040 (marqueur dépôt).

### Gates humaines / externes (obligatoires hors auto)

| Gate | Note |
|---|---|
| SMTP réel | Console/mémoire seulement ; pas de provider SMTP dans le dépôt |
| PSP live (M-PESA / RAWBANK / Stripe) | Gateway sandbox complète ; pas de webhooks/clés réseau |
| Alertes GCP / uptime | Documentées ; non provisionnées |
| Timer backup production | Unités `ops/systemd/` préparées ; **non activées** |
| Merge `main` / PR ready | PR draft #7 ; pas de merge auto |
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

Secrets dans Git, push `main`, merge automatique, déploiement automatique, API payante, reset destructeur, tâches de remplissage, rejeu d’une `TERMINÉE` encore valable, `PRODUCT_COMPLETE` prématuré (avant T039/T040 et preuves HEAD/goalHash).
