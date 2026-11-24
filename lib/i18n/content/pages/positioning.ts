import {
  clevoneMiningSeparationDisclaimer,
  clevoneMiningSeparationDisclaimerFr,
} from "@/lib/constants/brand-positioning";
import type {
  CtaContent,
  HeroContent,
  LocalizedPageContent,
  PageMeta,
  SectionHeadingContent,
  TitledDescription,
} from "./types";

export type PositioningPageContent = {
  meta: PageMeta;
  hero: HeroContent;
  definition: SectionHeadingContent & { paragraphs: readonly string[] };
  isSection: SectionHeadingContent & { items: readonly TitledDescription[] };
  isNotSection: SectionHeadingContent & {
    excludedLabel: string;
    items: readonly TitledDescription[];
  };
  distinction: SectionHeadingContent & { paragraphs: readonly string[] };
  corporatePurpose: SectionHeadingContent & { paragraphs: readonly string[] };
  miningDisclaimer: string;
  cta: CtaContent;
};

/**
 * Positioning — doctrine 2026-11 : CLEVONE SARL is a multi-sector commercial
 * company. Neutrality is a conflict-of-interest rule for coordination
 * missions only (objet social, point 7) — not a global identity.
 */
export const positioningPageContent = {
  en: {
    meta: {
      title: "Positioning",
      description:
        "CLEVONE SARL is a multi-sector commercial company that develops, sells and operates products and services. When it coordinates a multi-party initiative, it holds no stake in that initiative's execution.",
    },
    hero: {
      eyebrow: "Positioning",
      title: "A multi-sector company, with a clear rule when we coordinate.",
      subtitle:
        "CLEVONE SARL develops, sells and operates products and services. When we coordinate an initiative, we keep out of its execution.",
      tagline: "When we coordinate, we hold no stake in execution.",
    },
    definition: {
      eyebrow: "The rule",
      title: "Neutrality applies to coordination missions",
      paragraphs: [
        "CLEVONE SARL is a commercial company: it develops, sells and operates products and services, such as CLEVONE DMS.",
        "When it coordinates or structures a multi-party initiative, it is not also the operator, trader or paid intermediary of that same initiative.",
        "Any operational role of another CLEVONE activity or ecosystem entity is declared in advance and kept separate from the mission.",
      ],
    },
    isSection: {
      eyebrow: "In a coordination mission",
      title: "What CLEVONE does",
      description: "These roles apply to the coordination mission itself.",
      items: [
        {
          title: "Coordinator",
          description: "Brings the legitimate actors of the initiative together.",
        },
        {
          title: "Structurer",
          description: "Turns a local project into a documented, readable initiative.",
        },
        {
          title: "Neutral meeting point",
          description: "Gives each actor the same place to align.",
        },
        {
          title: "Governance designer",
          description: "Sets who decides, who reports and on what basis.",
        },
        {
          title: "Reporting interface",
          description: "Keeps decisions and status readable over time.",
        },
      ],
    },
    isNotSection: {
      eyebrow: "In a coordination mission",
      title: "What CLEVONE is not",
      description: "These limits apply to coordination missions only. They prevent conflicts of interest.",
      excludedLabel: "Excluded",
      items: [
        {
          title: "Not the operator of that initiative",
          description: "Field execution stays with the actors who carry it.",
        },
        {
          title: "Not a trader in that initiative",
          description: "No buying or selling inside the initiative we coordinate.",
        },
        {
          title: "Not a paid intermediary in it",
          description: "No commission on the deals we help structure.",
        },
        {
          title: "Not an informal broker",
          description: "Coordination follows documented protocols only.",
        },
        {
          title: "No claim on its resources",
          description: "We take no stake in the resources the initiative concerns.",
        },
      ],
    },
    distinction: {
      eyebrow: "Why the rule exists",
      title: "Separating coordination from execution protects trust.",
      paragraphs: [
        "A coordinator who also executes the same initiative has a conflict of interest.",
        "Declaring and separating any operational role lets institutions, funders and partners rely on the coordination.",
      ],
    },
    corporatePurpose: {
      eyebrow: "Our activities",
      title: "Selling products and services is part of our purpose.",
      paragraphs: [
        "Our corporate purpose covers technology and software, trade and distribution, logistics, industry, energy, media, education, advisory and events. Regulated activities are carried out only once the required authorizations are obtained.",
        "The coordination rule does not limit these activities. It governs how they are kept apart from a coordination mission.",
      ],
    },
    miningDisclaimer: clevoneMiningSeparationDisclaimer,
    cta: {
      title: "Get to know CLEVONE SARL",
      description: "Identity, mission and fields of activity.",
      actions: [{ href: "/about", label: "About CLEVONE SARL" }],
    },
  },
  fr: {
    meta: {
      title: "Positionnement",
      description:
        "CLEVONE SARL est une société commerciale multisectorielle qui développe, vend et exploite des produits et services. Quand elle coordonne une initiative multi-acteurs, elle n'est pas partie prenante de son exécution.",
    },
    hero: {
      eyebrow: "Positionnement",
      title: "Une société multisectorielle, avec une règle claire quand nous coordonnons.",
      subtitle:
        "CLEVONE SARL développe, vend et exploite des produits et services. Quand nous coordonnons une initiative, nous restons hors de son exécution.",
      tagline: "Quand nous coordonnons, nous ne sommes pas partie prenante de l'exécution.",
    },
    definition: {
      eyebrow: "La règle",
      title: "La neutralité s'applique aux missions de coordination",
      paragraphs: [
        "CLEVONE SARL est une société commerciale : elle développe, vend et exploite des produits et services, comme CLEVONE DMS.",
        "Quand elle coordonne ou structure une initiative multi-acteurs, elle n'en est pas en même temps l'opérateur, le négociant ou l'intermédiaire rémunéré.",
        "Tout rôle opérationnel d'une autre activité de CLEVONE ou d'une entité de l'écosystème est déclaré à l'avance et séparé de la mission.",
      ],
    },
    isSection: {
      eyebrow: "Dans une mission de coordination",
      title: "Ce que fait CLEVONE",
      description: "Ces rôles portent sur la mission de coordination elle-même.",
      items: [
        {
          title: "Coordinateur",
          description: "Réunit les acteurs légitimes de l'initiative.",
        },
        {
          title: "Structureur",
          description: "Transforme un projet local en initiative documentée et lisible.",
        },
        {
          title: "Point de rencontre neutre",
          description: "Offre à chaque acteur le même lieu pour s'aligner.",
        },
        {
          title: "Concepteur de gouvernance",
          description: "Fixe qui décide, qui rend compte et sur quelle base.",
        },
        {
          title: "Interface de reporting",
          description: "Garde décisions et statut lisibles dans le temps.",
        },
      ],
    },
    isNotSection: {
      eyebrow: "Dans une mission de coordination",
      title: "Ce que CLEVONE n'est pas",
      description: "Ces limites valent pour les missions de coordination. Elles évitent les conflits d'intérêts.",
      excludedLabel: "Exclu",
      items: [
        {
          title: "Pas l'opérateur de cette initiative",
          description: "L'exécution reste aux acteurs qui la portent.",
        },
        {
          title: "Pas négociant dans cette initiative",
          description: "Ni achat ni vente au sein de l'initiative coordonnée.",
        },
        {
          title: "Pas intermédiaire rémunéré",
          description: "Aucune commission sur les accords que nous aidons à structurer.",
        },
        {
          title: "Pas courtier informel",
          description: "La coordination suit uniquement des protocoles documentés.",
        },
        {
          title: "Aucun droit sur ses ressources",
          description: "Aucune participation aux ressources visées par l'initiative.",
        },
      ],
    },
    distinction: {
      eyebrow: "Pourquoi cette règle",
      title: "Séparer coordination et exécution protège la confiance.",
      paragraphs: [
        "Un coordinateur qui exécute aussi la même initiative est en conflit d'intérêts.",
        "Déclarer et séparer tout rôle opérationnel permet aux institutions, financeurs et partenaires de se fier à la coordination.",
      ],
    },
    corporatePurpose: {
      eyebrow: "Nos activités",
      title: "Vendre des produits et services fait partie de notre objet.",
      paragraphs: [
        "Notre objet social couvre technologie et logiciels, commerce et distribution, logistique, industrie, énergie, médias, éducation, conseil et événementiel. Les activités réglementées ne sont exercées qu'après obtention des autorisations requises.",
        "La règle de coordination ne limite pas ces activités. Elle fixe comment elles restent séparées d'une mission de coordination.",
      ],
    },
    miningDisclaimer: clevoneMiningSeparationDisclaimerFr,
    cta: {
      title: "Mieux connaître CLEVONE SARL",
      description: "Identité, mission et domaines d'activité.",
      actions: [{ href: "/mission", label: "À propos de CLEVONE SARL" }],
    },
  },
} as const satisfies LocalizedPageContent<PositioningPageContent>;
