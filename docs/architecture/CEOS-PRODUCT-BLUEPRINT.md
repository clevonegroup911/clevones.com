# CLEVONES — CEOS Product Blueprint

**Document :** Constitution Produit  
**Code :** CEOS (Clevones Enterprise Operating System — Product Experience)  
**Version :** 2.0  
**Statut :** référence unique avant toute implémentation Phase 2  
**Portée :** plateforme institutionnelle mondiale (B2G / B2B / institutions / investisseurs / universités / organisations internationales)  
**Langues :** EN (référence technique des URLs par défaut) · FR (chemins localisés)  
**Sources de vérité :** dépôt Git uniquement · `docs/business-architecture-blueprint.md` · contenus i18n existants  

---

## 0. Statut et règles constitutionnelles

### 0.1 Nature du document

Ce blueprint définit **ce que chaque page doit être**, **pourquoi elle existe**, **ce qu’elle peut dire**, et **comment elle s’enchaîne**.

Il ne décrit pas une implémentation technique.  
Il précède toute création de page, tout reorder de navigation, toute réécriture de copy.

### 0.2 Hiérarchie des références

| Rang | Document | Rôle |
|---|---|---|
| 1 | **CEOS Product Blueprint** (ce document) | Parcours produit, UX, SEO, CTA, anti-doublons |
| 2 | `docs/business-architecture-blueprint.md` | Vision, mission, valeur, écosystème, posture est/n’est pas |
| 3 | Contenu versionné dans le dépôt (`lib/i18n/content/**`, constantes marque) | Formulations autorisées |
| 4 | Code App Router / Design System | Exécution — jamais source de vérité produit |

### 0.3 Règles absolues

1. **Une page = une question = une idée = une action (CTA).**
2. **Ne jamais inventer :** clients, chiffres, partenaires, awards, certifications, statistiques, cas d’étude, investissements, résultats.
3. **Style :** institutionnel, sobre, international, professionnel — pas de marketing agressif, pas de buzzwords, pas de promesses impossibles.
4. **Preuves :** uniquement ce qui existe dans le dépôt (notes Insights, architecture écosystème documentée, doctrine, méthodologie, disclaimers).
5. **Ne jamais casser :** i18n, SEO, App Router, Design System, accessibilité WCAG AA, performance, build, TypeScript, lint.
6. **Home n’explique pas tout.** Home crée l’attention et ouvre le parcours.
7. **Contact ne vend jamais.** Contact commence une conversation structurée.
8. **Evidence n’invente jamais.** Si un corps d’article est « forthcoming », le dire. Pas de faux cas.

### 0.4 Audiences cibles (catégories du dépôt uniquement)

Institutions · Investisseurs · Acteurs logistiques structurés · Partenaires stratégiques · Acteurs académiques / recherche · Entreprises et organisations structurées · Leaders territoriaux · Organisations internationales (comme catégorie institutionnelle — sans partenaires nommés inventés).

### 0.5 Mapping CEOS ↔ état actuel du dépôt

| Page CEOS | État | Clé logique actuelle | EN actuel | FR actuel |
|---|---|---|---|---|
| Home | Existe | `home` | `/` | `/accueil` |
| Challenge | **À créer** | — | *cible* `/challenge` | *cible* `/enjeu` |
| Why Now | **À créer** | — | *cible* `/why-now` | *cible* `/pourquoi-maintenant` |
| Positioning | Existe | `positioning` | `/positioning` | `/positionnement` |
| About | Existe | `about` | `/about` | `/mission` |
| Solutions | Existe | `solutions` | `/solutions` | `/domaines` |
| Methodology | Existe | `methodology` | `/methodology` | `/methodologie` |
| Governance | Existe | `governance` | `/governance` | `/gouvernance` |
| Platform | Existe sous autre nom | `ecosystem` | `/ecosystem` | `/ecosysteme` |
| Evidence | Existe sous autre nom | `insights` | `/insights` | `/analyses` |
| FAQ | Existe | `faq` | `/faq` | `/questions-frequentes` |
| Contact | Existe | `contact` | `/contact` | `/collaboration` |

**Décision constitutionnelle de nommage (produit) :**

- **Platform** = page produit « architecture / hub / modules / interopérabilité ».  
  URL actuelle `ecosystem` / `ecosysteme` **conservée en Phase 2 initiale** (stabilité SEO). Labels UI et H1 migrent vers le rôle CEOS Platform. Renommage d’URL éventuel = décision ultérieure avec redirects 301.
- **Evidence** = page « preuves / documentation / publications ».  
  URL actuelle `insights` / `analyses` **conservée**. Labels UI migrent vers Evidence / Preuves (FR peut conserver « Analyses » comme label éditorial si cohérent — voir matrice i18n).
- **Challenge** et **Why Now** = pages nouvelles ; pas de contenu inventé hors problèmes déjà décrits dans le business blueprint et la Home actuelle (`structuralProblem`, Insights).

**Hors parcours CEOS (conservés) :** Legal · Privacy · Sign-in · Portal (SaaS préparatoire). Le footer « Platform » SaaS ne doit **pas** confondre avec la page CEOS Platform — libellé footer cible : **Access** / **Accès** (ou équivalent non conflictuel).

---

## 1. Parcours CEOS officiel

```text
Home
  ↓
Challenge          Q1  Quel problème mondial existe ?
  ↓
Why Now            Q2  Pourquoi ce problème devient-il critique ?
  ↓
Positioning        Q3  Pourquoi les approches classiques échouent ?
                   Q4  Pourquoi CLEVONES est différent ?
  ↓
About              Q4′ Pourquoi CLEVONES existe ? (mission / vision / valeurs)
  ↓
Solutions          Q5  Que fait réellement CLEVONES ? (résultats, pas services)
  ↓
Methodology        Q6  Comment fonctionne CLEVONES ?
  ↓
Governance         Q7  Pourquoi faire confiance ?
  ↓
Platform           Q8  Quelle infrastructure possède CLEVONES ?
  ↓
Evidence           Q9  Quelles preuves existent ?
  ↓
FAQ                Objections restantes
  ↓
Contact            Q10 Comment commencer ?
```

**Règle de navigation principale (cible) :**

`Challenge → Why Now → Positioning → About → Solutions → Methodology → Governance → Platform → Evidence`

Home = logo uniquement.  
FAQ + Contact = fin de parcours + pied de page (Contact aussi = CTA primaire header).

---

## 2. Spécifications page par page

---

### PAGE 01 — HOME

#### 1. Objectif

Créer l’attention. Établir la présence de marque institutionnelle. Donner envie d’entrer dans le parcours — **sans** tout expliquer.

#### 2. Question utilisateur

« Est-ce que cette plateforme mérite mon attention institutionnelle ? »

#### 3. Message principal

**CLEVONES est la couche neutre qui transforme le potentiel territorial en systèmes économiques gouvernés.**

#### 4. Ce qui appartient à cette page

- Brand hero (nom CLEVONES dominant)
- Une proposition de valeur courte (1 phrase)
- Un sous-texte court (1–2 phrases max)
- Un seul CTA primaire vers Challenge (entrée du parcours)
- Lien textuel secondaire optionnel vers Contact (jamais deux boutons primaires égaux)
- Ligne de confiance institutionnelle (posture neutre — sans chiffres)
- Teaser minimal optionnel (1 ligne) vers le parcours — pas de mini-site

#### 5. Ce qui est interdit

