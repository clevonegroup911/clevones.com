/**
 * Canonical brand positioning language for Clevones.
 * Clevones: architect of flows, territorial structurer, coordination platform,
 * ecosystem integrator — within a broad corporate purpose that expands fields
 * of intervention without replacing this governance posture.
 * Never (as governance platform): operator, trader, resource exploiter,
 * direct intermediary, informal broker.
 */

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
  "Clevone Mining is an operational unit that conducts field activities. It is structurally and functionally separated from the neutral governance role exercised by Clevones. No operational activity is conducted under the Clevones governance platform." as const;

export const clevoneMiningSeparationDisclaimerFr =
  "Clevone Mining est une unité opérationnelle qui conduit les activités de terrain. Elle est structurellement et fonctionnellement séparée du rôle de gouvernance neutre exercé par Clevones. Aucune activité opérationnelle n'est conduite sous la plateforme de gouvernance Clevones." as const;

export const clevoneMiningEcosystemDisclaimer =
  "Clevone Mining is operationally distinct from Clevones. Clevones remains a neutral governance and coordination platform." as const;

export const governanceAcknowledgmentText =
  "I understand that Clevones is a neutral governance and coordination platform, not an operator, trader, resource exploiter, or direct intermediary." as const;

export const siteLegalDisclaimer =
  `${clevonesNeutralityDisclaimer} Its corporate purpose expands fields of territorial intervention through the ecosystem and subsidiaries without redefining the governance platform as an operator. Clevone Mining operates as a structurally separated operational unit.` as const;
