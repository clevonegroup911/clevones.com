# CEOS Mission #002.5 — Narrative Stabilization

**Date :** 2026-07-29  
**Statut :** livré  
**Prérequis :** Mission #002  

---

## 1. Navigation — Option B retenue

| | Option A | Option B (retenue) |
|---|---|---|
| Main | 10 liens | 7 liens |
| Secondary | Insights only | Why Now, About, FAQ, Insights |
| Densité 1024–1440 / zoom | Risquée | Main visible + menu **More/Plus** |

**Main :** Challenge · Positioning · Solutions · Methodology · Governance · Platform · Contact  

**More :** Why Now · About · FAQ · Insights  

Routes et rôles narratifs inchangés. Aucune route inexistante.

---

## 2. Home vs Challenge

| Avant Home | Après |
|---|---|
| 5 facteurs détaillés | Idée centrale + 1 conséquence + CTA Challenge |
| Section Why Clevones | Retirée de l’UI (data `whyClevones` conservée) |
| Facteurs listés | Conservés dans `structuralProblem.factors` (non rendus) |

**Frontière :** Challenge seul porte fragmentation, silos, conséquences détaillées, insuffisance des réponses ponctuelles.

---

## 3. Migration Positioning

- Nouveau : `lib/i18n/content/pages/positioning.ts` (EN+FR, même doctrine)
- Composant unique : `components/sections/positioning-page.tsx`
- Routes `/positioning` · `/positionnement` inchangées
- Legacy `lib/positioning-page.ts` / `lib/positionnement-page.ts` = re-exports dépréciés
- `positionnement.tsx` section dédiée **supprimée** (doublon)

---

## 4. Handoffs

| De | Vers | Mécanisme |
|---|---|---|
| Home | Challenge | Hero secondaire + teaser problème CTA |
| Challenge | Why Now | CTA page (inchangé) |
| Why Now | Positioning | CTA page (inchangé) |
| Positioning | About | CTA primaire EN/FR i18n |

Contact = chrome / CTA institutionnel final Home — n’interrompt pas le parcours narratif.

---

## 5. Feu vert Mission #003

**Oui, sous réserve de revue visuelle** du menu More et du teaser Home — technique stable (tsc/lint/build).
