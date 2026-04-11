import { asc, eq, inArray } from "drizzle-orm"

import type { SelectCategory } from "../schema/categories.ts"

import { db } from "../index.ts"
import { categoriesTable } from "../schema/index.ts"
import { generateUniqueCategorySlug } from "./slug.ts"

export const listCategories = (): Promise<
  {
    id: string
    name: string
    slug: string
    description: string | null
  }[]
> => {
  return db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      slug: categoriesTable.slug,
      description: categoriesTable.description,
    })
    .from(categoriesTable)
    .orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name))
}

export const createCategory = async (input: {
  name: string
  description?: string
}): Promise<SelectCategory> => {
  const slug = await generateUniqueCategorySlug(input.name)

  const [category] = await db
    .insert(categoriesTable)
    .values({ name: input.name, slug, description: input.description })
    .returning()

  if (!category) {
    throw new Error("Insert returned no rows")
  }

  return category
}

export const updateCategory = async (input: {
  id: string
  name: string
  description?: string
}): Promise<SelectCategory> => {
  const slug = await generateUniqueCategorySlug(input.name, input.id)

  const [category] = await db
    .update(categoriesTable)
    .set({ name: input.name, slug, description: input.description })
    .where(eq(categoriesTable.id, input.id))
    .returning()

  if (!category) {
    throw new Error("Update returned no rows")
  }

  return category
}

export const deleteCategory = async (id: string): Promise<void> => {
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id))
}

export const validateCategoryIds = async (ids: string[]): Promise<boolean> => {
  if (ids.length === 0) return true
  const found = await db
    .select({ id: categoriesTable.id })
    .from(categoriesTable)
    .where(inArray(categoriesTable.id, ids))
  return found.length === ids.length
}
