import type { LocalizedPageContent, PageMeta } from "./types";

export type PrivacyPageContent = {
  meta: PageMeta;
  eyebrow: string;
  title: string;
  paragraphs: readonly string[];
  contact: { prefix: string; email: string };
};

const email = "contact@clevones.com";

export const privacyPageContent = {
  fr: {
    meta: { title: "Politique de confidentialité", description: "Politique de confidentialité de Clevones : traitement, protection et droits relatifs aux données personnelles collectées via le site institutionnel." },
    eyebrow: "Légal",
    title: "Politique de confidentialité",
    paragraphs: [
      "CLEVONE SARL s'engage à protéger la confidentialité des données personnelles collectées via ce site institutionnel.",
      "Les données transmises par courriel ou via les formulaires de contact sont utilisées exclusivement pour répondre aux demandes institutionnelles reçues. Elles ne sont ni vendues, ni cédées à des tiers à des fins commerciales.",
      "Conformément à la réglementation applicable, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.",
    ],
    contact: { prefix: "Pour exercer ces droits, contactez", email },
  },
  en: {
    meta: { title: "Privacy policy", description: "Clevones privacy policy: processing, protection, and rights relating to personal data collected through the institutional website." },
    eyebrow: "Legal",
    title: "Privacy policy",
    paragraphs: [
      "CLEVONE SARL is committed to protecting the confidentiality of personal data collected through this institutional website.",
      "Data sent by email or through contact forms are used exclusively to respond to institutional requests received. They are neither sold nor transferred to third parties for commercial purposes.",
      "In accordance with applicable regulations, you have the right to access, rectify, and delete your data.",
    ],
    contact: { prefix: "To exercise these rights, contact", email },
  },
} as const satisfies LocalizedPageContent<PrivacyPageContent>;
