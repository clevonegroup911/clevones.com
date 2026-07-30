# CEOS Mission #002 — Challenge + Why Now

**Date :** 2026-07-29  
**Statut :** livré  
**Constitution :** `docs/architecture/CEOS-PRODUCT-BLUEPRINT.md`  
**Prérequis :** Mission #001 (Foundation)  

---

## 1. Objectif

Créer le début du parcours narratif CEOS :

`Home → Challenge → Why Now → Positioning → …`

Sans créer Platform ni Evidence.

---

## 2. Approche

**Option A retenue** — pages éditoriales sobres avec `PageHero`, `ProseSection`, `FeatureCard`, `PageCtaSection`, breadcrumbs + JSON-LD WebPage/BreadcrumbList.

Option B (diagrammes dédiés) reportée — dette et complexité inutiles pour ce lot.

---

## 3. Routes

| PageKey | EN | FR | Switch |
|---|---|---|---|
| `challenge` | `/challenge` | `/defi` | strict |
| `whyNow` | `/why-now` | `/pourquoi-maintenant` | strict |

**Note slug FR Challenge :** Mission #002 adopte `/defi` (le Blueprint draft mentionnait `/enjeu`). Mapping réservé mis à jour en conséquence.

---

## 4. Frontières narratives

| Page | Contient | N’est pas |
|---|---|---|
| Challenge | Fragmentation, conséquences structurelles, limites des correctifs ponctuels | Positioning, About, Solutions, Methodology, preuves, chiffres inventés |
| Why Now | Forces d’accélération, limites des modèles actuels, capacités système requises | Catalogue CLEVONES, Five-Step, stats, prévisions |

Sources : business blueprint §3, Home `structuralProblem`, thèmes Insights (informal coordination, investment readiness, logistics as governance), brand positioning (sans pitch produit).

---

## 5. CTA parcours

| De | Vers | Label EN / FR |
|---|---|---|
| Home (secondaire) | Challenge | Explore the challenge / Comprendre le défi |
| Challenge | Why Now | Understand why action is needed now / Comprendre pourquoi il faut agir maintenant |
| Why Now | Positioning | See how CLEVONES is different / Voir ce qui distingue CLEVONES |
| Positioning (EN) | About (primaire) | Why Clevones exists |
| Positioning (FR) | About | Lien déjà présent vers `/mission` |

Pas de CTA Contact primaire sur Challenge / Why Now.

---

## 6. Navigation

Main (après #002) :

1. Challenge  
2. Why Now  
3. Positioning  
4. About  
5. Solutions  
6. Methodology  
7. Governance  
8. Platform  
9. FAQ  
10. Contact  

Insights reste secondaire. Densité : gaps header resserrés ; menu mobile scrollable.

---

## 7. SEO

- Metadata + canonical + hreflang via `createPageMetadata`  
- Sitemap : 4 nouvelles URLs, priorités élevées  
- JSON-LD : `WebPage` + `BreadcrumbList`  
- H1 unique par page  

---

## 8. Contenu nouveau vs repris

| Contenu | Statut |
|---|---|
| Formulations structuralProblem / blueprint | Reprises / adaptées |
| Messages centraux mission | Adoptés |
| Forces Why Now | Synthèse qualitative des thèmes dépôt — **sans chiffres** |
| Clients / stats / cas | **Interdits — absents** |

---

## 9. Risques résiduels

- 10 items main nav — densité desktop à valider visuellement  
- Positioning EN encore largement hors `content/pages` (legacy) — handoff CTA seulement  
- Structural problem Home chevauche encore légèrement Challenge (synthèse volontaire)  

---

## 10. Prochaine mission

**#003** — Clarification Platform vs Ecosystem + Evidence (après validation éditoriale #002).
