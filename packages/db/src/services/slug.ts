import { and, eq, ne } from "drizzle-orm"

import { db } from "db"
import { assetsTable } from "db/schema/assets"
import type { AssetType } from "db/schema/assets"
import { categoriesTable } from "db/schema/categories"
import { productsTable } from "db/schema/products"
import { tagsTable } from "db/schema/tags"
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

export const generateUniqueSlug = async (
  entity: SlugEntity,
  text: string,
  excludeId?: string,
): Promise<string> => {
  const table = slugEntityTable[entity]
  const slug = slugify(text)
  let uniqueSlug = slug
  let suffix = 1

  while (true) {
    const existing = await db
      .select({ id: table.id })
      .from(table)
      .where(
        excludeId
          ? and(eq(table.slug, uniqueSlug), ne(table.id, excludeId))
          : eq(table.slug, uniqueSlug),
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
