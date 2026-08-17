import { and, desc, eq, inArray, sql } from "drizzle-orm"

import { db } from "db"
import { adminSettingsTable } from "db/schema/admin-settings"
import type { SelectAdminSettings } from "db/schema/admin-settings"
import { assetsTable } from "db/schema/assets"
import type { SelectAsset } from "db/schema/assets"
import { productsTable } from "db/schema/products"

export const listAssets = async (input: {
  limit: number
  cursor?: string
  type?: "images" | "videos" | "documents" | "archives" | "others"
}): Promise<{ assets: SelectAsset[]; nextCursor?: string }> => {
  const conditions = []

  if (input.type) {
    conditions.push(eq(assetsTable.type, input.type))
  }

  if (input.cursor) {
    conditions.push(sql`${assetsTable.id} < ${input.cursor}`)
  }

  const assets = await db
    .select()
    .from(assetsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(assetsTable.createdAt))
    .limit(input.limit + 1)

  let nextCursor: string | undefined = undefined
  if (assets.length > input.limit) {
    const nextItem = assets.pop()
    nextCursor = nextItem?.id
  }

  return { assets, nextCursor }
}

export const getAssetById = async (id: string): Promise<SelectAsset> => {
  const [asset] = await db
    .select()
    .from(assetsTable)
    .where(eq(assetsTable.id, id))

  return asset
}

export const insertAsset = async (data: {
  filename: string
  originalName: string
  type: "images" | "videos" | "documents" | "archives" | "others"
  size: number
  url: string
}): Promise<SelectAsset> => {
  const [asset] = await db.insert(assetsTable).values(data).returning()

  return asset
}

export const deleteAsset = async (id: string): Promise<void> => {
  await db
    .update(productsTable)
    .set({ thumbnailId: null })
    .where(eq(productsTable.thumbnailId, id))
  await db.delete(assetsTable).where(eq(assetsTable.id, id))
}

export const getAssetsByIds = async (ids: string[]): Promise<SelectAsset[]> => {
  if (ids.length === 0) return []
  return await db.select().from(assetsTable).where(inArray(assetsTable.id, ids))
}

export const deleteAssets = async (
  ids: string[],
): Promise<{ success: boolean; count: number }> => {
  if (ids.length === 0) {
    return { success: true, count: 0 }
  }
  await db
    .update(productsTable)
    .set({ thumbnailId: null })
    .where(inArray(productsTable.thumbnailId, ids))
  const deleted = await db
    .delete(assetsTable)
    .where(inArray(assetsTable.id, ids))
    .returning()

  return { success: true, count: deleted.length }
}

export const getAdminUploadSizeSetting = async (
  key: string,
): Promise<SelectAdminSettings> => {
  const [settings] = await db
    .select()
    .from(adminSettingsTable)
    .where(eq(adminSettingsTable.settingKey, key))

  return settings
}
