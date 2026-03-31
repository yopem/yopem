import { ORPCError } from "@orpc/server"
import { Result } from "better-result"
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
} from "server/orpc"
import { z } from "zod"

import {
  deleteAsset,
  getAdminUploadSizeSetting,
  getAssetById,
  insertAsset,
  listAssets,
} from "db/services/assets"
import { r2Domain } from "env/hono"
import { getR2Storage } from "storage"

import { AssetNotFoundError } from "../procedure-errors"

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
  list: protectedProcedure
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
    const cachedResult = await context.redis.getCache<number>(cacheKey)

    const cached = cachedResult.match({
      ok: (v) => v,
      err: () => null,
    })

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

    void context.redis.setCache(cacheKey, maxSizeMB, SETTINGS_CACHE_TTL)

    return {
      maxSizeMB,
      maxSizeBytes: maxSizeMB * 1024 * 1024,
    }
  }),

  upload: adminProcedure
    .input(z.instanceof(File))
    .handler(async ({ context, input: file }) => {
      const cacheKey = `settings:${ASSETS_MAX_SIZE_KEY}`
      const maxSizeMBResult = await context.redis.getCache<number>(cacheKey)

      let maxSizeMB = maxSizeMBResult.match({
        ok: (v) => v,
        err: () => null,
      })

      if (maxSizeMB === null) {
        const settings = await getAdminUploadSizeSetting(ASSETS_MAX_SIZE_KEY)

        maxSizeMB =
          settings && typeof settings.settingValue === "number"
            ? settings.settingValue
            : MAX_UPLOAD_SIZE_MB

        void context.redis.setCache(cacheKey, maxSizeMB, SETTINGS_CACHE_TTL)
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
      const uploadResult = await r2.uploadAsset(
        buffer,
        file.name,
        file.type || "application/octet-stream",
      )

      if (Result.isError(uploadResult)) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `Failed to upload asset: ${uploadResult.error.message}`,
        })
      }

      const { url, type, size, key } = uploadResult.value
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
      const assetResult = await Result.tryPromise({
        try: async () => {
          const asset = await getAssetById(input.id)
          if (!asset) {
            throw new AssetNotFoundError({ assetId: input.id })
          }
          return asset
        },
        catch: (e) =>
          AssetNotFoundError.is(e)
            ? e
            : new AssetNotFoundError({ assetId: input.id }),
      })

      if (Result.isError(assetResult)) {
        throw new ORPCError("NOT_FOUND", { message: assetResult.error.message })
      }

      const r2 = getR2Storage()
      const key = assetResult.value.url.replace(r2Domain, "").replace(/^\//, "")
      await r2.deleteFile(key)

      await deleteAsset(input.id)

      return { success: true }
    }),
}
