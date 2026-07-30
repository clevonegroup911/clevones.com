# CEOS Mission #003 — Platform + Evidence

**Date :** 2026-07-29  
**Statut :** livré  
**Constitution :** `docs/architecture/CEOS-PRODUCT-BLUEPRINT.md`  
**Brief mission :** Platform + Evidence v3.0  

---

## 1. Objectif

Répondre à deux questions produit :

| Page | Question |
|---|---|
| **Platform** | Comment fonctionne réellement CLEVONES ? |
| **Evidence** | Pourquoi un décideur devrait-il faire confiance à CLEVONES ? |

Sans inventer clients, chiffres, partenaires, awards, témoignages ou cas.

---

## 2. Options comparées

| | Option A (retenue) | Option B |
|---|---|---|
| Platform URLs | Conserver `/ecosystem` · `/ecosysteme` (PageKey `ecosystem`) | Migrer vers `/platform` · `/plateforme` + 301 |
| Evidence | Nouvelle page `/evidence` · `/preuves` | Réutiliser Insights comme Evidence |
| Contenu Platform | Modèle de fonctionnement + roster entités existant | Roster écosystème seul (Blueprint Phase 2 initiale) |
| Contenu Evidence | Qualité système (docs, doctrine, process) | Listing Insights seul |
| Risque SEO | Faible | Élevé (B Platform) / confusion Insights≠Evidence (B Evidence) |

**Retenue : A.** Stabilité SEO Platform ; Evidence distincte d’Insights ; modèle avant technologie.

---

## 3. Architecture Platform

```text
Hero (phrase + promesse + CTA ancre)
  ↓
Why a platform (outils isolés)
  ↓
Architecture (Territory → Actors → Flows → Platform → Execution → Evidence)
  ↓
Layers (Territorial · Coordination · Knowledge · Governance · Execution)
  ↓
Modules (communication + map + roster + Mining disclaimer)
  ↓
Decision flow (comment circulent les décisions)
  ↓
CTA → Evidence
```

- Pas de pitch IA / SaaS en tête de modèle.
- Entités = vérité dépôt (Clevodia, Clevonet, Bicuni, Btlearn, Clevone Mining).
- Mentions IA retirées des rôles/descriptions Clevodia / Btlearn sur cette surface (neutralité narrative Mission #003).

---

## 4. Architecture Evidence

```text
Hero
  ↓
Methodology → lien /methodology
  ↓
Architecture → lien Platform
  ↓
Documentation → Governance, Insights, Positioning
  ↓
Transparency (ce que le site n’invente pas)
  ↓
Standards (conformité / éligibilité publiés)
  ↓
Quality (Git, i18n, tsc/lint/build, SEO/a11y, traçabilité)
  ↓
Roadmap (parcours CEOS documenté — pas de forecasts)
  ↓
CTA → FAQ
```

Insights reste secondaire éditorial. Evidence = crédibilité système.

---

## 5. Routes

| PageKey | EN | FR | Nav |
|---|---|---|---|
| `ecosystem` | `/ecosystem` | `/ecosysteme` | Main — label Platform / Plateforme |
| `evidence` | `/evidence` | `/preuves` | Main — label Evidence / Preuves |

Main après #003 : Challenge · Positioning · Solutions · Methodology · Governance · Platform · Evidence · Contact (8).

---

## 6. CTA parcours

| De | Vers |
|---|---|
| Governance | Platform |
| Platform | Evidence |
| Evidence | FAQ |

---

## 7. Vérifications cibles

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`

---

## 8. Hors scope

- Migration URL `/platform` (reste `ceosFuturePathMap.platformMigrationCandidate`)
- Commit / push
- Nouveaux composants Design System hors extension minimale `PageHero.actions` / `ProseSection.children|id`
