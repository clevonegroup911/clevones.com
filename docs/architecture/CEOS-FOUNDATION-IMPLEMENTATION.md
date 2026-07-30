# CEOS Foundation Implementation — Mission #001

**Statut :** fondation livrée · **supersédé en partie par Mission #002** (Challenge + Why Now live)  
**Date :** 2026-07-29  
**Constitution :** `docs/architecture/CEOS-PRODUCT-BLUEPRINT.md`  
**Approche :** Option A — modification minimale et progressive  
**Suite :** `docs/architecture/CEOS-MISSION-002-CHALLENGE-WHY-NOW.md` · `docs/architecture/CEOS-MISSION-002.5-NARRATIVE-STABILIZATION.md` 

---

## 1. État initial (Phase 0)

| Check | Résultat |
|---|---|
| `npx tsc --noEmit` | Exit 0 |
| `npm run lint` | Exit 0 (no warnings) |
| `npm run build` | Exit 0 (47 pages) |

Conflits principaux avant mission :

- Nav : About avant Positioning ; Governance après Insights/Ecosystem  
- Footer « Platform » = Sign-in / Portal (conflit sémantique CEOS Platform)  
- Insights dans le parcours principal  
- FAQ / Contact absents du main nav  
- Home = catalogue (positioning, domains, methodology, pillars, ecosystem, filters, insights)

---

## 2. Décisions D1–D7 retenues

| ID | Décision | Codification |
|---|---|---|
| **D1** | Platform = surface institutionnelle (PageKey `ecosystem`, URLs `/ecosystem` · `/ecosysteme`). Access = Sign-in / Portal. Ecosystem = concept + colonne entités footer. | Nav label `Platform` / `Plateforme` → `ecosystem`. Shell `footerAccess` / `nav.access`. Reserved map for future `/platform` migration in `lib/i18n/ceos-reserved.ts`. |
| **D2** | Insights ≠ Evidence. Insights = bibliothèque éditoriale, voie secondaire. Evidence page non créée. | `secondaryNavigationKeys = ["insights"]`. Sitemap priority Insights abaissée (0.65). |
| **D3** | Home = entrée, pas catalogue. | Composition : Hero → Structural problem → Why Clevones → Final CTA. Previews retirées de l’UI, contenu conservé dans `pages.home`. |
| **D4** | Ordre temporaire sans routes futures. | Main : Positioning → About → Solutions → Methodology → Governance → Platform(ecosystem) → FAQ → Contact. |
| **D5** | CTA institutionnel unique. | EN `Start a strategic conversation` · FR `Commencer une conversation stratégique` → Contact locale. Hero secondaire = progression vers Positioning. |
| **D6** | SEO stable. | Slugs inchangés. Sitemap réordonné / priorités alignées. Pas de metadata pour pages inexistantes. Pas de redirects. |
| **D7** | Anti-duplication. | Full Positioning / Solutions / Methodology / Governance / Ecosystem / Insights retirés de Home ; pont condensé `whyClevones` + lien Positioning. |

**Vocabulaire Access :** le dépôt utilisait déjà « Sign in » / « Client portal » / « Connexion » / « Portail client ». Label de colonne : **Access** / **Accès** (recommandation blueprint ; pas de nouvelle marque).

---

## 3. Options comparées

| | Option A (retenue) | Option B |
|---|---|---|
| Portée | Nav + CTA + Home + labels + reserved keys | + rename URLs Platform/Evidence + rewrite pages |
| Risque SEO | Faible | Élevé (301 massifs) |
| i18n | Stable | Migrations de slugs |
| Maintenabilité | Mapping documenté | Plus de cohérence nominale immédiate |
| Cohérence CEOS | Fondation correcte | Plus complète mais hors périmètre #001 |

**Retenue : A.**

---

## 4. Mapping ancien → nouveau

| Avant | Après |
|---|---|
| Main: About, Positioning, Solutions, Methodology, Ecosystem, Insights, Governance | Main: Positioning, About, Solutions, Methodology, Governance, Platform(`ecosystem`), FAQ, Contact |
| Insights in main | Secondary (footer + mobile section) |
| FAQ / Contact in legal only | FAQ / Contact in main ; legal = Legal + Privacy |
| Footer « Platform » = SaaS | Footer « Access » = Sign-in / Portal |
| Nav « Ecosystem » | Nav « Platform » (same URLs) |
| Home 10 sections | Home 4 sections |
| Hero CTA secondaire → Ecosystem | → Positioning |
| Shell CTA « Initiate a strategic collaboration » | « Start a strategic conversation » |

