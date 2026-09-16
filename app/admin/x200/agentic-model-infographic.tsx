const comparisonRows = [
  ["Rôle de l’utilisateur", "Utilisateur actif — fait le travail", "Superviseur — définit l’objectif et valide les exceptions"],
  ["Mécanisme d’exécution", "Fonctionnalités manuelles — clics et formulaires", "Exécution d’objectifs — processus complets"],
  ["Capacités autonomes", "Aucune — l’utilisateur exécute", "Planification, outils, API et workflows"],
  ["Logique", "Statique — basée sur l’interface", "Dynamique et adaptative — plan → action → feedback"],
  ["Modèle économique", "Abonnement par utilisateur", "Abonnement + usage + outcome"],
  ["Unité de valeur", "Accès au logiciel", "Travail accompli / résultat obtenu"],
] as const;

const businessApps = [
  ["CRM", "Commercial"],
  ["DMS", "Documents"],
  ["Finance", "Facturation"],
  ["Paiements", "Rapprochement"],
  ["Inventaire", "Opérations"],
  ["Administration", "RH"],
  ["BM Operations", "Projets"],
] as const;

const agenticCore = [
  ["Agent Registry", "agents, capacités, permissions"],
  ["X200 Orchestrator", "choisit le meilleur agent"],
  ["Task & Event Bus", "workflows et déclencheurs"],
  ["Policy & Approval Engine", "règles et niveaux de risque"],
  ["Audit & Observability", "journaux, métriques, traçabilité"],
] as const;

const workers = [
  ["Grok", "xAI"],
  ["ChatGPT", "OpenAI"],
  ["Cursor", "Développement"],
  ["Agents CLEVONE", "Finance, Commercial, DMS…"],
  ["Futurs Agents", "Autres fournisseurs"],
] as const;

const gateways = [
  "API REST",
  "MCP",
  "Base de données",
  "Email / Notifications",
  "Stockage documents",
  "Paiements",
  "GitHub",
  "Services externes",
  "Autres connecteurs",
] as const;

const actions = [
  "Lire",
  "Analyser",
  "Créer / Mettre à jour",
  "Envoyer",
  "Rapprocher",
  "Générer",
  "Planifier",
  "Alerter",
  "Exécuter selon permissions",
] as const;

const outcomes = [
  "Factures rapprochées",
  "Leads qualifiés",
  "Documents traités",
  "Workflows complétés",
  "Cas résolus",
  "Gain de temps",
  "Réduction des coûts",
  "Croissance",
] as const;

const useCases = [
  ["Commercial", "Trouve et qualifie les prospects, prépare les propositions et remonte uniquement les décisions à valider."],
  ["Finance", "Vérifie les paiements, rapproche les factures, met à jour les comptes clients et signale les anomalies."],
  ["DMS", "Classe les documents, extrait les informations clés, détecte les expirations et alerte sur les éléments critiques."],
  ["Administration", "Prépare les rapports, collecte les données, génère les documents et planifie les prochaines échéances."],
  ["Support", "Analyse les demandes, répond aux questions courantes et escalade uniquement les cas complexes."],
] as const;

function MiniCard({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-sm border border-border-subtle bg-surface-muted px-3 py-3 text-center">
      <p className="text-xs font-semibold text-white">{title}</p>
      <p className="mt-1 text-[10px] leading-4 text-gray-muted">{subtitle}</p>
    </div>
  );
}

function FlowArrow() {
  return (
    <div aria-hidden="true" className="flex justify-center py-1 text-lg text-gold">
      ↓
    </div>
  );
}

