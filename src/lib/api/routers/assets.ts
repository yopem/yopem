import { and, desc, eq, sql } from "drizzle-orm"
import { z } from "zod"

import { adminProcedure, publicProcedure } from "@/lib/api/orpc"
import { adminSettingsTable, assetsTable } from "@/lib/db/schema"
import { r2Domain } from "@/lib/env/server"
import { getR2Storage } from "@/lib/storage/r2"

const MAX_UPLOAD_SIZE_MB = 50
const ASSETS_MAX_SIZE_KEY = "assets_max_upload_size_mb"

const listAssetsInputSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  type: z
    .enum(["images", "videos", "documents", "archives", "others"])
    .optional(),
})

const deleteAssetInputSchema = z.object({
  id: z.string(),
})

export const assetsRouter = {
  list: publicProcedure
    .input(listAssetsInputSchema.optional())
    .handler(async ({ context, input }) => {
      const limit = input?.limit ?? 20
      const conditions = []

      if (input?.type) {
        conditions.push(eq(assetsTable.type, input.type))
      }

      if (input?.cursor) {
        conditions.push(sql`${assetsTable.id} < ${input.cursor}`)
      }

      const assets = await context.db
        .select()
        .from(assetsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(assetsTable.createdAt))
        .limit(limit + 1)

      let nextCursor: string | undefined = undefined
      if (assets.length > limit) {
        const nextItem = assets.pop()
        nextCursor = nextItem?.id
      }

      return { assets, nextCursor }
    }),

  getUploadSettings: publicProcedure.handler(async ({ context }) => {
    const [settings] = await context.db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.settingKey, ASSETS_MAX_SIZE_KEY))

    const maxSizeMB =
      settings && typeof settings.settingValue === "number"
        ? settings.settingValue
        : MAX_UPLOAD_SIZE_MB

    return {
      maxSizeMB,
      maxSizeBytes: maxSizeMB * 1024 * 1024,
    }
  }),

  upload: adminProcedure
    .input(z.instanceof(File))
    .handler(async ({ context, input: file }) => {
      // Get max upload size from settings
      const [settings] = await context.db
        .select()
        .from(adminSettingsTable)
        .where(eq(adminSettingsTable.settingKey, ASSETS_MAX_SIZE_KEY))

      const maxSizeMB =
        settings && typeof settings.settingValue === "number"
          ? settings.settingValue
          : MAX_UPLOAD_SIZE_MB
      const maxSizeBytes = maxSizeMB * 1024 * 1024

      // Validate size
      if (file.size > maxSizeBytes) {
        throw new Error(`File size exceeds ${maxSizeMB}MB limit`)
      }

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Upload to R2
      const r2 = getR2Storage()
      const { url, type, size, key } = await r2.uploadAsset(
        buffer,
        file.name,
        file.type || "application/octet-stream",
      )

      // Save to database
      const [asset] = await context.db
        .insert(assetsTable)
        .values({
          filename: key.split("/").pop()!,
          originalName: file.name,
          type,
          size,
          url,
        })
        .returning()

      return asset
    }),

  delete: adminProcedure
    .input(deleteAssetInputSchema)
    .handler(async ({ context, input }) => {
      // Get asset from database
      const [asset] = await context.db
        .select()
        .from(assetsTable)
        .where(eq(assetsTable.id, input.id))

      if (!asset) {
        throw new Error("Asset not found")
      }

      // Delete from R2
      const r2 = getR2Storage()
      const key = asset.url.replace(r2Domain, "").replace(/^\//, "")
      await r2.deleteFile(key)

      // Delete from database
      await context.db.delete(assetsTable).where(eq(assetsTable.id, input.id))

      return { success: true }
    }),
}
