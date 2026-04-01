import { Result } from "better-result"
import { asc, eq, inArray } from "drizzle-orm"

import type { SelectTag } from "../schema/tags.ts"

import { DatabaseOperationError } from "../errors.ts"
import { db } from "../index.ts"
import { tagsTable } from "../schema/index.ts"
import { generateUniqueTagSlug } from "./slug.ts"

export const listTags = () => {
  return db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      slug: tagsTable.slug,
    })
    .from(tagsTable)
    .orderBy(asc(tagsTable.name))
}

export const createTag = async (input: {
  name: string
}): Promise<Result<SelectTag, DatabaseOperationError>> => {
  const slug = await generateUniqueTagSlug(input.name)

  const [tag] = await db
    .insert(tagsTable)
    .values({ name: input.name, slug })
    .returning()

  if (!tag) {
    return Result.err(
      new DatabaseOperationError({
        operation: "insert",
        table: "tags",
        cause: new Error("Insert returned no rows"),
      }),
    )
  }

  return Result.ok(tag)
}

export const updateTag = async (input: {
  id: string
  name: string
}): Promise<Result<SelectTag, DatabaseOperationError>> => {
  const slug = await generateUniqueTagSlug(input.name, input.id)

  const [tag] = await db
    .update(tagsTable)
    .set({ name: input.name, slug })
    .where(eq(tagsTable.id, input.id))
    .returning()

  if (!tag) {
    return Result.err(
      new DatabaseOperationError({
        operation: "update",
        table: "tags",
        cause: new Error("Update returned no rows"),
      }),
    )
  }

  return Result.ok(tag)
}

export const deleteTag = async (id: string) => {
  await db.delete(tagsTable).where(eq(tagsTable.id, id))
}

export const validateTagIds = async (ids: string[]) => {
  if (ids.length === 0) return true
  const found = await db
    .select({ id: tagsTable.id })
    .from(tagsTable)
    .where(inArray(tagsTable.id, ids))
  return found.length === ids.length
}
