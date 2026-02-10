import { transliterate as tr } from "transliteration"

import { db } from "@/lib/db"

export function slugify(text: string) {
  return tr(text)
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
}

export function slugifyUsername(text: string) {
  return tr(text)
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^\w-]+/g, "")
    .replace(/-/g, "")
    .replace(/_/g, "")
    .replace(/-+/g, "-")
    .replace(/-$/g, "")
}

export function slugifyFile(text: string) {
  return tr(text)
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w.-]+/g, "")
    .replace(/_/g, "-")
    .replace(/-+/g, "-")
    .replace(/-$/g, "")
}

export const generateUniqueToolSlug = async (text: string): Promise<string> => {
  const slug = slugify(text)
  let uniqueSlug = slug
  let suffix = 1

  while (true) {
    const existingTool = await db.query.toolsTable.findFirst({
      where: (tool, { eq }) => eq(tool.slug, uniqueSlug),
    })

    if (!existingTool) break

    suffix++
    uniqueSlug = `${slug}-${suffix}`
  }

  return uniqueSlug
}

export const generateUniqueCategorySlug = async (
  text: string,
  excludeId?: string,
): Promise<string> => {
  const slug = slugify(text)
  let uniqueSlug = slug
  let suffix = 1

  while (true) {
    const existingCategory = await db.query.categoriesTable.findFirst({
      where: (category, { eq, and, ne }) =>
        excludeId
          ? and(eq(category.slug, uniqueSlug), ne(category.id, excludeId))
          : eq(category.slug, uniqueSlug),
    })

    if (!existingCategory) break

    suffix++
    uniqueSlug = `${slug}-${suffix}`
  }

  return uniqueSlug
}

export const generateUniqueTagSlug = async (
  text: string,
  excludeId?: string,
): Promise<string> => {
  const slug = slugify(text)
  let uniqueSlug = slug
  let suffix = 1

  while (true) {
    const existingTag = await db.query.tagsTable.findFirst({
      where: (tag, { eq, and, ne }) =>
        excludeId
          ? and(eq(tag.slug, uniqueSlug), ne(tag.id, excludeId))
          : eq(tag.slug, uniqueSlug),
    })

    if (!existingTag) break

    suffix++
    uniqueSlug = `${slug}-${suffix}`
  }

  return uniqueSlug
}
