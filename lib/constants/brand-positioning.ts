/**
 * Canonical brand positioning language for CLEVONE SARL (brand: CLEVONES).
 * Primary identity: Congolese multi-sector commercial company that develops,
 * sells and operates products and services (see companyDefinition*).
 * Neutrality is NOT a global identity: it is a conflict-of-interest rule for
 * coordination and governance missions (objet social, point 7). In such a
 * mission CLEVONE is not, for that same initiative, operator, trader or paid
 * intermediary; any operational role of another CLEVONE activity or ecosystem
 * entity is declared in advance and kept separate.
 */

import {
  companyDefinitionEn,
  companyDefinitionFr,
} from "@/lib/constants/company";

/** Maxim — short form. */
export const coordinationMaxim = {
  en: "When we coordinate, we hold no stake in execution.",
  fr: "Quand nous coordonnons, nous ne sommes pas partie prenante de l'exécution.",
} as const;

/** Roles held in a coordination mission. */
export const clevonesIsLabels = [
  "Coordinator",
  "Structurer",
  "Neutral meeting point",
  "Governance designer",
  "Reporting interface",
] as const;

/** Roles excluded in a coordination mission — for that same initiative only. */
export const clevonesIsNotLabels = [
  "Operator of the coordinated initiative",
  "Trader in the coordinated initiative",
  "Paid intermediary in the coordinated initiative",
  "Informal broker",
] as const;

export const clevonesNeutralityDisclaimer =
  "In a coordination mission, CLEVONE is not the operator, trader or paid intermediary of the initiative it coordinates. Any operational role of another CLEVONE activity is declared in advance and kept separate." as const;

export const clevonesNeutralityDisclaimerFr =
  "Dans une mission de coordination, CLEVONE n'est ni l'opérateur, ni le négociant, ni l'intermédiaire rémunéré de l'initiative qu'elle coordonne. Tout rôle opérationnel d'une autre activité de CLEVONE est déclaré à l'avance et séparé." as const;

export const clevoneMiningSeparationDisclaimer =
  "Ecosystem lines are activities or projects of CLEVONE SARL. No separate legal registration is claimed on this site except for CLEVONE SARL." as const;

export const clevoneMiningSeparationDisclaimerFr =
  "Les lignes de l'écosystème sont des activités ou projets de CLEVONE SARL. Aucune immatriculation juridique distincte n'est affirmée sur ce site, hormis celle de CLEVONE SARL." as const;

export const clevoneMiningEcosystemDisclaimer =
  "Ecosystem lines are activities or projects of CLEVONE SARL. No separate legal registration is claimed on this site except for CLEVONE SARL." as const;

export const governanceAcknowledgmentText =
  "I understand that, in a coordination mission, CLEVONE is not the operator, trader or paid intermediary of the initiative it coordinates, and that any operational role is declared separately." as const;

export const governanceAcknowledgmentTextFr =
  "Je comprends que, dans une mission de coordination, CLEVONE n'est ni l'opérateur, ni le négociant, ni l'intermédiaire rémunéré de l'initiative coordonnée, et que tout rôle opérationnel est déclaré séparément." as const;

export const siteLegalDisclaimer =
  `${companyDefinitionEn} Activities subject to authorization are carried out only once the required authorizations are obtained. ${coordinationMaxim.en}` as const;

export const siteLegalDisclaimerFr =
  `${companyDefinitionFr} Les activités soumises à autorisation ne sont exercées qu'après obtention des autorisations requises. ${coordinationMaxim.fr}` as const;
