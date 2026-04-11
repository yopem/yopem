import { asc, eq, inArray } from "drizzle-orm"

import type { SelectTag } from "../schema/tags.ts"

import { db } from "../index.ts"
import { tagsTable } from "../schema/index.ts"
import { generateUniqueTagSlug } from "./slug.ts"

export const listTags = (): Promise<
  {
    id: string
    name: string
    slug: string
  }[]
> => {
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
}): Promise<SelectTag> => {
  const slug = await generateUniqueTagSlug(input.name)

  const [tag] = await db
    .insert(tagsTable)
    .values({ name: input.name, slug })
    .returning()

  if (!tag) {
    throw new Error("Insert returned no rows")
  }

  return tag
}

export const updateTag = async (input: {
  id: string
  name: string
}): Promise<SelectTag> => {
  const slug = await generateUniqueTagSlug(input.name, input.id)

  const [tag] = await db
    .update(tagsTable)
    .set({ name: input.name, slug })
    .where(eq(tagsTable.id, input.id))
    .returning()

  if (!tag) {
    throw new Error("Update returned no rows")
  }

  return tag
}

export const deleteTag = async (id: string): Promise<void> => {
  await db.delete(tagsTable).where(eq(tagsTable.id, id))
}

export const validateTagIds = async (ids: string[]): Promise<boolean> => {
  if (ids.length === 0) return true
  const found = await db
    .select({ id: tagsTable.id })
    .from(tagsTable)
    .where(inArray(tagsTable.id, ids))
  return found.length === ids.length
}