export function AgenticModelInfographic() {
  return (
    <section
      data-testid="x200-agentic-model-infographic"
      className="overflow-hidden rounded-sm border border-border-subtle bg-surface-elevated"
    >
      <div className="border-b border-border-subtle bg-gradient-to-r from-blue-500/15 via-surface-elevated to-cyan-500/10 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.26em] text-gold uppercase">
              CLEVONE X200 • Référence stratégique
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold text-white sm:text-3xl">
              DE L’OUTIL AU RÉSULTAT
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-gray-muted">
              Une nouvelle façon de concevoir le logiciel d’entreprise : humains + agents IA + données + outils = résultats réels.
            </p>
          </div>
          <div className="rounded-sm border border-cyan-500/30 bg-cyan-500/5 px-4 py-3 text-xs leading-5 text-cyan-200">
            Construit pour la RDC et l’Afrique francophone • ouvert sur le monde
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[0.95fr_2.05fr]">
        <div className="space-y-6">
          <section>
            <div className="mb-3 rounded-sm bg-slate-900/70 px-3 py-2">
              <h3 className="text-xs font-semibold tracking-wide text-white uppercase">
                1. Comparaison des modèles
              </h3>
            </div>
            <div className="overflow-hidden rounded-sm border border-border-subtle">
              <div className="grid grid-cols-[0.85fr_1fr_1fr] bg-surface-muted text-[10px] font-semibold text-white">
                <div className="p-2">Dimension</div>
                <div className="border-l border-border-subtle p-2">SaaS traditionnel</div>
                <div className="border-l border-border-subtle bg-blue-500/10 p-2 text-blue-200">CLEVONE Agentique</div>
              </div>
              {comparisonRows.map(([dimension, classic, agentic]) => (
                <div key={dimension} className="grid grid-cols-[0.85fr_1fr_1fr] border-t border-border-subtle text-[10px] leading-4">
                  <div className="bg-surface-muted p-2 font-medium text-white">{dimension}</div>
                  <div className="border-l border-border-subtle p-2 text-gray-muted">{classic}</div>
                  <div className="border-l border-border-subtle bg-blue-500/5 p-2 text-blue-100">{agentic}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 rounded-sm bg-slate-900/70 px-3 py-2">
              <h3 className="text-xs font-semibold tracking-wide text-white uppercase">
                2. Exemples concrets
              </h3>
            </div>
            <div className="space-y-2">
              {useCases.map(([name, description]) => (
                <div key={name} className="grid grid-cols-[6.5rem_1fr] overflow-hidden rounded-sm border border-border-subtle">
                  <div className="bg-blue-500/10 px-3 py-2 text-[11px] font-semibold text-blue-200">{name}</div>
                  <p className="px-3 py-2 text-[11px] leading-4 text-gray-muted">{description}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 rounded-sm bg-slate-900/70 px-3 py-2">
              <h3 className="text-xs font-semibold tracking-wide text-white uppercase">
                3. Modèle économique flexible
              </h3>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 rounded-sm border border-border-subtle bg-surface-muted p-3 text-center">
              <MiniCard title="Abonnement" subtitle="Accès à la plateforme" />
              <span className="text-gold">+</span>
              <MiniCard title="Usage" subtitle="Opérations consommées" />
              <span className="text-gold">+</span>
              <MiniCard title="Outcome" subtitle="Résultats obtenus" />
            </div>
          </section>
        </div>

        <div>
          <div className="mb-3 rounded-sm bg-slate-900/70 px-3 py-2">
            <h3 className="text-xs font-semibold tracking-wide text-white uppercase">
              4. Architecture CLEVONE Agentique
            </h3>
            <p className="mt-1 text-[10px] text-gray-muted">
              Une plateforme unique pour connecter, orchestrer et exécuter votre activité.
            </p>
          </div>

          <div className="rounded-sm border border-blue-500/30 bg-blue-500/5 p-3">
            <p className="mb-3 text-center text-xs font-semibold text-blue-200">UTILISATEURS & ENTREPRISES</p>
            <div className="grid gap-2 sm:grid-cols-5">
              {["Équipes internes", "Clients", "Partenaires", "Administration", "Terrain / Mobile"].map((item) => (
                <MiniCard key={item} title={item} subtitle="Objectifs + décisions" />
              ))}
            </div>
          </div>

          <FlowArrow />

          <div className="rounded-sm border border-indigo-500/30 bg-indigo-500/5 p-3">
            <p className="mb-3 text-center text-xs font-semibold text-indigo-200">CLEVONE AGENTIC BUSINESS PLATFORM</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {businessApps.map(([title, subtitle]) => (
                <MiniCard key={title} title={title} subtitle={subtitle} />
              ))}
            </div>
          </div>

          <FlowArrow />

          <div className="rounded-sm border border-violet-500/30 bg-violet-500/5 p-3">
            <p className="mb-3 text-center text-xs font-semibold text-violet-200">CLEVONE AGENTIC CORE • MULTI-AI X200</p>
            <div className="grid gap-2 md:grid-cols-5">
              {agenticCore.map(([title, subtitle]) => (
                <MiniCard key={title} title={title} subtitle={subtitle} />
              ))}
            </div>
          </div>

          <FlowArrow />

          <div className="rounded-sm border border-cyan-500/30 bg-cyan-500/5 p-3">
            <p className="mb-3 text-center text-xs font-semibold text-cyan-200">AI AGENTS / PROVIDERS • WORKERS</p>
            <div className="grid gap-2 sm:grid-cols-5">
              {workers.map(([title, subtitle]) => (
                <MiniCard key={title} title={title} subtitle={subtitle} />
              ))}
            </div>
          </div>

          <FlowArrow />

          <div className="rounded-sm border border-emerald-500/30 bg-emerald-500/5 p-3">
            <p className="mb-3 text-center text-xs font-semibold text-emerald-200">TOOL / ACTION GATEWAY • API + MCP + CONNECTEURS</p>
            <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {gateways.map((item) => (
                <MiniCard key={item} title={item} subtitle="Couche contrôlée" />
              ))}
            </div>
          </div>

          <FlowArrow />

          <div className="rounded-sm border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="mb-3 text-center text-xs font-semibold text-amber-200">REAL-WORLD EXECUTION • ACTIONS MÉTIER</p>
            <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-5">
              {actions.map((item) => (
                <MiniCard key={item} title={item} subtitle="Exécution traçable" />
              ))}
            </div>
          </div>

          <FlowArrow />

          <div className="rounded-sm border border-border-subtle bg-surface-muted p-3">
            <p className="mb-3 text-center text-xs font-semibold text-white">HUMAN APPROVAL GATES • CONTRÔLE HUMAIN INTELLIGENT</p>
            <div className="grid gap-2 sm:grid-cols-4">
              <div className="rounded-sm border border-emerald-500/40 bg-emerald-500/10 p-3 text-center">
                <p className="text-xs font-semibold text-emerald-300">LOW RISK</p>
                <p className="mt-1 text-[10px] text-gray-muted">Exécution automatique</p>
              </div>
              <div className="rounded-sm border border-amber-500/40 bg-amber-500/10 p-3 text-center">
                <p className="text-xs font-semibold text-amber-300">MEDIUM RISK</p>
                <p className="mt-1 text-[10px] text-gray-muted">Selon règles et seuils</p>
              </div>
              <div className="rounded-sm border border-orange-500/40 bg-orange-500/10 p-3 text-center">
                <p className="text-xs font-semibold text-orange-300">HIGH RISK</p>
                <p className="mt-1 text-[10px] text-gray-muted">Validation humaine requise</p>
              </div>
              <div className="rounded-sm border border-red-500/40 bg-red-500/10 p-3 text-center">
                <p className="text-xs font-semibold text-red-300">CRITICAL</p>
                <p className="mt-1 text-[10px] text-gray-muted">Approbation renforcée</p>
              </div>
            </div>
          </div>

          <FlowArrow />

          <div className="rounded-sm border border-sky-500/30 bg-sky-500/5 p-3">
            <p className="mb-3 text-center text-xs font-semibold text-sky-200">OUTCOME & VALUE • RÉSULTATS</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {outcomes.map((item) => (
                <MiniCard key={item} title={item} subtitle="Valeur mesurable" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-t border-border-subtle bg-surface-muted p-4 sm:p-6 lg:grid-cols-3">
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <h3 className="text-xs font-semibold text-gold uppercase">Pourquoi CLEVONE ?</h3>
          <ul className="mt-3 space-y-2 text-[11px] leading-4 text-gray-muted">
            <li>• Exécution réelle, pas seulement des outils.</li>
            <li>• Intégration des meilleurs agents IA.</li>
            <li>• Données métier et workflows adaptés à l’Afrique.</li>
            <li>• Sécurité, conformité et audit intégrés.</li>
          </ul>
        </div>
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <h3 className="text-xs font-semibold text-gold uppercase">Bénéfices</h3>
          <ul className="mt-3 space-y-2 text-[11px] leading-4 text-gray-muted">
            <li>• Réduction du travail manuel.</li>
            <li>• Résultats mesurables.</li>
            <li>• Modèle économique flexible.</li>
            <li>• Évolution progressive sans reconstruire l’existant.</li>
          </ul>
        </div>
        <div className="rounded-sm border border-border-subtle bg-surface-elevated p-4">
          <h3 className="text-xs font-semibold text-gold uppercase">Vision</h3>
          <p className="mt-3 text-[11px] leading-5 text-gray-muted">
            Faire de CLEVONE l’infrastructure métier qui permet aux humains et aux agents IA d’exécuter les opérations d’une entreprise de manière sécurisée, traçable et automatisée.
          </p>
        </div>
      </div>
    </section>
  );
}