- Explication complète du problème → **Challenge**
- Urgence / IA / géopolitique → **Why Now**
- Liste est / n’est pas détaillée → **Positioning**
- Mission / vision / valeurs → **About**
- Domaines / résultats détaillés → **Solutions**
- Framework 5 étapes détaillé → **Methodology**
- Doctrine / filtres / conformité → **Governance**
- Carte écosystème / modules / API → **Platform**
- Articles / preuves → **Evidence**
- FAQ → **FAQ**
- Formulaire → **Contact**
- Stats, logos clients, awards, « social proof » inventé
- Cards de domaines, timeline méthodologie, map écosystème, listing Insights (état actuel Home trop chargé — à retirer du premier viewport et, à terme, de la page)

#### 6. CTA

**Unique :** « Comprendre l’enjeu » → Challenge  
Label EN cible : `Understand the challenge` → `/challenge`  
Label FR cible : `Comprendre l’enjeu` → `/enjeu`

#### 7. Entrée

- Accès direct (SEO, brand search)
- Language switcher
- Logo (retour Home depuis toute page)

#### 8. Sortie

- **Primaire :** Challenge
- **Secondaire (chrome, pas CTA de page) :** Contact via header

#### 9. SEO

| Champ | EN | FR |
|---|---|---|
| Intent | Navigational + branded awareness | Idem |
| Title | `Clevones — Governance Architecture for Territorial Economic Flows` | `Clevones — Architecture de gouvernance des flux économiques territoriaux` |
| Description | Short brand + coordination platform for territorial economic systems. No claims. | Idem FR |
| H1 | Brand-led : CLEVONES (ou équivalent héros marque) | Idem |
| Keywords | territorial economic governance, coordination platform, Africa, DRC (prudents, non stuffing) | gouvernance économique territoriale, plateforme de coordination |
| Schema.org | `Organization` + `WebSite` | Idem |

Canonical : `/` (EN) · `/accueil` (FR)  
hreflang : `en` ↔ `fr` + `x-default` → EN home

#### 10. UX

| Critère | Cible |
|---|---|
| Temps de lecture | ≤ 30 secondes pour comprendre « qui / pourquoi entrer » |
| Longueur | 1 viewport dominant + éventuelle bande courte |
| Hiérarchie | Marque → H1/proposition → phrase → CTA |
| Sections | Hero only (idéal) ; max 1 bande de confiance |

#### 11. Composants

- Hero full-bleed institutionnel (Design System existant)
- CTA primaire unique
- Trust line / disclaimer neutre (texte, pas badge)
- **Interdit dans le hero :** cards, stats, pills, badges flottants, map, timeline

#### 12. Données

**Autorisé :** formulations vision/mission/UVP du business blueprint · disclaimers `brand-positioning` · hero copy ancré dépôt.  
**Interdit :** preuves inventées · liste d’entités complète · articles · filtres clients détaillés.

#### 13. Vérifications

- [ ] Une seule idée ; un seul CTA primaire
- [ ] Marque dominante au premier viewport
- [ ] Aucune invention
- [ ] H1 unique ; meta title/description ; OG/Twitter ; JSON-LD Organization/WebSite
- [ ] Canonical + hreflang
- [ ] Contraste WCAG AA ; focus clavier
- [ ] Pas de doublon avec Challenge / Positioning / Solutions

---

### PAGE 02 — CHALLENGE

#### 1. Objectif

Décrire le problème structurel mondial / territorial que CLEVONES adresse — sans pitch commercial.

#### 2. Question utilisateur

« Quel problème existe réellement ? » (**Q1**)

#### 3. Message principal

**Le potentiel territorial ne devient pas de la valeur durable sans couche de gouvernance et de coordination.**

#### 4. Ce qui appartient à cette page

- Fragmentation des acteurs et des initiatives
- Absence de coordination structurée
- Faible gouvernance / confusion gouvernance–opération
- Perte de valeur (qualitative — sans chiffres inventés)
- Déconnexion des acteurs légitimes
- Illisibilité des initiatives pour institutions et investisseurs
- Coordination informelle et ses coûts structurels (tels que déjà formulés dans Insights / blueprint — sans stats inventées)

#### 5. Ce qui est interdit

- Urgence temporelle / IA / transition énergétique / géopolitique → **Why Now**
- Différenciation CLEVONES / est–n’est pas → **Positioning**
- Mission / pourquoi nous existons → **About**
- Solutions / domaines / résultats → **Solutions**
- Méthode → **Methodology**
- Preuves / articles → **Evidence**
- CTA de vente ou « book a demo »

#### 6. CTA

**Unique :** « Pourquoi agir maintenant » → Why Now  
EN : `Why this matters now` → `/why-now`  
FR : `Pourquoi agir maintenant` → `/pourquoi-maintenant`

#### 7. Entrée

Home · (éventuel lien footer / sitemap) · SEO problem-intent

#### 8. Sortie

Why Now

#### 9. SEO

| Champ | EN | FR |
|---|---|---|
| Intent | Informational — problem awareness | Idem |
| Title | `The Coordination Challenge — Clevones` | `L’enjeu de coordination — Clevones` |
| Description | Structural fragmentation, weak governance, and disconnected actors in territorial economic systems. | Fragmentation, faible gouvernance, acteurs déconnectés. |
| H1 | Problème structurel (pas le nom produit comme H1 exclusif) | Idem |
| Keywords | territorial fragmentation, informal coordination, economic governance gap | fragmentation territoriale, coordination informelle |
| Schema.org | `WebPage` (+ `BreadcrumbList`) | Idem |

#### 10. UX

| Critère | Cible |
|---|---|
| Temps de lecture | 2–4 min |
| Longueur | 400–700 mots |
| Hiérarchie | H1 problème → facteurs (H2) → conséquence structurelle → CTA |
| Sections | Hero problème · Facteurs (liste) · Conséquence · CTA |

#### 11. Composants

- Hero sobre (pas image promo agressive)
- Liste structurée de facteurs (pas cards marketing)
- Éventuel schéma simple « fragmentation → perte de valeur » (diagramme conceptuel)
- CTA unique

#### 12. Données

**Autorisé :** problèmes listés dans `docs/business-architecture-blueprint.md` §3 · Home `structuralProblem` · thèmes Insights (titres/abstracts existants).  
**Interdit :** statistiques mondiales inventées · « X% des projets échouent » · clients nommés.

#### 13. Vérifications

- [ ] Aucune solution CLEVONES détaillée
- [ ] Aucun « Why Now » mélangé
- [ ] Un CTA vers Why Now uniquement
- [ ] SEO + a11y complets
- [ ] Contenu traçable au dépôt / blueprint

---

### PAGE 03 — WHY NOW

#### 1. Objectif

Expliquer pourquoi l’inaction devient coûteuse **maintenant** — pression structurelle contemporaine.

#### 2. Question utilisateur

« Pourquoi ce problème devient-il critique maintenant ? » (**Q2**)

#### 3. Message principal

**Les transformations numériques, énergétiques et géopolitiques accélèrent le besoin de coordination gouvernée.**

#### 4. Ce qui appartient à cette page

- Transformation numérique des économies territoriales
- Intelligence artificielle (comme pression de coordination / lisibilité — pas comme produit IA vendu)
- Transition énergétique
- Pression géopolitique et compétition mondiale
- Exigence croissante de conformité, traçabilité, readiness institutionnelle
- Fenêtre : structure avant capital ; gouvernance avant échelle

#### 5. Ce qui est interdit

- Redécrire tout le problème Challenge → **Challenge** (renvoi possible, pas duplication)
- Pitch CLEVONES / est–n’est pas → **Positioning** / **About**
- Liste de domaines → **Solutions**
- Framework → **Methodology**
- Preuves inventées d’urgence (« marchés à +X% »)

#### 6. CTA

**Unique :** « Voir ce qui différencie Clevones » → Positioning  
EN : `See how Clevones is different` → `/positioning`  
FR : `Voir ce qui différencie Clevones` → `/positionnement`

