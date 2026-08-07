import { ORPCError } from "@orpc/server"
import { getR2Storage } from "server/storage"
import * as v from "valibot"

import { redisCache } from "cache"
import { getOrCompute } from "cache/with-cache"
import { assetSchema, assetTypeEnum } from "db/schema/assets"
import {
  deleteAsset,
  deleteAssets,
  getAdminUploadSizeSetting,
  getAssetById,
  getAssetsByIds,
  insertAsset,
  listAssets,
} from "db/services/assets"
import { generateUniqueAssetFilename } from "db/services/slug"

import { os, requireAdminMiddleware, requireAuthMiddleware } from "./orpc"

const MAX_UPLOAD_SIZE_MB = 50
const ASSETS_MAX_SIZE_KEY = "assets_max_upload_size_mb"
const SETTINGS_CACHE_TTL = 300

const getMaxUploadSizeMB = () =>
  getOrCompute(
    redisCache,
    `settings:${ASSETS_MAX_SIZE_KEY}`,
    async () => {
      const settings = await getAdminUploadSizeSetting(ASSETS_MAX_SIZE_KEY)
      return settings && typeof settings.settingValue === "number"
        ? settings.settingValue
        : MAX_UPLOAD_SIZE_MB
    },
    SETTINGS_CACHE_TTL,
  )

const uploadSettingsOutputSchema = v.object({
  maxSizeMB: v.number(),
  maxSizeBytes: v.number(),
})

const assetListInputSchema = v.object({
  limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 20),
  cursor: v.optional(v.string()),
  type: v.optional(v.picklist(assetTypeEnum)),
})

const assetListOutputSchema = v.object({
  assets: v.array(assetSchema),
  nextCursor: v.optional(v.string()),
})

const assetDeleteInputSchema = v.object({ id: v.string() })

export const assetsRouter = {
  assets: {
    uploadSettings: os
      .route({ method: "GET" })
      .output(uploadSettingsOutputSchema)
      .handler(async () => {
        const maxSizeMB = await getMaxUploadSizeMB()
        return {
          maxSizeMB,
          maxSizeBytes: maxSizeMB * 1024 * 1024,
        }
      }),

    list: os
      .route({ method: "GET" })
      .use(requireAuthMiddleware)
      .input(assetListInputSchema)
      .output(assetListOutputSchema)
      .handler(({ input }) =>
        listAssets({
          limit: input.limit ?? 20,
          cursor: input.cursor,
          type: input.type,
        }),
      ),

    upload: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(v.file())
      .output(assetSchema)
      .handler(async ({ input }) => {
        const file = input

        if (!(file instanceof File)) {
          throw new ORPCError("BAD_REQUEST", {
            status: 400,
            message: "Missing file",
          })
        }

        const maxSizeMB = await getMaxUploadSizeMB()
        const maxSizeBytes = maxSizeMB * 1024 * 1024

        if (file.size > maxSizeBytes) {
          throw new ORPCError("BAD_REQUEST", {
            status: 400,
            message: `File size exceeds ${maxSizeMB}MB limit`,
          })
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const r2 = getR2Storage()
        const type = r2.classifyFileType(
          file.type || "application/octet-stream",
          file.name,
        )
        const filename = await generateUniqueAssetFilename(file.name, type)

        let uploadResult: {
          url: string
          type: "images" | "videos" | "documents" | "archives" | "others"
          size: number
          key: string
        }

        try {
          uploadResult = await r2.uploadAsset(
            buffer,
            file.name,
            file.type || "application/octet-stream",
            filename,
          )
        } catch (error) {
          throw new ORPCError("BAD_REQUEST", {
            status: 400,
            message: `Failed to upload asset: ${error instanceof Error ? error.message : String(error)}`,
          })
        }

        const { url, size, key } = uploadResult

        const asset = await insertAsset({
          filename: key.split("/").pop()!,
          originalName: file.name,
          type,
          size,
          url,
        })

        return asset
      }),

    delete: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(assetDeleteInputSchema)
      .output(v.object({ success: v.boolean() }))
      .handler(async ({ input }) => {
        const asset = await getAssetById(input.id)

        if (!asset) {
          throw new ORPCError("NOT_FOUND", {
            status: 404,
            message: `Asset not found: ${input.id}`,
          })
        }

        const r2 = getR2Storage()
        const key = new URL(asset.url).pathname.replace(/^\//, "")

        try {
          await r2.deleteFile(key)
        } catch (error) {
          throw new ORPCError("BAD_REQUEST", {
            status: 400,
            message: `Failed to delete asset from storage: ${error instanceof Error ? error.message : String(error)}`,
          })
        }

        await deleteAsset(input.id)

        return { success: true }
      }),

    bulkDelete: os
      .route({ method: "POST" })
      .use(requireAuthMiddleware)
      .use(requireAdminMiddleware)
      .input(v.object({ ids: v.pipe(v.array(v.string()), v.minLength(1)) }))
      .output(v.object({ success: v.boolean(), count: v.number() }))
      .handler(async ({ input }) => {
        const assets = await getAssetsByIds(input.ids)
        const r2 = getR2Storage()
        for (const asset of assets) {
          try {
            const key = new URL(asset.url).pathname.replace(/^\//, "")
            await r2.deleteFile(key)
          } catch {
            // best-effort R2 deletion for bulk
          }
        }
        return deleteAssets(input.ids)
      }),
  },
}
