import { asc, eq, inArray } from "drizzle-orm"

import { db } from "../index"
import { tagsTable } from "../schema"

import { generateUniqueTagSlug } from "./slug"

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

export const createTag = async (input: { name: string }) => {
  const slug = await generateUniqueTagSlug(input.name)

  const [tag] = await db
    .insert(tagsTable)
    .values({ name: input.name, slug })
    .returning()

  return tag
}

export const updateTag = async (input: { id: string; name: string }) => {
  const slug = await generateUniqueTagSlug(input.name, input.id)

  const [tag] = await db
    .update(tagsTable)
    .set({ name: input.name, slug })
    .where(eq(tagsTable.id, input.id))
    .returning()

  return tag
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