#### 7. Entrée

Challenge

#### 8. Sortie

Positioning

#### 9. SEO

| Champ | EN | FR |
|---|---|---|
| Intent | Informational — timing / urgency (institutionnelle) | Idem |
| Title | `Why Territorial Governance Matters Now — Clevones` | `Pourquoi la gouvernance territoriale compte maintenant — Clevones` |
| Description | Digital transformation, energy transition, and geopolitical pressure raise the cost of informal coordination. | Transformation numérique, transition énergétique, pression géopolitique. |
| H1 | Why now / Pourquoi maintenant | Idem |
| Keywords | investment readiness timing, digital transformation governance | gouvernance, transformation numérique, transition énergétique |
| Schema.org | `WebPage` + `BreadcrumbList` | Idem |

#### 10. UX

| Critère | Cible |
|---|---|
| Temps de lecture | 2–3 min |
| Longueur | 350–600 mots |
| Hiérarchie | H1 → 4–5 pressions (H2) → implication → CTA |
| Sections | Hero · Pressions · Implication institutionnelle · CTA |

#### 11. Composants

- Hero
- Liste ou grille sobre de pressions (pas icon row décorative excessive)
- CTA unique
- Pas de timeline produit

#### 12. Données

**Autorisé :** thèmes déjà présents dans Insights (readiness, informal coordination cost, logistics as governance) · formulation qualitative du blueprint.  
**Interdit :** forecasts chiffrés · classements · parts de marché.

#### 13. Vérifications

- [ ] Ton institutionnel, pas alarmiste marketing
- [ ] Pas de double emploi avec Challenge
- [ ] CTA unique vers Positioning
- [ ] Aucune invention chiffrée

---

### PAGE 04 — POSITIONING

#### 1. Objectif

Établir la différence structurelle : pourquoi les modèles classiques échouent, et ce que CLEVONES **est / n’est pas**.

#### 2. Question utilisateur

« Pourquoi les approches classiques échouent-elles — et pourquoi Clevones est différent ? » (**Q3 + différenciation**)

#### 3. Message principal

**CLEVONES est une couche neutre d’architecture et de coordination — pas un opérateur, pas un intermédiaire informel.**

#### 4. Ce qui appartient à cette page

- Échec des modèles classiques (opérer + gouverner = conflit d’intérêt ; capital avant structure ; coordination informelle)
- Ce que CLEVONES **est** (labels canoniques `brand-positioning`)
- Ce que CLEVONES **n’est pas**
- Posture : en amont de l’exécution
- Séparation gouvernance / opération
- Disclaimer de neutralité

#### 5. Ce qui est interdit

- Mission / vision / valeurs narratives longues → **About**
- Domaines d’intervention → **Solutions**
- Étapes méthodologiques → **Methodology**
- Filtres d’éligibilité détaillés → **Governance**
- Map écosystème → **Platform**
- Articles → **Evidence**

#### 6. CTA

**Unique :** « Découvrir pourquoi Clevones existe » → About  
EN : `Why Clevones exists` → `/about`  
FR : `Pourquoi Clevones existe` → `/mission`

#### 7. Entrée

Why Now · Home (lien secondaire éventuel) · nav

#### 8. Sortie

About

#### 9. SEO

| Champ | EN | FR |
|---|---|---|
| Intent | Informational — differentiation | Idem |
| Title | `Positioning — What Clevones Is and Is Not` | `Positionnement — Ce que Clevones est et n’est pas` |
| Description | Neutral governance layer vs operator, trader, or informal broker. | Couche de gouvernance neutre vs opérateur ou courtier informel. |
| H1 | What Clevones is — and is not | Ce que Clevones est — et n’est pas |
| Keywords | neutral coordination platform, governance architecture | plateforme de coordination neutre |
| Schema.org | `WebPage` + `BreadcrumbList` | Idem |

#### 10. UX

| Critère | Cible |
|---|---|
| Temps de lecture | 3–5 min |
| Longueur | 500–800 mots |
| Hiérarchie | H1 → échec classique → Est / N’est pas → implication → CTA |
| Sections | Hero · Why classics fail · Is · Is not · Neutrality note · CTA |

#### 11. Composants

- Hero
- Deux colonnes Est / N’est pas (pattern existant)
- Liste courte des échecs classiques
- CTA unique
- Pas de formulaire

#### 12. Données

**Autorisé :** `lib/constants/brand-positioning.ts` · pages positioning / positionnement · blueprint §2.  
**Interdit :** comparatifs nommés contre concurrents · claims de leadership chiffrés.

#### 13. Vérifications

- [ ] Est / N’est pas complets et canoniques
- [ ] Pas de duplication About
- [ ] CTA unique vers About
- [ ] Disclaimer neutre présent

---

### PAGE 05 — ABOUT

#### 1. Objectif

Dire pourquoi CLEVONES existe : mission, vision, valeurs, neutralité comme choix institutionnel.

#### 2. Question utilisateur

« Pourquoi CLEVONES existe-t-il ? » (**Q4**)

#### 3. Message principal

**CLEVONES existe pour architecturer, structurer et coordonner les systèmes économiques territoriaux — avec neutralité.**

#### 4. Ce qui appartient à cette page

- Vision (formulation blueprint)
- Mission
- Valeurs / principes institutionnels (neutralité, documentation, conformité, non-substitution)
- Raison d’être (gap de gouvernance neutre)
- Portée géographique telle que définie dans le dépôt (RDC et Afrique — sans expansion inventée)
- Clarification objet social vs posture plateforme (renvoi Solutions / FAQ si besoin, pas catalogue)

#### 5. Ce qui est interdit

- Liste Est / N’est pas complète → **Positioning** (peut citer en une ligne + lien)
- Neuf domaines détaillés → **Solutions**
- Five-Step détaillé → **Methodology**
- Écosystème entité par entité → **Platform**
- Histoire inventée, dates inventées, fondateurs glorifiés sans source dépôt
- Awards / press inventés

#### 6. CTA

**Unique :** « Voir les résultats que nous structurons » → Solutions  
EN : `See the outcomes we structure` → `/solutions`  
FR : `Voir les résultats structurés` → `/domaines`

#### 7. Entrée

Positioning · nav

#### 8. Sortie

Solutions

#### 9. SEO

| Champ | EN | FR |
|---|---|---|
| Intent | Informational — organization | Idem |
| Title | `About Clevones — Mission and Vision` | `À propos de Clevones — Mission et vision` |
| Description | Why Clevones exists: neutral architecture for territorial economic systems. | Pourquoi Clevones existe : architecture neutre des systèmes économiques territoriaux. |
| H1 | About / Mission (aligné label locale) | À propos / Mission |
| Keywords | mission, vision, territorial governance platform | mission, vision, gouvernance territoriale |
| Schema.org | `AboutPage` + `Organization` | Idem |

#### 10. UX

| Critère | Cible |
|---|---|
| Temps de lecture | 3–5 min |
| Longueur | 500–900 mots |
| Hiérarchie | H1 → Vision → Mission → Valeurs → CTA |
| Sections | Hero · Vision · Mission · Values · Neutrality · CTA |

#### 11. Composants

- Hero
- Blocs Vision / Mission
- Liste de valeurs (sobre)
- CTA unique

#### 12. Données

**Autorisé :** blueprint §1 · contenus about / mission existants · disclaimers.  
**Interdit :** biographie non versionnée · chiffres d’impact.

#### 13. Vérifications

- [ ] Vision et mission alignées blueprint
- [ ] Pas de catalogue Solutions
- [ ] CTA unique vers Solutions
- [ ] Schema AboutPage

---

### PAGE 06 — SOLUTIONS

