import { asc, eq, inArray } from "drizzle-orm"

import { db } from "db"
import { tagsTable } from "db/schema"
import type { SelectTag } from "db/schema/tags"

import { assertSlugAvailable, generateUniqueTagSlug } from "./slug"

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

export const getTag = async (id: string): Promise<SelectTag | null> => {
  const [tag] = await db
    .select()
    .from(tagsTable)
    .where(eq(tagsTable.id, id))
    .limit(1)
  return tag ?? null
}

export const createTag = async (input: {
  name: string
  slug?: string
}): Promise<SelectTag> => {
  const slug = input.slug
    ? await assertSlugAvailable("tag", input.slug)
    : await generateUniqueTagSlug(input.name)

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
  slug?: string
}): Promise<SelectTag> => {
  const slug = input.slug
    ? await assertSlugAvailable("tag", input.slug, input.id)
    : await generateUniqueTagSlug(input.name, input.id)

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

export const deleteTags = async (
  ids: string[],
): Promise<{ success: boolean; count: number }> => {
  if (ids.length === 0) {
    return { success: true, count: 0 }
  }
  const deleted = await db
    .delete(tagsTable)
    .where(inArray(tagsTable.id, ids))
    .returning()
  return { success: true, count: deleted.length }
}

export const validateTagIds = async (ids: string[]): Promise<boolean> => {
  if (ids.length === 0) return true
  const found = await db
    .select({ id: tagsTable.id })
    .from(tagsTable)
    .where(inArray(tagsTable.id, ids))
  return found.length === ids.length
}
