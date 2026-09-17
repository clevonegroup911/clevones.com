# Backlog — Clevones.com

Vue générée depuis `backlog.json`. Ne pas éditer à la main.

- Schéma : 2.0.0
- Registre : 162
- Mode : single-executor
- Mis à jour : 2026-09-17

## Compteurs

- EN_COURS : 0
- EN_CONTRÔLE : 3
- PRÊTE : 0
- BLOQUÉE : 0
- ÉCHOUÉE : 0
- À_FAIRE : 0
- TERMINÉE : 65
- ANNULÉE : 0

## Tâches

| ID | Priorité | État | Titre | Humain |
|---|---|---|---|---|
| T001 | P0 | TERMINÉE | Corrections MFA administrateur | non |
| T002 | P0 | TERMINÉE | Tests transactionnels PostgreSQL MFA | non |
| T003 | P0 | TERMINÉE | Revue MFA | non |
| T004 | P0 | TERMINÉE | Sauvegarde PostgreSQL et rollback | oui |
| T005 | P0 | TERMINÉE | Déploiement MFA contrôlé | oui |
| T006 | P0 | TERMINÉE | Enrôlement SUPER_ADMIN | oui |
| T007 | P0 | TERMINÉE | Installation du système d'orchestration X100 | non |
| T008 | P0 | TERMINÉE | Validation réelle de la première CI/PR | non |
| T009 | P1 | TERMINÉE | Playwright et preuves visuelles | non |
| T010 | P1 | TERMINÉE | Centralisation des secrets | oui |
| T011 | P1 | TERMINÉE | Sauvegardes automatiques | oui |
| T012 | P2 | TERMINÉE | Monitoring et alertes | non |
| T013 | P1 | TERMINÉE | Audit rôles et permissions | non |
| T014 | P2 | TERMINÉE | Audit CMS et documents | non |
| T015 | P2 | TERMINÉE | Analytics et paiements | non |
| T016 | P0 | TERMINÉE | Corrections des dépendances high | non |
| T017 | P1 | TERMINÉE | Migration gouvernance X100 → X200 | non |
| T018 | P1 | TERMINÉE | Mise en service timer backup PostgreSQL production | oui |
| T019 | P1 | TERMINÉE | CMS interne sécurisé | non |
| T020 | P1 | TERMINÉE | Documents privés et portail sécurisé | non |
| T021 | P1 | TERMINÉE | Workflow documents et permissions | non |
| T022 | P2 | TERMINÉE | Analytics first-party | non |
| T023 | P2 | TERMINÉE | Notifications email opérationnelles | non |
| T024 | P2 | TERMINÉE | Paiements abstraction + sandbox | non |
| T025 | P1 | TERMINÉE | E2E sécurité/responsive nouvelles fonctions | non |
| T026 | P0 | TERMINÉE | Déploiement/migrations production | oui |
| T027 | P1 | TERMINÉE | Gateway paiements — chaîne commande/facture | non |
| T028 | P1 | TERMINÉE | Gateway paiements — preuves et rapprochement | non |
| T029 | P1 | TERMINÉE | Gateway paiements — surfaces admin/client | non |
| T030 | P1 | TERMINÉE | Gateway sandbox — événements CLEVONE persistés + reconcile HTTP | non |
| T031 | P1 | TERMINÉE | Gateway sandbox — résolution HUMAN_REVIEW + activation VERIFIED | non |
| T032 | P2 | TERMINÉE | E2E Playwright — gateway paiements sandbox | non |
| T033 | P1 | TERMINÉE | Authentification portail USER | non |
| T034 | P1 | TERMINÉE | Gestion utilisateurs et grants documents | non |
| T035 | P2 | TERMINÉE | Resynchroniser inventaires docs avec l’état réel | non |
| T036 | P2 | TERMINÉE | Déconnexion portail USER | non |
| T037 | P2 | TERMINÉE | E2E users + DocumentGrant portail | non |
| T038 | P2 | TERMINÉE | Endpoint santé applicatif /health | non |
| T039 | P2 | TERMINÉE | Resynchroniser PROJECT_CONTEXT et inventaires post-T038 | non |
| T040 | P2 | TERMINÉE | Émettre .x200/PRODUCT_COMPLETE.json (niveau dépôt) | non |
| T041 | P0 | TERMINÉE | Final pre-merge payment security hardening | non |
| T042 | P0 | TERMINÉE | X200 Control Center — observabilité et supervision | non |
| T043 | P1 | TERMINÉE | Pont télémétrie Fedora AUTOPILOT → /admin/x200 | non |
| T044 | P1 | TERMINÉE | Resync docs reprise + PRODUCT_COMPLETE valide post-T041–T043 | non |
| T045 | P0 | TERMINÉE | Interactive X200 Control Center — safe operations | non |
| T046 | P0 | TERMINÉE | X200 Human Action Center — approvals, release, deploy and recovery | non |
| T047 | P0 | TERMINÉE | X200 Operational Mirror + Universal Action Console | non |
| T048 | P0 | TERMINÉE | X200 Boot Orchestrator — automatic startup and self-recovery | non |
| T049 | P0 | TERMINÉE | X200 Control Center — fully interactive actions and previews | non |
| T065 | P0 | TERMINÉE | Agentic Core — provider-independent Agent Registry | non |
| T066 | P0 | TERMINÉE | Agentic Core — domain event envelope (idempotent) | non |
| T067 | P1 | TERMINÉE | Agentic Core — tool policy reuse + agent audit fields | non |
| T068 | P1 | TERMINÉE | Agentic Core — in-process Tool Gateway (LOW risk only) | non |
| T069 | P1 | TERMINÉE | Finance Agent vertical slice — proof_uploaded recommendation | non |
| T070 | P1 | TERMINÉE | Agentic Core — business X200 Orchestrator (event→agent→gateway) | non |
| T071 | P1 | TERMINÉE | Agentic Core — provider adapters (stub, no network, no paid SDK) | non |
| T072 | P1 | TERMINÉE | Agentic Core — business Approval Engine (single-use, persisted) | non |
| T073 | P1 | TERMINÉE | Agentic Control Center — observability panel (registry/audit/orchestration) | non |
| T074 | P2 | TERMINÉE | Finance Agent — complete recommendation worker (no payout) | non |
| T075 | P2 | TERMINÉE | Commercial Agent — lead.qualify draft worker (read/draft only) | non |
| T076 | P2 | TERMINÉE | DMS Agent — document.classify metadata worker (no content leak) | non |
| T077 | P1 | TERMINÉE | Agentic durable journal — events/approvals/audit to .x200 + Control Center feed | non |
| T078 | P2 | TERMINÉE | Outcome engine — labels from orchestration (no side effects) | non |
| T079 | P2 | TERMINÉE | Agentic recommend-only hook from payment proof path (no activation) | non |
| T080 | P1 | TERMINÉE | Wire agentic journal writers from orchestrator + approval engine | non |
| T081 | P0 | EN_CONTRÔLE | Redact STALE Fedora telemetry identity in Control Center | non |
| T082 | P0 | EN_CONTRÔLE | Bind Control Center CI SUCCESS to matching commit SHA | non |
| T083 | P1 | EN_CONTRÔLE | Durable task checkpoint for verified resume | non |