#### 1. Objectif

Montrer **ce que CLEVONES produit comme résultats** dans ses champs d’intervention — jamais une liste de services vendables.

#### 2. Question utilisateur

« Que fait réellement CLEVONES ? » (**Q5**)

#### 3. Message principal

**CLEVONES structure des architectures territoriales gouvernées — des résultats de coordination, pas des prestations génériques.**

#### 4. Ce qui appartient à cette page

- Résultats / outcomes (lisibilité, cadres, coordination, readiness — formulations dépôt)
- Champs d’intervention issus de l’objet social (domaines déjà listés)
- Lien optionnel domaine → entité écosystème (nom déjà dans le dépôt)
- Clarification : objet social = capacité légale ; plateforme = posture architecturale
- Engagement simplifié (lecture → design → coordination) **en résumé** — détail méthode sur Methodology

#### 5. Ce qui est interdit

- « Nos services » / pricing / packages
- Five-Step complet → **Methodology**
- Doctrine conformité / filtres → **Governance**
- Détail modules / API → **Platform**
- Cas clients inventés
- Promesses de ROI

#### 6. CTA

**Unique :** « Voir comment nous procédons » → Methodology  
EN : `See how it works` → `/methodology`  
FR : `Voir comment nous procédons` → `/methodologie`

#### 7. Entrée

About · nav · teaser Home (si conservé hors hero)

#### 8. Sortie

Methodology

#### 9. SEO

| Champ | EN | FR |
|---|---|---|
| Intent | Informational / commercial-soft — outcomes | Idem |
| Title | `Solutions — Governed Territorial Architectures` | `Solutions — Architectures territoriales gouvernées` |
| Description | Outcomes across lawful fields of intervention — architecture, not generic services. | Résultats dans les champs d’intervention — architecture, pas services génériques. |
| H1 | Territorial architectures / outcomes framing | Architectures territoriales |
| Keywords | territorial architecture, domains of intervention | domaines d’intervention, architectures territoriales |
| Schema.org | `WebPage` (+ éventuel `ItemList` des domaines **sans** AggregateOffer) | Idem |

#### 10. UX

| Critère | Cible |
|---|---|
| Temps de lecture | 4–6 min |
| Longueur | 700–1100 mots |
| Hiérarchie | H1 outcomes → introduction posture → domaines comme champs → résumé engagement → CTA |
| Sections | Hero · Approach · Outcome domains · How engagement works (court) · CTA |

#### 11. Composants

- Hero
- Introduction
- Liste de domaines (peut être dense mais non « pricing cards »)
- Étapes d’engagement courtes (3 max)
- CTA unique (actions secondaires textuelles vers Methodology déjà = CTA ; pas de double primaire Contact)

#### 12. Données

**Autorisé :** `solutions` i18n · `corporate-purpose` / domaines · liens entités écosystème nommées dans le dépôt.  
**Interdit :** services inventés hors objet social · résultats chiffrés.

#### 13. Vérifications

- [ ] Langage « résultats / architectures » dominant
- [ ] Pas de pricing
- [ ] CTA unique vers Methodology
- [ ] Lien Platform seulement en mention, pas duplication map

---

### PAGE 07 — METHODOLOGY

#### 1. Objectif

Expliquer comment CLEVONES fonctionne : framework, processus, cycle.

#### 2. Question utilisateur

« Comment fonctionne CLEVONES ? » (**Q6**)

#### 3. Message principal

**Toute initiative suit le Cadre de gouvernance en cinq étapes — structure avant exécution.**

#### 4. Ce qui appartient à cette page

- Five-Step Governance Framework (01→05) complet
- Principes méthodologiques (neutralité, documentation, conformité, intelligence non sensible, collaboration contrôlée, discipline institutionnelle)
- Nature séquentielle du cycle
- Ce que chaque étape produit (livrables de gouvernance — pas ops)

#### 5. Ce qui est interdit

- Catalogue de domaines → **Solutions**
- Doctrine éligibilité / filtres clients → **Governance**
- Infrastructure technique / API → **Platform**
- Preuves / publications → **Evidence**
- Formulaire → **Contact**

#### 6. CTA

**Unique :** « Comprendre nos exigences de confiance » → Governance  
EN : `See our governance standards` → `/governance`  
FR : `Voir nos standards de gouvernance` → `/gouvernance`

#### 7. Entrée

Solutions · nav

#### 8. Sortie

Governance

#### 9. SEO

| Champ | EN | FR |
|---|---|---|
| Intent | Informational — process | Idem |
| Title | `Methodology — Five-Step Governance Framework` | `Méthodologie — Cadre de gouvernance en cinq étapes` |
| Description | Territorial Reading to Strategic Reporting — governed, sequential, non-operational. | De la lecture territoriale au reporting stratégique. |
| H1 | Five-Step Governance Framework | Cadre de gouvernance en cinq étapes |
| Keywords | territorial reading, flow mapping, governance structuring | lecture territoriale, cartographie des flux |
| Schema.org | `HowTo` **ou** `WebPage` + étapes structurées (préférer HowTo si fidèle au contenu) | Idem |

#### 10. UX

| Critère | Cible |
|---|---|
| Temps de lecture | 6–10 min |
| Longueur | 1000–1800 mots |
| Hiérarchie | H1 → intro → étapes 01–05 → principes → CTA |
| Sections | Hero · Introduction · Steps · Principles · CTA |

#### 11. Composants

- Hero
- Timeline / stepped process (composant methodology existant)
- Accordéons ou sections par étape
- Liste de principes
- CTA unique

#### 12. Données

**Autorisé :** `methodology` i18n · blueprint §5.  
**Interdit :** SLA inventés · durées d’engagement inventées · taux de succès.

#### 13. Vérifications

- [ ] Cinq étapes complètes et ordonnées
- [ ] Pas de filtres Governance dupliqués
- [ ] CTA unique vers Governance
- [ ] Schema HowTo cohérent ou WebPage + steps

---

### PAGE 08 — GOVERNANCE

#### 1. Objectif

Établir la crédibilité : neutralité, conformité, traçabilité, auditabilité, collaboration contrôlée.

#### 2. Question utilisateur

« Pourquoi faire confiance ? » (**Q7**)

#### 3. Message principal

**La confiance repose sur une doctrine gouvernée : structure, documentation, conformité, auditabilité — avant toute coordination.**

#### 4. Ce qui appartient à cette page

- Doctrine de gouvernance
- Principes de conformité
- Traitement des données / limites informationnelles
- Filtres d’éligibilité (6 critères dépôt)
- Non-éligible / exclusions
- Séparation gouvernance / opération (rappel)
- Traçabilité et auditabilité

#### 5. Ce qui est interdit

- Five-Step détaillé → **Methodology**
- Map modules / API → **Platform**
- Publications → **Evidence**
- Certifications inventées · ISO inventé · audits clients inventés
- Softening des critères pour « convertir »

#### 6. CTA

**Unique :** « Voir l’infrastructure » → Platform  
EN : `Explore the platform architecture` → `/ecosystem` *(URL actuelle)*  
FR : `Explorer l’architecture de plateforme` → `/ecosysteme`

#### 7. Entrée

Methodology · nav

#### 8. Sortie

Platform

#### 9. SEO

| Champ | EN | FR |
|---|---|---|
| Intent | Informational — trust / compliance | Idem |
| Title | `Governance — Compliance and Controlled Collaboration` | `Gouvernance — Conformité et collaboration contrôlée` |
| Description | Doctrine, compliance principles, eligibility filters, auditable coordination. | Doctrine, conformité, filtres d’éligibilité, coordination auditable. |
| H1 | Governance, compliance, controlled collaboration | Gouvernance, conformité, collaboration contrôlée |
| Keywords | compliance, auditability, eligibility, neutral governance | conformité, auditabilité, éligibilité |
| Schema.org | `WebPage` + `BreadcrumbList` | Idem |

