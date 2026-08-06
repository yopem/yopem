import { asc, eq, inArray } from "drizzle-orm"

import { db } from "db"
import { categoriesTable } from "db/schema"
import type { SelectCategory } from "db/schema/categories"

import { generateUniqueCategorySlug, assertSlugAvailable } from "./slug"

export const listCategories = (): Promise<
  {
    id: string
    name: string
    slug: string
    description: string | null
    parentId: string | null
    sortOrder: number | null
  }[]
> => {
  return db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      slug: categoriesTable.slug,
      description: categoriesTable.description,
      parentId: categoriesTable.parentId,
      sortOrder: categoriesTable.sortOrder,
    })
    .from(categoriesTable)
    .orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name))
}

export const getCategory = async (
  id: string,
): Promise<SelectCategory | null> => {
  const [category] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, id))
    .limit(1)
  return category ?? null
}

const getParentChain = async (
  startParentId: string,
  excludeId?: string,
): Promise<string[]> => {
  const chain: string[] = []
  let currentId: string | null = startParentId

  while (currentId) {
    if (excludeId && currentId === excludeId) {
      return chain.concat(currentId)
    }

    if (chain.includes(currentId)) {
      return chain
    }

    chain.push(currentId)

    const [row] = await db
      .select({ parentId: categoriesTable.parentId })
      .from(categoriesTable)
      .where(eq(categoriesTable.id, currentId))
      .limit(1)

    currentId = row?.parentId ?? null
  }

  return chain
}

const validateParent = async (
  categoryId: string | undefined,
  parentId: string | null,
): Promise<void> => {
  if (!parentId) return

  const parent = await getCategory(parentId)
  if (!parent) {
    throw new Error("Parent category not found")
  }

  if (categoryId && parentId === categoryId) {
    throw new Error("A category cannot be its own parent")
  }

  if (categoryId) {
    const chain = await getParentChain(parentId, categoryId)
    if (chain.includes(categoryId)) {
      throw new Error("Cannot assign a descendant as parent")
    }
  }
}

export const createCategory = async (input: {
  name: string
  slug?: string
  description?: string
  parentId?: string | null
  icon?: string
  sortOrder?: number
}): Promise<SelectCategory> => {
  const slug = input.slug
    ? await assertSlugAvailable("category", input.slug)
    : await generateUniqueCategorySlug(input.name)

  const parentId =
    input.parentId && input.parentId !== "" ? input.parentId : null
  await validateParent(undefined, parentId)

  const [category] = await db
    .insert(categoriesTable)
    .values({
      name: input.name,
      slug,
      description: input.description,
      parentId,
      icon: input.icon,
      sortOrder: input.sortOrder,
    })
    .returning()

  if (!category) {
    throw new Error("Insert returned no rows")
  }

  return category
}

export const updateCategory = async (input: {
  id: string
  name: string
  slug?: string
  description?: string
  parentId?: string | null
}): Promise<SelectCategory> => {
  const slug = input.slug
    ? await assertSlugAvailable("category", input.slug, input.id)
    : await generateUniqueCategorySlug(input.name, input.id)

  const parentId =
    input.parentId === undefined
      ? undefined
      : input.parentId && input.parentId !== ""
        ? input.parentId
        : null
  await validateParent(input.id, parentId ?? null)

  const updateData: {
    name: string
    slug: string
    description?: string
    parentId?: string | null
  } = {
    name: input.name,
    slug,
    description: input.description,
  }

  if (parentId !== undefined) {
    updateData.parentId = parentId
  }

  const [category] = await db
    .update(categoriesTable)
    .set(updateData)
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

export const deleteCategories = async (
  ids: string[],
): Promise<{ success: boolean; count: number }> => {
  if (ids.length === 0) {
    return { success: true, count: 0 }
  }
  const deleted = await db
    .delete(categoriesTable)
    .where(inArray(categoriesTable.id, ids))
    .returning()
  return { success: true, count: deleted.length }
}

export const validateCategoryIds = async (ids: string[]): Promise<boolean> => {
  if (ids.length === 0) return true
  const found = await db
    .select({ id: categoriesTable.id })
    .from(categoriesTable)
    .where(inArray(categoriesTable.id, ids))
  return found.length === ids.length
}
