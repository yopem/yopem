import { transliterate as tr } from "transliteration"

export const slugify = (text: string): string =>
  tr(text)
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/_/g, "-")
    .replace(/-+/g, "-")
    .replace(/-$/g, "")

export type SlugEntity = "product" | "category" | "tag"
