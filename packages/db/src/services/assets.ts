import { Result } from "better-result"
import { and, desc, eq, sql } from "drizzle-orm"

import type { SelectAdminSettings } from "../schema/admin-settings.ts"

import { DatabaseOperationError, NotFoundError } from "../errors.ts"
import { db } from "../index.ts"
import { adminSettingsTable, assetsTable } from "../schema/index.ts"

export const listAssets = (input: {
  limit: number
  cursor?: string
  type?: "images" | "videos" | "documents" | "archives" | "others"
}): Promise<
  Result<{ assets: SelectAsset[]; nextCursor?: string }, DatabaseOperationError>
> => {
  return Result.tryPromise({
    try: async () => {
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
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "list",
        table: "assets",
        cause: e,
      }),
  })
}

import type { SelectAsset } from "../schema/assets.ts"

export const getAssetById = async (
  id: string,
): Promise<Result<SelectAsset, NotFoundError>> => {
  const [asset] = await db
    .select()
    .from(assetsTable)
    .where(eq(assetsTable.id, id))

  if (!asset) {
    return Result.err(new NotFoundError({ resource: "Asset", id }))
  }

  return Result.ok(asset)
}

export const insertAsset = (data: {
  filename: string
  originalName: string
  type: "images" | "videos" | "documents" | "archives" | "others"
  size: number
  url: string
}): Promise<Result<SelectAsset, DatabaseOperationError>> => {
  return Result.tryPromise({
    try: async () => {
      const [asset] = await db.insert(assetsTable).values(data).returning()

      if (!asset) {
        throw new Error("Insert returned no rows")
      }

      return asset
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "insert",
        table: "assets",
        cause: e,
      }),
  })
}

export const deleteAsset = (
  id: string,
): Promise<Result<void, DatabaseOperationError>> => {
  return Result.tryPromise({
    try: async () => {
      await db.delete(assetsTable).where(eq(assetsTable.id, id))
    },
    catch: (e) =>
      new DatabaseOperationError({
        operation: "delete",
        table: "assets",
        cause: e,
      }),
  })
}

export const getAdminUploadSizeSetting = async (
  key: string,
): Promise<Result<SelectAdminSettings, NotFoundError>> => {
  const [settings] = await db
    .select()
    .from(adminSettingsTable)
    .where(eq(adminSettingsTable.settingKey, key))

  if (!settings) {
    return Result.err(new NotFoundError({ resource: "AdminSettings", id: key }))
  }

  return Result.ok(settings)
}
