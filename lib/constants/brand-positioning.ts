/**
 * Canonical brand positioning language for Clevones.
 * Primary identity: Congolese multi-sector company (see companyDefinition*).
 * Strategic vision: Governance Architecture for Territorial Economic Flows —
 * an orientation, not the unique legal activity.
 * Governance posture (where stated): architect of flows, territorial structurer,
 * coordination platform, ecosystem integrator.
 * Never (as governance platform): operator, trader, resource exploiter,
 * direct intermediary, informal broker.
 */

import {
  company,
  companyDefinitionEn,
  companyDefinitionFr,
} from "@/lib/constants/company";

export const clevonesIsLabels = [
  "Architect of flows",
  "Territorial structurer",
  "Coordination platform",
  "Neutral governance layer",
  "Ecosystem integrator",
  "Strategic reporting interface",
] as const;

export const clevonesIsNotLabels = [
  "Operator",
  "Trader",
  "Resource exploiter",
  "Direct intermediary",
  "Informal broker",
  "Generic services vendor",
] as const;

export const clevonesNeutralityDisclaimer =
  "Clevones is a neutral governance and coordination platform. It is not an operator, trader, resource exploiter, or direct intermediary." as const;

export const clevonesNeutralityDisclaimerFr =
  "Clevones est une plateforme neutre de gouvernance et de coordination. Elle n'est pas un opérateur, un négociant, un exploitant de ressources, ni un intermédiaire direct." as const;

export const clevoneMiningSeparationDisclaimer =
  "Clevone Mining is presented as an ecosystem project / entity with distinct status. No separate legal registration is claimed on this site except for CLEVONE SARL." as const;

export const clevoneMiningSeparationDisclaimerFr =
  "Clevone Mining est présentée comme un projet / une entité de l'écosystème à statut distinct. Aucune immatriculation juridique distincte n'est affirmée sur ce site, hormis celle de CLEVONE SARL." as const;

export const clevoneMiningEcosystemDisclaimer =
  "Clevone Mining is presented as an ecosystem project / entity with distinct status. No separate legal registration is claimed on this site except for CLEVONE SARL." as const;

export const governanceAcknowledgmentText =
  "I understand that Clevones is a neutral governance and coordination platform, not an operator, trader, resource exploiter, or direct intermediary." as const;

export const siteLegalDisclaimer =
  `${companyDefinitionEn} Strategic vision: ${company.strategicVision}. This vision orients the company's work; it is not its unique legal activity.` as const;

export const siteLegalDisclaimerFr =
  `${companyDefinitionFr} Vision stratégique : ${company.strategicVisionFr}. Cette vision oriente le travail de la société ; elle n'est pas son unique activité juridique.` as const;
