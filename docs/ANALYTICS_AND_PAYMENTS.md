# Analytics et paiements — inventaire

> **Inventaire historique T015 (2026-09-09)** — « aucun tracker / aucun paiement dans le code » était vrai **à cette date**. Le code courant a des surfaces first-party et sandbox. Voir l’état réel ci-dessous.

## État réel post-T022–T032 (2026-09-12)

| Surface | État | Niveau de vérité | Doc |
|---|---|---|---|
| Analytics first-party | `AnalyticsEvent` + dashboard `/admin/analytics` | implémenté / testé ; **pas live prod** | `docs/ANALYTICS_FIRST_PARTY.md` |
| Trackers tiers (GA, Segment…) | Absents | CONFIRMÉ | — |
| Paiements sandbox / gateway | Order → Invoice → Payment → Event → Receipt | implémenté / testé CI ; **sandbox only** | `docs/PAYMENTS_GATEWAY.md` |
| Rails réels M-PESA / RAWBANK / Stripe | Non branchés ; aucune clé PSP dans Git | **non live** | gates humaines / externes |
| Clés `sk_live` / `pk_live` / `whsec_` | Absentes du dépôt suivi | CONFIRMÉ (scan-secrets) | `docs/SECRETS.md` |

**Pas de PRODUCT_COMPLETE** : auth USER (T033 en cours de contrôle CI), gestion users/grants (T034), PSP live et merge/deploy restent ouverts.

## Inventaire historique T015 (ne plus traiter comme vérité code)

| Surface (T015) | Verdict T015 | Statut 2026-09-12 |
|---|---|---|
| Analytics applicatif | Absent | **Présent** first-party (T022) |
| Routes checkout / webhook paiement | Absentes | Surfaces sandbox admin/portail (T024–T032) |
| Dépendances Stripe/PayPal SDK | Absentes | Toujours absentes (sandbox maison) |
| Clés paiement dans Git | Aucune | Toujours aucune (CONFIRMÉ) |

## Fichiers de contrôle courants

| Fichier | Rôle |
|---|---|
| `docs/ANALYTICS_FIRST_PARTY.md` | Events + dashboard |
| `docs/PAYMENTS_GATEWAY.md` | Chaîne gateway sandbox |
| `docs/SECRETS.md` | Inventaire secrets |
| `scripts/scan-secrets.mjs` | Scan Git |