#### 10. UX

| Critère | Cible |
|---|---|
| Temps de lecture | 5–8 min |
| Longueur | 800–1400 mots |
| Hiérarchie | H1 → doctrine → compliance → data → filters → not eligible → CTA |
| Sections | Hero · Doctrine · Compliance · Data handling · Filtering · Not eligible · CTA |

#### 11. Composants

- Hero
- Sections texte institutionnelles
- Grille de principes / filtres
- Liste d’exclusions
- CTA unique  
- **Pas** de faux badges « certified »

#### 12. Données

**Autorisé :** `governance` i18n · disclaimers · filtres contact.  
**Interdit :** certifications non présentes dans le dépôt · noms d’auditeurs inventés.

#### 13. Vérifications

- [ ] Filtres complets
- [ ] Exclusions claires
- [ ] Aucune certification inventée
- [ ] CTA unique vers Platform

---

### PAGE 09 — PLATFORM

#### 1. Objectif

Présenter l’architecture d’infrastructure : hub, modules / entités, écosystème, interopérabilité — ce que CLEVONES **possède comme système**.

#### 2. Question utilisateur

« Quelle infrastructure possède CLEVONES ? » (**Q8**)

#### 3. Message principal

**CLEVONES est le hub de gouvernance neutre ; des plateformes spécialisées étendent les capacités de domaine — l’opération de terrain reste séparée.**

#### 4. Ce qui appartient à cette page

- Hub central CLEVONES (rôle)
- Entités documentées : Clevodia, Clevonet, Bicuni, Btlearn Inc., Clevone Mining
- Mandats / rôles / domaines (tels que dépôt)
- Distinction opérationnel vs non-opérationnel
- Disclaimer Clevone Mining
- Architecture « gouvernance au centre, spécialisation au périmètre »
- Interopérabilité **qualitative** (coordination via hub ; extranet Clevonet) — **sans** inventer endpoints API publics non documentés
- Modules conceptuels seulement s’ils existent dans le dépôt ; sinon décrire l’écosystème tel quel

#### 5. Ce qui est interdit

- Refaire Solutions (domaines comme catalogue commercial)
- Refaire Methodology
- Refaire Evidence
- Confondre avec footer SaaS Sign-in / Portal
- Inventer partenaires cloud, uptime %, clients API
- Roadmap produit inventée

#### 6. CTA

**Unique :** « Voir les preuves documentées » → Evidence  
EN : `Review documented evidence` → `/insights`  
FR : `Consulter les preuves documentées` → `/analyses`

#### 7. Entrée

Governance · nav

#### 8. Sortie

Evidence

#### 9. SEO

| Champ | EN | FR |
|---|---|---|
| Intent | Informational — platform / ecosystem architecture | Idem |
| Title | `Platform — Clevones Hub and Specialized Infrastructure` | `Plateforme — Hub Clevones et infrastructure spécialisée` |
| Description | Neutral hub plus specialized entities for media, secure digital infrastructure, knowledge, education, and separated operations. | Hub neutre et entités spécialisées. |
| H1 | Platform architecture / Hub + perimeter | Architecture de plateforme |
| Keywords | ecosystem, extranet, coordination hub | écosystème, extranet, hub de coordination |
| Schema.org | `WebPage` + éventuel `ItemList` des entités | Idem |

**Note URL :** paths actuels `ecosystem` / `ecosysteme` jusqu’à migration éventuelle.

#### 10. UX

| Critère | Cible |
|---|---|
| Temps de lecture | 4–7 min |
| Longueur | 600–1200 mots |
| Hiérarchie | H1 → hub → map/entités → séparation ops → CTA |
| Sections | Hero · Map · Entity roster · Disclaimer · CTA |

#### 11. Composants

- Hero
- Ecosystem map (composant existant)
- Entity list
- Disclaimer Mining
- CTA unique

#### 12. Données

**Autorisé :** `ecosystem` i18n · URLs entités déjà listées · disclaimers.  
**Interdit :** nouvelles entités non versionnées · métriques d’infra inventées · spécifications API fictives.

#### 13. Vérifications

- [ ] Hub clairement CLEVONES
- [ ] Mining marqué opérationnel / séparé
- [ ] Pas de confusion Access SaaS
- [ ] CTA unique vers Evidence
- [ ] Aucune entité inventée

---

### PAGE 10 — EVIDENCE

#### 1. Objectif

Présenter les **preuves documentaires existantes** : publications, notes, standards ouverts s’ils existent, documentation — jamais inventer.

#### 2. Question utilisateur

« Quelles preuves existent ? » (**Q9**)

#### 3. Message principal

**La crédibilité se construit par des documents vérifiables — analyses structurelles, doctrine publiée, architecture ouverte — pas par des revendications.**

#### 4. Ce qui appartient à cette page

- Index des Insights / Analyses **existants** (slugs du dépôt)
- Abstracts / catégories existants
- Statut honnête des corps d’articles (« forthcoming » si c’est le cas dans le dépôt)
- Liens vers doctrine / méthodologie / gouvernance comme « preuves structurelles » (documents du site, pas des awards)
- Open specifications / roadmap / standards : **uniquement s’ils existent dans le dépôt** ; sinon section absente ou « non publié »
- Publications Clevodia seulement si liées et vérifiables dans le projet — sinon ne pas inventer un flux presse

#### 5. Ce qui est interdit

- Cas clients inventés
- Témoignages inventés
- Logos partenaires inventés
- Métriques d’impact inventées
- « Trusted by » sans source
- Transformer Evidence en blog marketing

#### 6. CTA

**Unique :** « Lever les dernières objections » → FAQ  
EN : `Read institutional FAQ` → `/faq`  
FR : `Lire la FAQ institutionnelle` → `/questions-frequentes`

#### 7. Entrée

Platform · nav · articles liés

#### 8. Sortie

FAQ

#### 9. SEO

| Champ | EN | FR |
|---|---|---|
| Intent | Informational — thought leadership / proof | Idem |
| Title | `Evidence — Strategic Notes and Documentation` | `Preuves — Notes stratégiques et documentation` |
| Description | Documented strategic notes on territorial economic governance. No fabricated case studies. | Notes stratégiques documentées. Aucun cas inventé. |
| H1 | Evidence / Strategic notes | Preuves / Analyses |
| Keywords | territorial governance insights, investment readiness notes | analyses gouvernance territoriale |
| Schema.org | `CollectionPage` + `Article` (par note, quand corps publié) | Idem |

#### 10. UX

| Critère | Cible |
|---|---|
| Temps de lecture | Index 2–3 min ; article selon `readingTime` dépôt |
| Longueur | Index : listing ; articles : statut réel |
| Hiérarchie | H1 → intro honesty → categories → listing → CTA |
| Sections | Hero · Introduction · Categories · Listing · CTA |

#### 11. Composants

- Hero
- Category list
- Insight cards (interaction = navigation article — cards autorisées)
- Article page chrome
- CTA unique sur index

#### 12. Données

**Autorisé :** `insights` i18n · slugs existants · chrome « forthcoming ».  
**Interdit :** nouveaux « success stories » · PDF inventés · citations inventées.

#### 13. Vérifications

- [ ] Chaque item traçable au dépôt
- [ ] Forthcoming explicite si applicable
- [ ] Aucun cas inventé
- [ ] CTA unique vers FAQ

---

### PAGE 11 — FAQ

#### 1. Objectif

Répondre aux objections et clarifier les malentendus — avant Contact.

