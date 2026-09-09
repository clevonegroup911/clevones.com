import { z } from "zod";

import { CONTENT_LOCALES, CONTENT_STATUSES, slugifyTitle } from "@/lib/cms/content";

const slugSchema = z
  .string()
  .trim()
  .min(2, "Le slug est trop court.")
  .max(80, "Le slug est trop long.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalide (a-z, 0-9, tirets).");

export const createContentPageSchema = z
  .object({
    title: z.string().trim().min(2, "Le titre est requis.").max(200),
    description: z.string().trim().max(2000).optional().default(""),
    slug: z.string().trim().optional().default(""),
  })
  .transform((data, ctx) => {
    const slug = data.slug.length > 0 ? data.slug : slugifyTitle(data.title);
    const parsed = slugSchema.safeParse(slug);
    if (!parsed.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: parsed.error.issues[0]?.message ?? "Slug invalide.",
        path: ["slug"],
      });
      return z.NEVER;
    }
    return {
      title: data.title,
      description: data.description ?? "",
      slug: parsed.data,
    };
  });

export const upsertContentEntrySchema = z.object({
  pageId: z.string().trim().min(1),
  locale: z.enum(CONTENT_LOCALES),
  title: z.string().trim().min(2, "Le titre localisé est requis.").max(200),
  summary: z.string().trim().max(2000).optional().default(""),
  body: z.string().trim().max(100_000).optional().default(""),
});

export const contentStatusSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(CONTENT_STATUSES),
  kind: z.enum(["page", "entry"]),
});

export type CreateContentPageInput = z.infer<typeof createContentPageSchema>;
export type UpsertContentEntryInput = z.infer<typeof upsertContentEntrySchema>;
