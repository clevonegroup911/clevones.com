import {
  capacityVsPlatformClarification,
  corporateMission,
  corporateVision,
  domainsFraming,
  interventionDomains,
  objetSocialLegalFr,
} from "@/lib/constants/corporate-purpose";

export const missionPageHero = {
  eyebrow: "Mission",
  title: "Structurer les dynamiques économiques territoriales",
  subtitle:
    "Clevones conçoit, structure et coordonne des architectures de flux économiques territoriaux en République Démocratique du Congo et en Afrique.",
} as const;

export const missionPageVision = {
  eyebrow: "Vision",
  title: "Transformer le potentiel territorial en actifs économiques durables",
  paragraphs: [
    corporateVision.statementFr,
    "Cette vision constitue le cœur de la marque. Les technologies, la logistique, les infrastructures numériques, l'intelligence économique et les plateformes de coordination sont des instruments d'architecture territoriale — non des fins en soi.",
  ],
} as const;

export const missionPageMission = {
  eyebrow: "Mission",
  title: "Architecturer, structurer et coordonner",
  paragraphs: [
    corporateMission.statementFr,
    "Clevones préserve une séparation claire entre la conception de la gouvernance et l'exécution opérationnelle. Les acteurs légitimes conservent la responsabilité opérationnelle au sein de structures documentées et conformes.",
  ],
} as const;

export const missionPageIdentity = {
  eyebrow: "Identité institutionnelle",
  title: "Plateforme de coordination. Intégrateur d'écosystèmes.",
  paragraphs: [
    "Clevones opère comme plateforme institutionnelle premium : architecte des flux, structureur territorial, couche de gouvernance neutre et interface de reporting stratégique.",
    "Son écosystème spécialisé — Clevodia, Clevonet, Bicuni, Btlearn Inc., et Clevone Mining (unité opérationnelle séparée) — étend la capacité sectorielle sans diluer le mandat central de gouvernance.",
    capacityVsPlatformClarification.fr,
  ],
} as const;

export const missionPageDomains = {
  eyebrow: domainsFraming.eyebrowFr,
  title: domainsFraming.titleFr,
  description: domainsFraming.descriptionFr,
  domains: interventionDomains,
} as const;

export const missionPageObjetSocial = {
  eyebrow: "Objet social",
  title: "Capacité juridique officielle",
  intro: objetSocialLegalFr.intro,
  items: objetSocialLegalFr.items,
  closing: objetSocialLegalFr.closing,
  note: "Le détail intégral de l'objet social figure également dans les mentions légales.",
} as const;