#### 2. Question utilisateur

« Qu’est-ce qui pourrait encore m’empêcher d’engager une conversation ? »

#### 3. Message principal

**Les questions institutionnelles ont des réponses structurelles — rôle, objet social, écosystème, éligibilité, démarrage.**

#### 4. Ce qui appartient à cette page

- FAQ existantes (et extensions **non inventées** si dérivées du blueprint)
- Clarifications : rôle, objet social, multi-service?, écosystème, Mining, qui peut engager, ce que CLEVONES ne fait pas, comment commence la collaboration
- Objections typiques (neutralité, conflit d’intérêt, « est-ce un cabinet ? », « vendez-vous des services ? »)

#### 5. Ce qui est interdit

- Nouvelle doctrine non présente ailleurs
- Nouveaux domaines non listés
- Soft CTA commercial multiple
- Contredire Positioning / Governance

#### 6. CTA

**Unique :** « Commencer une conversation structurée » → Contact  
EN : `Start a structured conversation` → `/contact`  
FR : `Commencer une conversation structurée` → `/collaboration`

#### 7. Entrée

Evidence · footer · parcours

#### 8. Sortie

Contact

#### 9. SEO

| Champ | EN | FR |
|---|---|---|
| Intent | Informational — FAQ | Idem |
| Title | `FAQ — Institutional Questions` | `FAQ — Questions institutionnelles` |
| Description | Structural answers on role, corporate purpose, ecosystem, and engagement criteria. | Réponses structurelles sur le rôle, l’objet social, l’écosystème et l’engagement. |
| H1 | Institutional questions, structural answers | Questions institutionnelles, réponses structurelles |
| Keywords | Clevones FAQ, engagement criteria | FAQ Clevones, critères d’engagement |
| Schema.org | `FAQPage` | Idem |

#### 10. UX

| Critère | Cible |
|---|---|
| Temps de lecture | 4–8 min |
| Longueur | 8–15 questions (qualité > quantité) |
| Hiérarchie | H1 → accordion Q/R → CTA |
| Sections | Hero · FAQ list · CTA |

#### 11. Composants

- Hero
- Accordion FAQ (composant existant)
- CTA unique  
- Schema FAQPage aligné sur les questions visibles

#### 12. Données

**Autorisé :** `faq` i18n · blueprint · brand-positioning.  
**Interdit :** réponses qui inventent des faits.

#### 13. Vérifications

- [ ] FAQPage JSON-LD = questions visibles
- [ ] Pas de contradiction avec Governance
- [ ] Un seul CTA vers Contact
- [ ] Accessibilité accordion (clavier, aria-expanded)

---

### PAGE 12 — CONTACT

#### 1. Objectif

Commencer une conversation institutionnelle structurée. **Jamais vendre.**

#### 2. Question utilisateur

« Comment commencer ? » (**Q10**)

#### 3. Message principal

**L’engagement commence par une initiative documentée — examinée selon des critères de gouvernance, pas par un échange commercial informel.**

#### 4. Ce qui appartient à cette page

- Hero conversationnel / institutionnel
- Formulaire d’initiative structurée (champs dépôt)
- Intents : `initiative` · `eligibility` · `collaboration` (paramètres existants)
- Acknowledgment de gouvernance obligatoire
- Guidance « what happens next »
- Types d’acteurs et stades d’initiative (dépôt)

#### 5. Ce qui est interdit

- Pricing · démos produit agressives · « Talk to sales »
- Promesse de réponse en X heures inventée
- Contournement des filtres Governance
- Multi-CTA marketing

#### 6. CTA

**Unique (action de page) :** soumettre le formulaire — label selon intent  
EN exemples dépôt : `Submit structured initiative` / `Request eligibility review`  
FR : équivalents `/collaboration`

Pas de second bouton primaire vers une autre page commerciale.

#### 7. Entrée

FAQ · header CTA · CTAs de fin de parcours (tous convergent ici) · intents query

#### 8. Sortie

- Succès : confirmation + attente de revue institutionnelle (pas upsell)
- Échec validation : rester sur page avec erreurs accessibles

#### 9. SEO

| Champ | EN | FR |
|---|---|---|
| Intent | Transactional-soft / contact | Idem |
| Title | `Contact — Structured Collaboration` | `Collaboration — Conversation structurée` |
| Description | Submit a documented initiative for governed institutional review. | Soumettre une initiative documentée pour examen institutionnel. |
| H1 | Selon intent (collaboration / initiative / eligibility) | Idem FR |
| Keywords | structured initiative, institutional collaboration | initiative structurée, collaboration institutionnelle |
| Schema.org | `ContactPage` | Idem |

#### 10. UX

| Critère | Cible |
|---|---|
| Temps | Complétion formulaire 5–10 min |
| Longueur | Formulaire guidé, sections claires |
| Hiérarchie | H1 → guidance courte → formulaire → acknowledgment → submit |
| Sections | Hero · Guidance · Form · Success state |

#### 11. Composants

- Hero
- Form (sections)
- Intent switching (si conservé)
- Success / error states
- **Pas** de chat widget agressif

#### 12. Données

**Autorisé :** `contact` i18n · validation `initiative-submission` · options acteur/stade.  
**Interdit :** CRM claims · « 200+ partners » · délais inventés.

#### 13. Vérifications

- [ ] Un seul submit primaire
- [ ] Acknowledgment gouvernance
- [ ] Messages d’erreur accessibles
- [ ] Pas de vente
- [ ] Intent URLs i18n correctes EN/FR
- [ ] ContactPage schema · noindex? (selon politique SEO actuelle du site — conserver cohérence dépôt)

---

## 3. Matrices officielles

### 3.1 Matrice parcours — Question → Page → CTA → Page suivante → Objectif

| # | Question | Page | CTA (libellé cible) | Page suivante | Objectif |
|---|---|---|---|---|---|
| Q0 | Cette plateforme mérite-t-elle mon attention ? | **Home** | Understand the challenge / Comprendre l’enjeu | Challenge | Attention |
| Q1 | Quel problème existe ? | **Challenge** | Why this matters now / Pourquoi agir maintenant | Why Now | Problème |
| Q2 | Pourquoi maintenant ? | **Why Now** | See how Clevones is different / Voir ce qui différencie | Positioning | Urgence |
| Q3–D | Pourquoi les classiques échouent / différence ? | **Positioning** | Why Clevones exists / Pourquoi Clevones existe | About | Différenciation |
| Q4 | Pourquoi CLEVONES existe ? | **About** | See the outcomes / Voir les résultats | Solutions | Raison d’être |
| Q5 | Que fait CLEVONES ? | **Solutions** | See how it works / Voir comment nous procédons | Methodology | Résultats |
| Q6 | Comment ça fonctionne ? | **Methodology** | See governance standards / Voir standards de gouvernance | Governance | Processus |
| Q7 | Pourquoi faire confiance ? | **Governance** | Explore platform architecture / Explorer l’architecture | Platform | Crédibilité |
| Q8 | Quelle infrastructure ? | **Platform** | Review documented evidence / Consulter les preuves | Evidence | Architecture |
| Q9 | Quelles preuves ? | **Evidence** | Read institutional FAQ / Lire la FAQ | FAQ | Preuves |
| Obj. | Quelles objections restent ? | **FAQ** | Start a structured conversation / Conversation structurée | Contact | Clarification |
| Q10 | Comment commencer ? | **Contact** | Submit form (intent) | — (success) | Conversation |

---

### 3.2 Matrice des doublons

