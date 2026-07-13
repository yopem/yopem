import { and, desc, eq, sql } from "drizzle-orm"

import { db } from "db"
import { adminSettingsTable, assetsTable } from "db/schema"
import type { SelectAdminSettings } from "db/schema/admin-settings"
import type { SelectAsset } from "db/schema/assets"

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
  await db.delete(assetsTable).where(eq(assetsTable.id, id))
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
