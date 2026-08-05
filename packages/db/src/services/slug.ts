import { and, eq, ne } from "drizzle-orm"

import { db } from "db"
import {
  assetsTable,
  categoriesTable,
  productsTable,
  tagsTable,
} from "db/schema"
import type { AssetType } from "db/schema/assets"
import { slugify, type SlugEntity } from "utils/slug"

const slugEntityTable = {
  product: productsTable,
  category: categoriesTable,
  tag: tagsTable,
} as const

export const isSlugAvailable = async (
  entity: SlugEntity,
  slug: string,
  excludeId?: string,
): Promise<boolean> => {
  const table = slugEntityTable[entity]
  const [row] = await db
    .select({ id: table.id })
    .from(table)
    .where(
      excludeId
        ? and(eq(table.slug, slug), ne(table.id, excludeId))
        : eq(table.slug, slug),
    )
    .limit(1)
  return !row
}

export const assertSlugAvailable = async (
  entity: SlugEntity,
  slug: string,
  excludeId?: string,
): Promise<string> => {
  const available = await isSlugAvailable(entity, slug, excludeId)
  if (!available) {
    throw new Error(`Slug "${slug}" is already in use`)
  }
  return slug
}

export const generateUniqueProductSlug = async (
  text: string,
): Promise<string> => {
  const slug = slugify(text)
  let uniqueSlug = slug
  let suffix = 1

  while (true) {
    const existing = await db
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.slug, uniqueSlug))
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

export const generateUniqueAssetFilename = async (
  originalName: string,
  type: AssetType,
): Promise<string> => {
  const baseSlug = slugify(originalName.replace(/\.[^/.]+$/, ""))
  const extension =
    type === "images" ? "webp" : (originalName.split(".").pop() ?? "bin")

  const ext = extension.toLowerCase()
  let filename = `${baseSlug}.${ext}`
  let suffix = 1

  while (true) {
    const existing = await db
      .select({ id: assetsTable.id })
      .from(assetsTable)
      .where(eq(assetsTable.filename, filename))
      .limit(1)

    if (existing.length === 0) break

    suffix++
    filename = `${baseSlug}-${suffix}.${ext}`
  }

  return filename
}
