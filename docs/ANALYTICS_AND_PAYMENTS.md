# Analytics et paiements — inventaire (T015)

Audit T015 (2026-09-09). Revue du dépôt + `npm run x200:scan-secrets`. **Aucun accès production**, aucune lecture de valeurs secrètes, aucune transaction réelle, aucun merge `main`.

Classes : **CONFIRMÉ** = observé cette session ; **INDIQUÉ** = documenté ailleurs ; **PROPOSÉ** = cible ; **NON_ACCESSIBLE** = production.

## Critère d’acceptation

| Critère | Résultat | Classe |
|---|---|---|
| Aucune clé de paiement dans Git | **PASS** — aucune dépendance paiement, aucune clé `sk_`/`pk_`, aucun secret paiement dans `.env.example` | CONFIRMÉ |

## Analytics

| Surface | Présence | Classe |
|---|---|---|
| Google Analytics / gtag / GTM | Absent du code applicatif | CONFIRMÉ |
| Plausible / PostHog / Mixpanel / Segment | Absent | CONFIRMÉ |
| `@vercel/analytics` | Absent de `package.json` | CONFIRMÉ |
| Scripts tracking dans `app/` | Aucun tracker tiers ; T022 ajoute une collecte **serveur first-party** (`docs/ANALYTICS.md`) | CONFIRMÉ + suite T022 |
| Mentions « Stripe » / analytics | Uniquement références **éditoriales** dans `docs/strategy/CLEVONES-INSTITUTIONAL-READINESS-AUDIT.md` (benchmark UX), pas d’intégration | CONFIRMÉ |

## Paiements

| Surface | Présence | Classe |
|---|---|---|
| Stripe / PayPal / Braintree / M-Pesa SDK | Absent de `package.json` | CONFIRMÉ |
| Routes checkout / webhook paiement | Absentes | CONFIRMÉ |
| Clés `sk_live` / `pk_live` / `whsec_` | Absentes du dépôt suivi | CONFIRMÉ |
| `.env.example` | DATABASE_URL, AUTH_SECRET, MFA_*, APP_ORIGIN, test DB — **pas** de clés paiement | CONFIRMÉ |
| `docs/SECRETS.md` | Déjà liste absents : clés de paiement, API payantes | CONFIRMÉ |
| README vision produit | Mentions futures Visa + M-Pesa (roadmap) — **pas** d’implémentation | CONFIRMÉ |

## Scan secrets

Commande : `npm run x200:scan-secrets` (2026-09-09)

| Métrique | Résultat | Classe |
|---|---|---|
| `tracked_env` | no | CONFIRMÉ |
| `forbidden_paths` | 0 | CONFIRMÉ |
| `blocking_hits` | **0** | CONFIRMÉ |
| `fixture_hits` | 22 (CI / tests / `.env.example` placeholders) | CONFIRMÉ |

Aucune clé de paiement détectée. Les fixtures listent uniquement des motifs auth/DB de test (pas Stripe/PayPal).

## Matrice risque

| Risque | Niveau | Mitigation actuelle |
|---|---|---|
| Introduction future de Stripe sans Secret Manager | medium | `docs/SECRETS.md` architecture cible ; scan secrets gouvernance |
| Confusion roadmap README vs prod | low | Ce document sépare vision et code |
| Analytics tiers sans consentement | n/a | Aucun tracker présent |

## Fichiers de contrôle

| Fichier | Rôle |
|---|---|
| `package.json` | Absence deps paiement/analytics |
| `.env.example` | Noms d’env autorisés |
| `docs/SECRETS.md` | Inventaire secrets (T010) |
| `scripts/scan-secrets.mjs` | Scan valeurs suivies par Git |
| `docs/strategy/CLEVONES-INSTITUTIONAL-READINESS-AUDIT.md` | Mentions éditoriales Stripe uniquement |

## Preuves

- Inventaire dépôt 2026-09-09
- Aucun accès production
- Aucune clé de paiement dans Git (CONFIRMÉ)
