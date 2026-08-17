import { transliterate as tr } from "transliteration"

export const slugify = (text: string): string =>
  tr(text)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")

export type SlugEntity = "product" | "category" | "tag"
