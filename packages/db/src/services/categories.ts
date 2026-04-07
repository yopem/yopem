import { Result } from "better-result"
import { asc, eq, inArray } from "drizzle-orm"

import type { SelectCategory } from "../schema/categories.ts"

import { DatabaseOperationError } from "../errors.ts"
import { db } from "../index.ts"
import { categoriesTable } from "../schema/index.ts"
import { generateUniqueCategorySlug } from "./slug.ts"

export const listCategories = (): Promise<
  Result<
    {
      id: string
      name: string
      slug: string
      description: string | null
    }[],
    DatabaseOperationError
  >
> => {
  return Result.tryPromise({
    try: () => {
      return db
        .select({
          id: categoriesTable.id,
          name: categoriesTable.name,
          slug: categoriesTable.slug,
          description: categoriesTable.description,
        })
        .from(categoriesTable)
        .orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name))
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "categories",
        cause: e,
      }),
  })
}

export const createCategory = async (input: {
  name: string
  description?: string
}): Promise<Result<SelectCategory, DatabaseOperationError>> => {
  const slug = await generateUniqueCategorySlug(input.name)

  const [category] = await db
    .insert(categoriesTable)
    .values({ name: input.name, slug, description: input.description })
    .returning()

  if (!category) {
    return Result.err(
      new DatabaseOperationError({
        operation: "insert",
        table: "categories",
        cause: new Error("Insert returned no rows"),
      }),
    )
  }

  return Result.ok(category)
}

export const updateCategory = async (input: {
  id: string
  name: string
  description?: string
}): Promise<Result<SelectCategory, DatabaseOperationError>> => {
  const slug = await generateUniqueCategorySlug(input.name, input.id)

  const [category] = await db
    .update(categoriesTable)
    .set({ name: input.name, slug, description: input.description })
    .where(eq(categoriesTable.id, input.id))
    .returning()

  if (!category) {
    return Result.err(
      new DatabaseOperationError({
        operation: "update",
        table: "categories",
        cause: new Error("Update returned no rows"),
      }),
    )
  }

  return Result.ok(category)
}

export const deleteCategory = (
  id: string,
): Promise<Result<void, DatabaseOperationError>> => {
  return Result.tryPromise({
    try: async () => {
      await db.delete(categoriesTable).where(eq(categoriesTable.id, id))
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "delete",
        table: "categories",
        cause: e,
      }),
  })
}

export const validateCategoryIds = (
  ids: string[],
): Promise<Result<boolean, DatabaseOperationError>> => {
  return Result.tryPromise({
    try: async () => {
      if (ids.length === 0) return true
      const found = await db
        .select({ id: categoriesTable.id })
        .from(categoriesTable)
        .where(inArray(categoriesTable.id, ids))
      return found.length === ids.length
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "select",
        table: "categories",
        cause: e,
      }),
  })
}