---

## 5. Contenus Home — matrice D7

| Contenu | Statut | Destination |
|---|---|---|
| Hero (title, VP, benefits, trust) | **Conservé** (preuves écosystème retirées de l’UI) | Home |
| Hero `proofs` data | **Reporté / UI retirée** | Données gardées dans `pages.home.hero.proofs` ; surface Platform plus tard |
| Structural problem | **Conservé** | Home (synthèse) ; futur Challenge pourra l’absorber |
| Positioning full is/is-not | **Déplacé (UI)** | Page Positioning ; Home garde `pages.home.positioning` pour legacy/preview |
| Why Clevones (nouveau pont) | **Condensé** | Home ; copy dérivée de positioning + 3 piliers existants |
| Domains preview | **Reporté** | Page Solutions ; data `pages.home.domains` |
| Methodology preview | **Reporté** | Page Methodology ; data `pages.home.methodology` |
| Strategic pillars (6) | **Condensé** | 3 principes dans `whyClevones` ; 6 restent dans `pages.home.pillars` |
| Ecosystem preview | **Reporté** | Page Ecosystem/Platform ; data `pages.home.ecosystem` |
| Client filters | **Reporté** | Page Governance ; data `pages.home.filters` |
| Insights preview | **Reporté** | Page Insights (secondaire) ; data `pages.home.insights` |
| Final CTA | **Conservé / aligné** | Labels D5 |

Composants preview non branchés sur Home mais **non supprimés** : `positioning.tsx`, `domains-preview.tsx`, `methodology-preview.tsx`, `strategic-pillars.tsx`, `ecosystem-preview.tsx`, `client-filtering.tsx`, `insights-preview.tsx`.

---

## 6. Routes conservées

Toutes les routes `localizedPages` inchangées.  
Aucune route Challenge / Why Now / Evidence / `/platform` exposée.

Réservées (non live) : `lib/i18n/ceos-reserved.ts`.

---

## 7. Pages futures (prochaines vagues)

1. ~~Challenge~~ · ~~Why Now~~ — **livrés en Mission #002** (`/challenge`·`/defi`, `/why-now`·`/pourquoi-maintenant`)  
2. Clarifier H1 Ecosystem → Platform (copy page, SEO contrôlé)  
3. Evidence (page structurée) — Insights reste secondaire  
4. Migration URL optionnelle Platform (`/platform`) avec 301  

---

## 8. Risques résiduels

- Nav desktop : 10 entrées après #002 — densité à valider.  
- Label nav « Platform » vs H1 page encore « Ecosystem » : intentionnel (D1 / D6) — harmoniser en vague suivante.  
- Insights absent du header desktop (footer + mobile uniquement) : voulu (secondaire).  
- Contenu Home non rendu toujours dans le bundle JS des modules contenu (pas de purge) — acceptable.

---

## 9. Fichiers touchés (résumé)

- `lib/i18n/ceos-reserved.ts` (nouveau)  
- `lib/i18n/navigation.ts`  
- `lib/i18n/content/types.ts`  
- `lib/i18n/content/en.ts` / `fr.ts`  
- `lib/i18n/content/pages/home.ts`  
- `lib/i18n/index.ts`  
- `lib/constants/navigation.ts`  
- `components/layout/header.tsx` / `footer.tsx`  
- `components/sections/hero.tsx`  
- `components/sections/why-clevones.tsx` (nouveau)  
- `app/(public)/page.tsx` / `accueil/page.tsx`  
- `app/sitemap.ts`  
- `docs/architecture/CEOS-FOUNDATION-IMPLEMENTATION.md` (ce fichier)  

Blueprint produit **non modifié**.

---

## 10. Prochaine mission recommandée

**Mission #003 — Platform vs Ecosystem + Evidence** (après validation visuelle/éditoriale de Challenge et Why Now).  
Voir `docs/architecture/CEOS-MISSION-002-CHALLENGE-WHY-NOW.md`.
