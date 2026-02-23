import { ORPCError } from "@orpc/server"
import {
  deleteAsset,
  getAdminUploadSizeSetting,
  getAssetById,
  insertAsset,
  listAssets,
} from "@repo/db/services/assets"
import { r2Domain } from "@repo/env/hono"
import { adminProcedure, publicProcedure } from "@repo/server/orpc"
import { getR2Storage } from "@repo/storage"
import { z } from "zod"

const MAX_UPLOAD_SIZE_MB = 50
const ASSETS_MAX_SIZE_KEY = "assets_max_upload_size_mb"
const SETTINGS_CACHE_TTL = 300

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
    .handler(({ input }) => {
      return listAssets({
        limit: input?.limit ?? 20,
        cursor: input?.cursor,
        type: input?.type,
      })
    }),

  getUploadSettings: publicProcedure.handler(async ({ context }) => {
    const cacheKey = `settings:${ASSETS_MAX_SIZE_KEY}`
    const cached = await context.redis.getCache<number>(cacheKey)

    if (cached !== null) {
      return {
        maxSizeMB: cached,
        maxSizeBytes: cached * 1024 * 1024,
      }
    }

    const settings = await getAdminUploadSizeSetting(ASSETS_MAX_SIZE_KEY)

    const maxSizeMB =
      settings && typeof settings.settingValue === "number"
        ? settings.settingValue
        : MAX_UPLOAD_SIZE_MB

    await context.redis.setCache(cacheKey, maxSizeMB, SETTINGS_CACHE_TTL)

    return {
      maxSizeMB,
      maxSizeBytes: maxSizeMB * 1024 * 1024,
    }
  }),

  upload: adminProcedure
    .input(z.instanceof(File))
    .handler(async ({ context, input: file }) => {
      const cacheKey = `settings:${ASSETS_MAX_SIZE_KEY}`
      let maxSizeMB = await context.redis.getCache<number>(cacheKey)

      if (maxSizeMB === null) {
        const settings = await getAdminUploadSizeSetting(ASSETS_MAX_SIZE_KEY)

        maxSizeMB =
          settings && typeof settings.settingValue === "number"
            ? settings.settingValue
            : MAX_UPLOAD_SIZE_MB

        await context.redis.setCache(cacheKey, maxSizeMB, SETTINGS_CACHE_TTL)
      }

      const maxSizeBytes = maxSizeMB * 1024 * 1024

      if (file.size > maxSizeBytes) {
        throw new ORPCError("BAD_REQUEST", {
          message: `File size exceeds ${maxSizeMB}MB limit`,
        })
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const r2 = getR2Storage()
      const { url, type, size, key } = await r2.uploadAsset(
        buffer,
        file.name,
        file.type || "application/octet-stream",
      )

      return insertAsset({
        filename: key.split("/").pop()!,
        originalName: file.name,
        type,
        size,
        url,
      })
    }),

  delete: adminProcedure
    .input(deleteAssetInputSchema)
    .handler(async ({ input }) => {
      const asset = await getAssetById(input.id)

      if (!asset) {
        throw new ORPCError("NOT_FOUND", { message: "Asset not found" })
      }

      const r2 = getR2Storage()
      const key = asset.url.replace(r2Domain, "").replace(/^\//, "")
      await r2.deleteFile(key)

      await deleteAsset(input.id)

      return { success: true }
    }),
}