| Page A | Page B | Conflit | Résolution |
|---|---|---|---|
| Home | Challenge | Problème structurel dupliqué | Home : 0–1 phrase max ; détail → Challenge |
| Home | Positioning | Est/n’est pas sur Home | Retirer du Home long-form ; lien parcours |
| Home | Solutions | Domaines sur Home | Teaser interdit en Phase 2 cible ; ou 1 lien texte |
| Home | Methodology | Steps sur Home | Interdit sur Home cible |
| Home | Platform | Map écosystème sur Home | Interdit sur Home cible |
| Home | Evidence | Listing Insights sur Home | Interdit sur Home cible |
| Challenge | Why Now | Urgence vs problème | Challenge = nature du problème ; Why Now = pressions temporelles |
| Challenge | Positioning | « Pourquoi ça échoue » | Challenge = symptômes systémiques ; Positioning = échec des modèles d’acteurs + Est/N’est pas |
| Positioning | About | Différence vs existence | Positioning = frontière identité ; About = mission/vision/valeurs |
| Positioning | FAQ | Est/n’est pas | FAQ renvoie / résume ; source canonique = Positioning |
| About | Solutions | Objet social | About mentionne capacité ; Solutions détaille champs/outcomes |
| Solutions | Methodology | « How engagement works » | Solutions = résumé 3 lignes ; Methodology = 5 étapes complètes |
| Solutions | Platform | Domaines vs entités | Solutions = champs d’intervention ; Platform = hub + entités nommées |
| Methodology | Governance | Conformité | Methodology = discipline du process ; Governance = doctrine + filtres + data |
| Governance | FAQ | Éligibilité | Governance = source ; FAQ = Q/R courte + lien |
| Governance | Contact | Filtres | Contact applique ; Governance explique |
| Platform | Evidence | « Preuves d’infra » | Platform = architecture ; Evidence = documents/notes |
| Platform | Footer Access | Mot « Platform » | Footer SaaS → label **Access/Accès** ; page CEOS = Platform |
| Evidence | About | Crédibilité narrative | Evidence = artefacts ; About = raison d’être |
| FAQ | toutes | Contenu nouveau | FAQ ne crée pas de doctrine ; elle clarifie |
| Contact | Solutions | « Acheter » | Contact = conversation documentée ; jamais pricing |

---

### 3.3 Matrice des CTA (un seul par page)

| Page | CTA unique | Destination | Type |
|---|---|---|---|
| Home | Understand the challenge | Challenge | Continuity |
| Challenge | Why this matters now | Why Now | Continuity |
| Why Now | See how Clevones is different | Positioning | Continuity |
| Positioning | Why Clevones exists | About | Continuity |
| About | See the outcomes we structure | Solutions | Continuity |
| Solutions | See how it works | Methodology | Continuity |
| Methodology | See our governance standards | Governance | Continuity |
| Governance | Explore the platform architecture | Platform | Continuity |
| Platform | Review documented evidence | Evidence | Continuity |
| Evidence | Read institutional FAQ | FAQ | Continuity |
| FAQ | Start a structured conversation | Contact | Conversion douce |
| Contact | Submit structured initiative / eligibility | (submit) | Action |

**Règles CTA :**

1. Un seul bouton/style primaire par page.
2. Le CTA header Contact est **chrome global**, pas le CTA de page (sauf sur Contact).
3. Les liens textuels in-content vers pages non-suivantes sont autorisés s’ils ne rivalisent pas visuellement avec le CTA primaire.
4. Les pages actuelles à CTA multiples (Solutions, FAQ, Insights) doivent être **réduites à un primaire** à l’implémentation Phase 2.

---

### 3.4 Matrice SEO

| Page | Intent | Title pattern EN | H1 focus | Schema.org | Index |
|---|---|---|---|---|---|
| Home | Navigational | Brand + tagline | Brand / UVP courte | `Organization`, `WebSite` | yes |
| Challenge | Informational | Challenge + Clevones | Structural problem | `WebPage`, `BreadcrumbList` | yes |
| Why Now | Informational | Why now + Clevones | Timing pressures | `WebPage`, `BreadcrumbList` | yes |
| Positioning | Informational | Positioning — is/is not | Is / is not | `WebPage`, `BreadcrumbList` | yes |
| About | Informational | About — mission vision | Mission / About | `AboutPage`, `Organization` | yes |
| Solutions | Informational | Solutions — architectures | Outcomes / domains | `WebPage`, `ItemList?` | yes |
| Methodology | Informational | Methodology — Five-Step | Framework | `HowTo` or `WebPage` | yes |
| Governance | Informational | Governance — compliance | Doctrine | `WebPage`, `BreadcrumbList` | yes |
| Platform | Informational | Platform — hub & infrastructure | Architecture | `WebPage`, `ItemList?` | yes |
| Evidence | Informational | Evidence — notes | Notes index | `CollectionPage`, `Article` | yes |
| FAQ | Informational | FAQ — institutional | FAQ | `FAQPage` | yes |
| Contact | Contact | Contact — structured | Intent title | `ContactPage` | yes* |
| Legal | Legal | Legal notice | Legal | `WebPage` | noindex (si politique actuelle) |
| Privacy | Legal | Privacy | Privacy | `WebPage` | noindex (si politique actuelle) |

\* Conserver la politique d’indexation actuelle du dépôt si Contact est indexable.

**Obligatoire sur chaque page indexable :**

- `title` · `description` · Open Graph · Twitter card  
- `canonical` · `hreflang` (`en`, `fr`, `x-default`)  
- H1 unique · H2 cohérents  
- JSON-LD validé  

---

### 3.5 Matrice i18n

| Page CEOS | PageKey cible | Label EN | Label FR | Slug EN | Slug FR | Canonical EN | Canonical FR | hreflang |
|---|---|---|---|---|---|---|---|---|
| Home | `home` | Home | Accueil | `/` | `/accueil` | `https://…/` | `https://…/accueil` | en↔fr |
| Challenge | `challenge` *(nouveau)* | Challenge | Enjeu | `/challenge` | `/enjeu` | `…/challenge` | `…/enjeu` | en↔fr |
| Why Now | `whyNow` *(nouveau)* | Why Now | Pourquoi maintenant | `/why-now` | `/pourquoi-maintenant` | `…/why-now` | `…/pourquoi-maintenant` | en↔fr |
| Positioning | `positioning` | Positioning | Positionnement | `/positioning` | `/positionnement` | inchangé | inchangé | en↔fr |
| About | `about` | About | À propos | `/about` | `/mission` | inchangé | inchangé | en↔fr |
| Solutions | `solutions` | Solutions | Solutions | `/solutions` | `/domaines` | inchangé | inchangé | en↔fr |
| Methodology | `methodology` | Methodology | Méthodologie | `/methodology` | `/methodologie` | inchangé | inchangé | en↔fr |
| Governance | `governance` | Governance | Gouvernance | `/governance` | `/gouvernance` | inchangé | inchangé | en↔fr |
| Platform | `ecosystem` *(key stable)* | Platform | Plateforme | `/ecosystem` | `/ecosysteme` | inchangé | inchangé | en↔fr |
| Evidence | `insights` *(key stable)* | Evidence | Analyses | `/insights` | `/analyses` | inchangé | inchangé | en↔fr |
| FAQ | `faq` | FAQ | FAQ | `/faq` | `/questions-frequentes` | inchangé | inchangé | en↔fr |
| Contact | `contact` | Contact | Collaboration | `/contact` | `/collaboration` | inchangé | inchangé | en↔fr |

**Notes i18n :**

1. Les `PageKey` `ecosystem` et `insights` restent stables pour ne pas casser le code ; les **labels** et le **rôle CEOS** changent.
2. FR `/mission` pour About est conservé (historique SEO) ; label nav = « À propos ».
3. FR Evidence label = **Analyses** (aligné slug) ou **Preuves** — décision d’implémentation : préférer **Analyses** pour cohérence URL, sous-titre « Preuves documentaires ».
4. Toute nouvelle page **doit** enregistrer paths dans `lib/i18n/routes.ts` avant création App Router.
5. Language switcher : jamais inventer une page alternate ; `getAlternatePath` only.

