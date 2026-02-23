import { and, eq, ne } from "drizzle-orm"
import { transliterate as tr } from "transliteration"

import { db } from "../index"
import { categoriesTable, tagsTable, toolsTable } from "../schema"

function slugify(text: string) {
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

export const generateUniqueToolSlug = async (text: string): Promise<string> => {
  const slug = slugify(text)
  let uniqueSlug = slug
  let suffix = 1

  while (true) {
    const existing = await db
      .select({ id: toolsTable.id })
      .from(toolsTable)
      .where(eq(toolsTable.slug, uniqueSlug))
      .limit(1)

    if (existing.length === 0) break

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
    const existing = await db
      .select({ id: categoriesTable.id })
      .from(categoriesTable)
      .where(
        excludeId
          ? and(
              eq(categoriesTable.slug, uniqueSlug),
              ne(categoriesTable.id, excludeId),
            )
          : eq(categoriesTable.slug, uniqueSlug),
      )
      .limit(1)

    if (existing.length === 0) break

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
    const existing = await db
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(
        excludeId
          ? and(eq(tagsTable.slug, uniqueSlug), ne(tagsTable.id, excludeId))
          : eq(tagsTable.slug, uniqueSlug),
      )
      .limit(1)

    if (existing.length === 0) break

    suffix++
    uniqueSlug = `${slug}-${suffix}`
  }

  return uniqueSlug
}