---

## 4. Diagramme complet du parcours CEOS

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         CLEVONES — CEOS JOURNEY                          │
│            Institutional platform · one question per page                │
└──────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────┐
              SEO/Brand  │    HOME     │  Attention only
                         │  (Q0)       │
                         └──────┬──────┘
                                │ CTA: Understand the challenge
                                ▼
                         ┌─────────────┐
                         │  CHALLENGE  │  Q1 Problem
                         └──────┬──────┘
                                │ CTA: Why this matters now
                                ▼
                         ┌─────────────┐
                         │  WHY NOW    │  Q2 Urgency
                         └──────┬──────┘
                                │ CTA: See how Clevones is different
                                ▼
                         ┌─────────────┐
                         │ POSITIONING │  Q3 Failure of classics
                         │             │  + differentiation
                         └──────┬──────┘
                                │ CTA: Why Clevones exists
                                ▼
                         ┌─────────────┐
                         │   ABOUT     │  Q4 Existence
                         └──────┬──────┘
                                │ CTA: See the outcomes
                                ▼
                         ┌─────────────┐
                         │ SOLUTIONS   │  Q5 Outcomes
                         └──────┬──────┘
                                │ CTA: See how it works
                                ▼
                         ┌─────────────┐
                         │ METHODOLOGY │  Q6 How it works
                         └──────┬──────┘
                                │ CTA: Governance standards
                                ▼
                         ┌─────────────┐
                         │ GOVERNANCE  │  Q7 Trust
                         └──────┬──────┘
                                │ CTA: Platform architecture
                                ▼
                         ┌─────────────┐
                         │  PLATFORM   │  Q8 Infrastructure
                         │ (ecosystem) │
                         └──────┬──────┘
                                │ CTA: Documented evidence
                                ▼
                         ┌─────────────┐
                         │  EVIDENCE   │  Q9 Proof
                         │ (insights)  │
                         └──────┬──────┘
                                │ CTA: Institutional FAQ
                                ▼
                         ┌─────────────┐
                         │    FAQ      │  Objections
                         └──────┬──────┘
                                │ CTA: Structured conversation
                                ▼
                         ┌─────────────┐
                         │  CONTACT    │  Q10 Start
                         │  (form)     │
                         └─────────────┘

  Header chrome (global, not page CTA):
  [Language] [Access/Sign-in] [Contact ── shortcut to end]

  Out of journey (legal):
  Legal Notice · Privacy

  Out of journey (SaaS preparatory):
  Sign-in · Portal  ← labeled "Access", never "Platform"
```

### 4.1 Vue questions (30 secondes)

```text
Attention → Problem → Urgency → Difference → Purpose
    → Outcomes → Method → Trust → Infrastructure → Proof
    → Objections → Conversation
```

Si le visiteur ne lit que Home + Challenge + Positioning, il doit déjà comprendre : **problème · différence · invitation à continuer**.

---

## 5. Navigation cible

### 5.1 Main nav (ordre CEOS)

1. Challenge  
2. Why Now  
3. Positioning  
4. About  
5. Solutions  
6. Methodology  
7. Governance  
8. Platform *(key `ecosystem`)*  
9. Evidence *(key `insights`)*  

### 5.2 Secondary / legal

FAQ · Contact · Legal · Privacy  

### 5.3 Access (ex-footer Platform SaaS)

Sign in · Client portal  

---

## 6. Home — état cible vs état actuel

| Élément actuel Home | Décision CEOS |
|---|---|
| Hero | **Conserver / recentrer** |
| Positioning block | **Retirer** → page Positioning |
| Structural problem | **Retirer** → page Challenge (teaser ≤1 phrase optionnel) |
| Domains preview | **Retirer** |
| Methodology preview | **Retirer** |
| Strategic pillars | **Évaluer** : si = Why Now/About, retirer ; sinon fusionner dans About |
| Ecosystem preview | **Retirer** |
| Client filtering | **Retirer** → Governance |
| Insights preview | **Retirer** |
| Final CTA dual | **Remplacer** par CTA unique Challenge (+ Contact chrome) |

---

## 7. Contenu autorisé vs interdit (global)

### 7.1 Autorisé (sources)

- `docs/business-architecture-blueprint.md`
- `lib/constants/brand-positioning.ts`
- `lib/i18n/content/pages/**`
- Constantes objet social / domaines déjà versionnées
- Entités écosystème listées
- Insights slugs + abstracts existants
- Disclaimers Mining / neutralité

### 7.2 Interdit (global)

Clients nommés · chiffres d’impact · awards · certifications non versionnées · témoignages · logos partenaires · cas d’étude fictionnels · montants d’investissement · parts de marché · classements · « leaders mondiaux » auto-proclamés · roadmaps datées inventées · spécifications API fictives

---

## 8. Accessibilité (constitution UX)

Chaque page doit garantir :

- WCAG 2.x AA contraste
- Navigation clavier complète
- Focus visible
- ARIA correcte (accordion FAQ, map si interactive, formulaires)
- H1 unique
- Ordre de titres logique
- Textes de liens descriptifs (pas « click here »)
- Form labels explicites ; erreurs liées aux champs

---

## 9. Critères d’acceptation Phase 2 (produit)

Une implémentation n’est **acceptée** que si :

1. Le parcours Q0→Q10 est navigable dans l’ordre CEOS.  
2. Chaque page a **un** CTA primaire conforme à la matrice §3.3.  
3. Challenge et Why Now existent EN+FR avec SEO + hreflang.  
4. Home ne duplique plus le mini-site.  
5. Aucune preuve inventée n’a été introduite.  
6. i18n routes registry synchronisé.  
7. Build, lint, TypeScript, a11y de base OK.  
8. Labels Platform / Evidence / Access désambiguïsés.  
9. Ce blueprint a été respecté page par page (checklists §2).  

---

## 10. Décisions ouvertes (à trancher avant code)

| ID | Décision | Options | Recommandation |
|---|---|---|---|
| D1 | Renommer URLs `ecosystem` → `platform` | Garder / Migrer 301 | **Garder** en v2.0 implémentation ; migrer plus tard |
| D2 | Renommer URLs `insights` → `evidence` | Garder / Migrer | **Garder** ; label Evidence EN, Analyses FR |
| D3 | Label FR Evidence | Preuves vs Analyses | **Analyses** (URL) + sous-titre Preuves |
| D4 | Pillars Home | Supprimer / About / Why Now | **Supprimer de Home** ; réutiliser copy si pertinent dans Why Now/About |
| D5 | About FR path `/mission` | Garder / `/a-propos` | **Garder** `/mission` |
| D6 | Contact indexability | index / noindex | Suivre politique dépôt actuelle |
| D7 | Schema Methodology | `HowTo` vs `WebPage` | **`HowTo`** si étapes fidèles et non marketing |

Ces décisions ne bloquent pas la **validité** de ce document ; elles bloquent certaines étapes d’implémentation.

---

## 11. Journal

| Version | Date | Changement |
|---|---|---|
| 2.0 | 2026-07-29 | Constitution Produit CEOS initiale — specs 12 pages, matrices, diagrammes, règles |

---

## 12. Phrase de clôture constitutionnelle

> **Chaque page augmente la compréhension, la crédibilité, la confiance et la conversion — sans jamais diminuer la vérité du dépôt ni la qualité technique.**

Fin du document.  
**Référence unique avant toute implémentation Phase 2.**
